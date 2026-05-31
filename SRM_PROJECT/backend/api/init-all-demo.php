<?php

declare(strict_types=1);

/**
 * Reset JSON demo stores (use when MySQL is not configured).
 * GET http://127.0.0.1:8080/api/init-all-demo.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../lib/demo_store.php';

$evalStore = demo_reset_store();

$otSeed = __DIR__ . '/../data/order_tracking_seed.json';
$otStore = __DIR__ . '/../data/order_tracking_store.json';

if (!is_file($otSeed) && is_file($otStore)) {
    copy($otStore, $otSeed);
}
if (is_file($otSeed)) {
    copy($otSeed, $otStore);
}

$otData = json_decode(file_get_contents($otStore) ?: '{}', true);

echo json_encode([
    'success' => true,
    'message' => 'All demo data stores are ready.',
    'demo_mode' => true,
    'supplier_evaluations' => [
        'rfqs' => count($evalStore['rfqs'] ?? []),
        'evaluations' => count($evalStore['evaluations'] ?? []),
    ],
    'order_tracking' => [
        'orders' => count($otData['orders'] ?? []),
    ],
    'endpoints' => [
        'supplier_evaluations' => '/api/supplier-evaluations.php',
        'rfq_comparison' => '/api/rfq-comparison.php',
        'order_tracking' => '/api/order-tracking.php',
        'product_orders' => '/api/product-orders.php',
        'audit_logs' => '/api/audit-logs.php',
        'rfqs' => '/api/rfqs.php',
        'purchase_orders' => '/api/purchase_orders.php',
        'bids' => '/api/bids.php',
    ],
]);
