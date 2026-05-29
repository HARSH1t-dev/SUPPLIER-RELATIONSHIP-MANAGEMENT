<?php
// ============================================================
// api/award_contract.php — Award Contract & Auto-Generate PO
// DFD Process 2.4 | Actor: Admin (Sourcing Manager)
// Triggered when Admin clicks "Award Contract" on winning bid
// ============================================================

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$input = is_array($input) ? $input : [];

if (empty($input['proposal_id']) || empty($input['awarded_by'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "proposal_id and awarded_by are required"]);
    exit;
}

$proposal_id = trim((string)$input['proposal_id']);
$awarded_by  = (int)$input['awarded_by'];

$config = db_config();
try {
    $pdo = new PDO("mysql:host={$config['host']};dbname={$config['name']};charset=utf8mb4", $config['user'], $config['pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "DB connection failed: " . $e->getMessage()]);
    exit;
}

// Begin Transaction (all-or-nothing)
$pdo->beginTransaction();

try {
    // 1. Fetch and validate winning proposal/quote
    $stmt = $pdo->prepare("SELECT * FROM supplier_quotes WHERE id = ?");
    $stmt->execute([$proposal_id]);
    $proposal = $stmt->fetch();

    if (!$proposal) {
        throw new Exception("Proposal not found", 404);
    }

    if ($proposal['status'] === 'awarded') {
        throw new Exception("This proposal has already been awarded", 400);
    }

    if ($proposal['status'] === 'rejected') {
        throw new Exception("Cannot award a rejected proposal", 400);
    }

    // 2. Fetch supplier user & details
    $stmtS = $pdo->prepare("
        SELECT u.id, u.full_name, u.email, u.phone, s.company_name, s.address 
        FROM users u 
        LEFT JOIN suppliers s ON s.user_id = u.id 
        WHERE u.id = ?
    ");
    $stmtS->execute([$proposal['supplier_id']]);
    $supplier = $stmtS->fetch();

    if (!$supplier) {
        throw new Exception("Supplier user account not found", 404);
    }

    $supplier_name = $supplier['company_name'] ?: $proposal['supplier_name'];

    // 3. Parse winning proposal line items
    $stmt2 = $pdo->prepare("SELECT * FROM supplier_quote_items WHERE supplier_quote_id = ?");
    $stmt2->execute([$proposal_id]);
    $proposal_items = $stmt2->fetchAll();

    if (empty($proposal_items)) {
        throw new Exception("Proposal has no line items to parse", 400);
    }

    // 4. Auto-generate unique PO number
    $year      = date('Y');
    $count     = $pdo->query("SELECT COUNT(*) FROM purchase_orders")->fetchColumn();
    $po_number = 'PO-' . $year . '-' . str_pad((int)($count + 1), 4, '0', STR_PAD_LEFT);

    // 5. Compute delivery date from supplier's quoted days (e.g. "10 Days" -> 10)
    $delivery_str = $proposal['delivery'] ?? '30 Days';
    preg_match('/\d+/', $delivery_str, $matches);
    $delivery_days = !empty($matches) ? (int)$matches[0] : 30;
    
    $order_date    = date('Y-m-d');
    $delivery_date = date('Y-m-d', strtotime('+' . $delivery_days . ' days'));

    // 6. Build legally binding terms (auto-filled template)
    $legal_terms = "PURCHASE ORDER AGREEMENT — TATA MOTORS LTD

PO Number      : {$po_number}
Issued Date    : " . date('d M Y') . "
Supplier       : {$supplier_name}
Supplier Email : {$supplier['email']}
Order Date     : {$order_date}
Delivery By    : {$delivery_date}
Total Value    : INR " . number_format((float)$proposal['grand_total'], 2) . "

TERMS & CONDITIONS:
1. This Purchase Order constitutes a legally binding procurement contract issued by Tata Motors Ltd. (hereinafter referred to as 'the Buyer').
2. The Supplier agrees to deliver all items specified herein in full, on or before the delivery date stated above.
3. Payment Terms: Net 30 days upon delivery and submission of a valid GST tax invoice.
4. Any deviation in quantity, specifications, or delivery schedule requires prior written approval from Tata Motors Procurement Department.
5. Goods not conforming to specifications will be rejected at the Supplier's expense.
6. Tata Motors reserves the right to cancel this PO if the Supplier fails to meet agreed terms, with written notice of 7 business days.
7. Governing Law: Laws of India. Jurisdiction: Jharkhand High Court.

This Purchase Order is issued electronically and is legally valid without a physical signature under the Information Technology Act, 2000.";

    // 7. Insert PO with status = 'issued'
    $stmt3 = $pdo->prepare("
        INSERT INTO purchase_orders
            (po_number, supplier_quote_id, rfq_id, supplier_id, total_amount, issued_by, expected_delivery, status, legal_terms, final_terms_agreed, issued_to_supplier)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'issued', ?, 1, 1)
    ");
    $stmt3->execute([
        $po_number,
        $proposal_id,
        $proposal['rfq_id'],
        $proposal['supplier_id'],
        $proposal['grand_total'],
        $awarded_by,
        $delivery_date,
        trim($legal_terms)
    ]);
    $po_id = $pdo->lastInsertId();

    // 8. Parse proposal items → PO line items (po_items)
    $itemStmt = $pdo->prepare("
        INSERT INTO po_items (po_id, item_name, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?)
    ");
    
    // We need to fetch details for rfq_item_id to copy item_name
    foreach ($proposal_items as $item) {
        $stmtItem = $pdo->prepare("SELECT item_name FROM rfq_items WHERE id = ?");
        $stmtItem->execute([$item['rfq_item_id']]);
        $rfq_item_name = $stmtItem->fetchColumn() ?: "Line Item";

        $itemStmt->execute([
            $po_id,
            $rfq_item_name,
            $item['quantity'],
            $item['unit_price'],
            $item['line_total']
        ]);
    }

    // 9. Mark winning proposal/quote as awarded
    $pdo->prepare("UPDATE supplier_quotes SET status = 'awarded', best = 1 WHERE id = ?")
        ->execute([$proposal_id]);
    $pdo->prepare("UPDATE bids SET status = 'awarded', best = 1 WHERE id = ?")
        ->execute([$proposal_id]);

    // 10. Reject all other proposals for this RFQ
    $pdo->prepare("
        UPDATE supplier_quotes SET status = 'rejected', best = 0
        WHERE rfq_id = ? AND id != ?
    ")->execute([$proposal['rfq_id'], $proposal_id]);
    $pdo->prepare("
        UPDATE bids SET status = 'rejected', best = 0
        WHERE rfq_package = ? AND id != ?
    ")->execute([$proposal['rfq_id'], $proposal_id]);

    // 11. Close/Award the RFQ
    $pdo->prepare("UPDATE rfqs SET status = 'Awarded' WHERE id = ?")
        ->execute([$proposal['rfq_id']]);

    // Commit transaction
    $pdo->commit();

    echo json_encode([
        "success"             => true,
        "message"             => "Contract awarded. Legally binding PO generated with status ISSUED.",
        "po_id"               => (int)$po_id,
        "po_number"           => $po_number,
        "po_status"           => "issued",
        "supplier_id"         => (int)$proposal['supplier_id'],
        "supplier_name"       => $supplier_name,
        "total_amount"        => (float)$proposal['grand_total'],
        "order_date"          => $order_date,
        "delivery_date"       => $delivery_date,
        "items_parsed"        => count($proposal_items),
        "issued_to_supplier"  => true,
        "final_terms_locked"  => true
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
