<?php
// ============================================================
// api/bid_matrix.php — Bid Comparison Matrix (Parser Cell)
// DFD Process 2.3 | Actor: Admin (Sourcing Manager)
// Parses all supplier quotes for an RFQ into a comparison grid
// ============================================================

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

if (empty($_GET['rfq_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "rfq_id is required"]);
    exit;
}

$rfq_id = trim((string)$_GET['rfq_id']);

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

try {
    // 1. Fetch RFQ details
    $stmt = $pdo->prepare("SELECT * FROM rfqs WHERE id = ?");
    $stmt->execute([$rfq_id]);
    $rfq = $stmt->fetch();

    if (!$rfq) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "RFQ not found"]);
        exit;
    }

    // Convert fields to correct types
    $rfq['value'] = (float)$rfq['value'];
    $rfq['bids'] = (int)$rfq['bids'];

    // 2. Fetch RFQ line items
    $stmt2 = $pdo->prepare("SELECT * FROM rfq_items WHERE rfq_id = ?");
    $stmt2->execute([$rfq_id]);
    $rfq_items = $stmt2->fetchAll();

    // 3. Fetch all quotes/bids for this RFQ
    $stmt3 = $pdo->prepare("
        SELECT sq.*, u.email AS contact_email
        FROM supplier_quotes sq
        JOIN users u ON sq.supplier_id = u.id
        WHERE sq.rfq_id = ?
        ORDER BY sq.grand_total ASC
    ");
    $stmt3->execute([$rfq_id]);
    $proposals = $stmt3->fetchAll();

    if (empty($proposals)) {
        echo json_encode([
            "success"   => true,
            "rfq"       => $rfq,
            "rfq_items" => $rfq_items,
            "message"   => "No proposals submitted yet",
            "matrix"    => [],
            "supplier_summary" => []
        ]);
        exit;
    }

    // 4. Build Bid Comparison Matrix
    $matrix = [];
    foreach ($rfq_items as $rfq_item) {
        $row = [
            "item_id"   => (int)$rfq_item['id'],
            "item_name" => $rfq_item['item_name'],
            "quantity"  => (int)$rfq_item['quantity'],
            "unit"      => $rfq_item['unit'],
            "bids"      => []
        ];

        foreach ($proposals as $proposal) {
            $stmt4 = $pdo->prepare("
                SELECT * FROM supplier_quote_items
                WHERE supplier_quote_id = ? AND rfq_item_id = ?
            ");
            $stmt4->execute([$proposal['id'], $rfq_item['id']]);
            $bid_item = $stmt4->fetch();

            $row['bids'][] = [
                "proposal_id"   => $proposal['id'],
                "supplier_id"   => (int)$proposal['supplier_id'],
                "supplier_name" => $proposal['supplier_name'],
                "unit_price"    => $bid_item ? (float)$bid_item['unit_price'] : null,
                "total_price"   => $bid_item ? (float)$bid_item['line_total'] : null,
                "delivery"      => $proposal['delivery'],
                "status"        => $proposal['status']
            ];
        }

        // Tag lowest unit price per item
        $prices = array_filter(array_column($row['bids'], 'unit_price'));
        if (!empty($prices)) {
            $min_price = min($prices);
            foreach ($row['bids'] as &$bid) {
                $bid['is_lowest'] = (isset($bid['unit_price']) && $bid['unit_price'] == $min_price);
            }
        }

        $matrix[] = $row;
    }

    // 5. Supplier summary (totals row)
    $supplier_summary = [];
    foreach ($proposals as $p) {
        $supplier_summary[] = [
            "proposal_id"   => $p['id'],
            "supplier_id"   => (int)$p['supplier_id'],
            "supplier_name" => $p['supplier_name'],
            "subtotal"      => (float)$p['subtotal'],
            "tax_total"     => (float)$p['tax_total'],
            "freight"       => (float)$p['freight'],
            "grand_total"   => (float)$p['grand_total'],
            "delivery"      => $p['delivery'],
            "warranty"      => $p['warranty'],
            "score"         => (int)$p['score'],
            "best"          => (bool)$p['best'],
            "status"        => $p['status']
        ];
    }

    // Tag overall lowest bid
    $totals = array_column($supplier_summary, 'grand_total');
    if (!empty($totals)) {
        $min_total = min($totals);
        foreach ($supplier_summary as &$s) {
            $s['is_overall_lowest'] = ($s['grand_total'] == $min_total);
        }
    }

    echo json_encode([
        "success"          => true,
        "rfq"              => $rfq,
        "rfq_items"        => $rfq_items,
        "supplier_summary" => $supplier_summary,
        "matrix"           => $matrix
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "An error occurred: " . $e->getMessage()]);
}
?>
