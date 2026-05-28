<?php
// ============================================================
// api/award_contract.php — Award Contract & Auto-Generate PO
// DFD Process 2.4 | Actor: Admin (Sourcing Manager)
// Triggered when Admin clicks "Award Contract" on winning bid
// ============================================================

header("Content-Type: application/json");
require '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

if (empty($input['proposal_id']) || empty($input['awarded_by'])) {
    http_response_code(400);
    echo json_encode(["error" => "proposal_id and awarded_by are required"]);
    exit;
}

$proposal_id = $input['proposal_id'];
$awarded_by  = $input['awarded_by'];

// ── Begin Transaction (all-or-nothing) ──────────────────────────────────────
$pdo->beginTransaction();

try {

    // ── STEP 1: Fetch and validate winning proposal ──────────────────────────
    $stmt = $pdo->prepare("SELECT * FROM proposals WHERE id = ?");
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

    // ── STEP 2: Fetch supplier details ───────────────────────────────────────
    $stmtS = $pdo->prepare("SELECT * FROM suppliers WHERE id = ?");
    $stmtS->execute([$proposal['supplier_id']]);
    $supplier = $stmtS->fetch();

    if (!$supplier) {
        throw new Exception("Supplier not found", 404);
    }

    // ── STEP 3: Parse winning proposal line items ─────────────────────────────
    $stmt2 = $pdo->prepare("SELECT * FROM proposal_items WHERE proposal_id = ?");
    $stmt2->execute([$proposal_id]);
    $proposal_items = $stmt2->fetchAll();

    if (empty($proposal_items)) {
        throw new Exception("Proposal has no line items to parse", 400);
    }

    // ── STEP 4: Auto-generate unique PO number ───────────────────────────────
    $year      = date('Y');
    $count     = $pdo->query("SELECT COUNT(*) FROM purchase_orders")->fetchColumn();
    $po_number = 'PO-' . $year . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

    // ── STEP 5: Compute delivery date from supplier's quoted days ────────────
    $order_date    = date('Y-m-d');
    $delivery_date = date('Y-m-d', strtotime('+' . $proposal['delivery_days'] . ' days'));

    // ── STEP 6: Build legally binding terms (auto-filled template) ───────────
    $legal_terms = "PURCHASE ORDER AGREEMENT — TATA MOTORS LTD

PO Number      : {$po_number}
Issued Date    : " . date('d M Y') . "
Supplier       : {$supplier['name']}
Supplier Email : {$supplier['contact_email']}
Order Date     : {$order_date}
Delivery By    : {$delivery_date}
Total Value    : INR " . number_format($proposal['total_quoted'], 2) . "

TERMS & CONDITIONS:
1. This Purchase Order constitutes a legally binding procurement contract issued by
   Tata Motors Ltd. (hereinafter referred to as 'the Buyer').
2. The Supplier agrees to deliver all items specified herein in full, on or before
   the delivery date stated above.
3. Payment Terms: Net 30 days upon delivery and submission of a valid GST tax invoice.
4. Any deviation in quantity, specifications, or delivery schedule requires prior
   written approval from Tata Motors Procurement Department.
5. Goods not conforming to specifications will be rejected at the Supplier's expense.
6. Tata Motors reserves the right to cancel this PO if the Supplier fails to meet
   agreed terms, with written notice of 7 business days.
7. Governing Law: Laws of India. Jurisdiction: Jharkhand High Court.

This Purchase Order is issued electronically and is legally valid without a
physical signature under the Information Technology Act, 2000.";

    // ── STEP 7: Insert PO with status = 'issued' ─────────────────────────────
    $stmt3 = $pdo->prepare("
        INSERT INTO purchase_orders
            (po_number, rfq_id, proposal_id, supplier_id, awarded_by,
             order_date, delivery_date, total_amount, status,
             legal_terms, final_terms_agreed, issued_to_supplier)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued', ?, 1, 0)
    ");
    $stmt3->execute([
        $po_number,
        $proposal['rfq_id'],
        $proposal_id,
        $proposal['supplier_id'],
        $awarded_by,
        $order_date,
        $delivery_date,
        $proposal['total_quoted'],
        trim($legal_terms)
    ]);
    $po_id = $pdo->lastInsertId();

    // ── STEP 8: Parse proposal items → PO line items (Parser Cell) ───────────
    $itemStmt = $pdo->prepare("
        INSERT INTO po_items (po_id, item_name, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?)
    ");
    foreach ($proposal_items as $item) {
        $itemStmt->execute([
            $po_id,
            $item['item_name'],
            $item['quantity'],
            $item['unit_price'],
            $item['total_price']
        ]);
    }

    // ── STEP 9: Mark winning proposal as awarded ─────────────────────────────
    $pdo->prepare("UPDATE proposals SET status = 'awarded' WHERE id = ?")
        ->execute([$proposal_id]);

    // ── STEP 10: Reject all other proposals for this RFQ ────────────────────
    $pdo->prepare("
        UPDATE proposals SET status = 'rejected'
        WHERE rfq_id = ? AND id != ?
    ")->execute([$proposal['rfq_id'], $proposal_id]);

    // ── STEP 11: Close the RFQ ───────────────────────────────────────────────
    $pdo->prepare("UPDATE rfq SET status = 'awarded' WHERE id = ?")
        ->execute([$proposal['rfq_id']]);

    // ── STEP 12: Sync PO to Supplier Portal ─────────────────────────────────
    $pdo->prepare("UPDATE purchase_orders SET issued_to_supplier = 1 WHERE id = ?")
        ->execute([$po_id]);

    // ── Commit everything ────────────────────────────────────────────────────
    $pdo->commit();

    echo json_encode([
        "status"              => "success",
        "message"             => "Contract awarded. Legally binding PO generated with status ISSUED.",
        "po_id"               => $po_id,
        "po_number"           => $po_number,
        "po_status"           => "issued",
        "supplier_id"         => $proposal['supplier_id'],
        "supplier_name"       => $supplier['name'],
        "total_amount"        => $proposal['total_quoted'],
        "order_date"          => $order_date,
        "delivery_date"       => $delivery_date,
        "items_parsed"        => count($proposal_items),
        "issued_to_supplier"  => true,
        "final_terms_locked"  => true
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    $code = $e->getCode() >= 400 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["error" => $e->getMessage()]);
}
