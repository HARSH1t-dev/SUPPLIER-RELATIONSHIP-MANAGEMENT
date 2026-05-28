<?php
// ============================================================
// api/bid_matrix.php — Bid Comparison Matrix (Parser Cell)
// DFD Process 2.3 | Actor: Admin (Sourcing Manager)
// Parses all supplier bids for an RFQ into a comparison grid
// ============================================================

header("Content-Type: application/json");
require '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

if (empty($_GET['rfq_id'])) {
    http_response_code(400);
    echo json_encode(["error" => "rfq_id is required"]);
    exit;
}

$rfq_id = $_GET['rfq_id'];

// ── Fetch RFQ details ────────────────────────────────────────────────────────
$stmt = $pdo->prepare("SELECT * FROM rfq WHERE id = ?");
$stmt->execute([$rfq_id]);
$rfq = $stmt->fetch();

if (!$rfq) {
    http_response_code(404);
    echo json_encode(["error" => "RFQ not found"]);
    exit;
}

// ── Fetch RFQ line items ─────────────────────────────────────────────────────
$stmt2 = $pdo->prepare("SELECT * FROM rfq_items WHERE rfq_id = ?");
$stmt2->execute([$rfq_id]);
$rfq_items = $stmt2->fetchAll();

// ── Fetch all proposals for this RFQ ─────────────────────────────────────────
$stmt3 = $pdo->prepare("
    SELECT p.*, s.name AS supplier_name, s.contact_email
    FROM proposals p
    JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.rfq_id = ?
    ORDER BY p.total_quoted ASC
");
$stmt3->execute([$rfq_id]);
$proposals = $stmt3->fetchAll();

if (empty($proposals)) {
    echo json_encode([
        "rfq"       => $rfq,
        "message"   => "No proposals submitted yet",
        "matrix"    => []
    ]);
    exit;
}

// ── Build Bid Comparison Matrix ───────────────────────────────────────────────
// Each row = one RFQ line item
// Each column = one supplier's quoted price for that item
$matrix = [];

foreach ($rfq_items as $rfq_item) {
    $row = [
        "item_id"   => $rfq_item['id'],
        "item_name" => $rfq_item['item_name'],
        "quantity"  => $rfq_item['quantity'],
        "unit"      => $rfq_item['unit'],
        "bids"      => []
    ];

    foreach ($proposals as $proposal) {
        $stmt4 = $pdo->prepare("
            SELECT * FROM proposal_items
            WHERE proposal_id = ? AND rfq_item_id = ?
        ");
        $stmt4->execute([$proposal['id'], $rfq_item['id']]);
        $bid_item = $stmt4->fetch();

        $row['bids'][] = [
            "proposal_id"   => $proposal['id'],
            "supplier_id"   => $proposal['supplier_id'],
            "supplier_name" => $proposal['supplier_name'],
            "unit_price"    => $bid_item ? (float)$bid_item['unit_price'] : null,
            "total_price"   => $bid_item ? (float)$bid_item['total_price'] : null,
            "delivery_days" => $proposal['delivery_days'],
            "status"        => $proposal['status']
        ];
    }

    // ── Tag lowest unit price per item (parser cell highlight) ───────────────
    $prices = array_filter(array_column($row['bids'], 'unit_price'));
    if (!empty($prices)) {
        $min_price = min($prices);
        foreach ($row['bids'] as &$bid) {
            $bid['is_lowest'] = isset($bid['unit_price']) && $bid['unit_price'] == $min_price;
        }
    }

    $matrix[] = $row;
}

// ── Supplier summary (totals row) ─────────────────────────────────────────────
$supplier_summary = array_map(function($p) {
    return [
        "proposal_id"   => $p['id'],
        "supplier_id"   => $p['supplier_id'],
        "supplier_name" => $p['supplier_name'],
        "total_quoted"  => (float)$p['total_quoted'],
        "delivery_days" => $p['delivery_days'],
        "status"        => $p['status']
    ];
}, $proposals);

// ── Tag overall lowest bid ────────────────────────────────────────────────────
$totals    = array_column($supplier_summary, 'total_quoted');
$min_total = min($totals);
foreach ($supplier_summary as &$s) {
    $s['is_overall_lowest'] = ($s['total_quoted'] == $min_total);
}

echo json_encode([
    "rfq"              => $rfq,
    "rfq_items"        => $rfq_items,
    "supplier_summary" => $supplier_summary,
    "matrix"           => $matrix
]);
