<?php

declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$connection = db_try_connection();
if ($connection === null) {
    require_once __DIR__ . '/../lib/demo_store.php';
    demo_handle_rfq_comparison();
    exit;
}

require_once __DIR__ . '/../lib/evaluation_scoring.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$rfqId = isset($_GET['rfq_id']) ? trim((string)$_GET['rfq_id']) : '';
if ($rfqId === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'rfq_id is required.']);
    exit;
}

$weights = scoring_get_weights($connection);

$quoteStmt = $connection->prepare('
    SELECT sq.*, s.rating AS supplier_rating, s.supplier_id AS supplier_table_id, u.full_name
    FROM supplier_quotes sq
    LEFT JOIN users u ON sq.supplier_id = u.id
    LEFT JOIN suppliers s ON s.user_id = sq.supplier_id
    WHERE sq.rfq_id = ?
    ORDER BY sq.grand_total ASC
');
$quoteStmt->bind_param('s', $rfqId);
$quoteStmt->execute();
$quoteResult = $quoteStmt->get_result();
$quotes = [];
while ($row = $quoteResult->fetch_assoc()) {
    $quotes[] = $row;
}
$quoteStmt->close();

if (count($quotes) === 0) {
    echo json_encode(['success' => true, 'rfq_id' => $rfqId, 'comparison' => [], 'highlights' => []]);
    exit;
}

$comparison = [];
$lowestPrice = null;
$highestRating = null;
$bestScore = null;

foreach ($quotes as $quote) {
    $supplierTableId = (int)($quote['supplier_table_id'] ?? 0);
    $compliance = $supplierTableId > 0
        ? scoring_compliance_for_supplier($connection, $supplierTableId)
        : ['status' => 'Unknown', 'score' => 50.0];

    $score = scoring_calculate_quote_score($quote, $quotes, $weights, (float)$compliance['score']);
    $deliveryDays = scoring_parse_delivery_days((string)$quote['delivery']);
    $warrantyMonths = scoring_parse_warranty_months((string)$quote['warranty']);
    $price = (float)$quote['grand_total'];
    $rating = (float)($quote['supplier_rating'] ?? 0);

    $row = [
        'bid_id' => $quote['id'],
        'supplier_id' => (int)$quote['supplier_id'],
        'supplier_name' => $quote['supplier_name'] ?: $quote['full_name'],
        'rating' => $rating,
        'quotation_price' => $price,
        'delivery_days' => $deliveryDays,
        'warranty_months' => $warrantyMonths,
        'compliance_status' => $compliance['status'],
        'total_orders' => scoring_count_completed_orders($connection, (int)$quote['supplier_id']),
        'score' => $score,
    ];
    $comparison[] = $row;

    if ($lowestPrice === null || $price < $lowestPrice['quotation_price']) {
        $lowestPrice = $row;
    }
    if ($highestRating === null || $rating > $highestRating['rating']) {
        $highestRating = $row;
    }
    if ($bestScore === null || $score > $bestScore['score']) {
        $bestScore = $row;
    }
}

echo json_encode([
    'success' => true,
    'rfq_id' => $rfqId,
    'weights' => $weights,
    'comparison' => $comparison,
    'highlights' => [
        'lowest_price_bid_id' => $lowestPrice['bid_id'] ?? null,
        'highest_rating_bid_id' => $highestRating['bid_id'] ?? null,
        'best_overall_score_bid_id' => $bestScore['bid_id'] ?? null,
    ],
]);
