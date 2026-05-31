<?php

declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../lib/demo_store.php';

$store = demo_reset_store();

echo json_encode([
    'success' => true,
    'message' => 'Demo data loaded. Supplier evaluation works without MySQL.',
    'demo_mode' => true,
    'rfqs' => count($store['rfqs'] ?? []),
    'evaluations' => count($store['evaluations'] ?? []),
    'metrics' => demo_compute_metrics($store['evaluations'] ?? []),
]);
