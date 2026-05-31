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
require_once __DIR__ . '/../lib/order_tracking_lib.php';

function po_line_templates(): array
{
    return [
        1 => [
            ['sku' => 'PRD-4401', 'product_name' => 'Steel Bearings SB-100', 'category' => 'Mechanical', 'quantity' => 1000, 'unit_price' => 75.0],
            ['sku' => 'PRD-4405', 'product_name' => 'Brass Bushings BB-50', 'category' => 'Mechanical', 'quantity' => 500, 'unit_price' => 44.0],
        ],
        2 => [
            ['sku' => 'PRD-LAP-01', 'product_name' => 'Business Laptop 14"', 'category' => 'IT Equipment', 'quantity' => 50, 'unit_price' => 970.0],
        ],
        3 => [
            ['sku' => 'PRD-LAP-02', 'product_name' => 'Business Laptop 14" (Alt spec)', 'category' => 'IT Equipment', 'quantity' => 50, 'unit_price' => 920.0],
        ],
        4 => [
            ['sku' => 'PRD-RACK-01', 'product_name' => 'Heavy Duty Steel Racks', 'category' => 'Facilities', 'quantity' => 20, 'unit_price' => 2250.0],
        ],
    ];
}

function demo_build_product_orders(): array
{
    $storePath = __DIR__ . '/../data/order_tracking_store.json';
    if (!is_file($storePath)) {
        return ['success' => true, 'demo_mode' => true, 'lines' => []];
    }

    $store = json_decode(file_get_contents($storePath), true);
    $orders = $store['orders'] ?? [];
    $templates = po_line_templates();
    $lines = [];

    foreach ($orders as $order) {
        $poId = (int)($order['po_id'] ?? $order['id']);
        $items = $templates[$poId] ?? [
            [
                'sku' => 'PRD-GEN',
                'product_name' => $order['rfq_title'] ?? 'Procurement line item',
                'category' => 'General',
                'quantity' => 1,
                'unit_price' => (float)($order['total_amount'] ?? 0),
            ],
        ];

        $trackingStatus = $order['tracking_status'] ?? 'PO_CREATED';
        $events = $store['events'][(string)$poId] ?? [];

        foreach ($items as $idx => $item) {
            $lineTotal = $item['quantity'] * $item['unit_price'];
            $lines[] = [
                'id' => $poId . '-' . $idx,
                'po_id' => $poId,
                'po_number' => $order['po_number'],
                'sku' => $item['sku'],
                'product_name' => $item['product_name'],
                'category' => $item['category'],
                'supplier_name' => $order['supplier_name'],
                'quantity' => (int)$item['quantity'],
                'unit_price' => (float)$item['unit_price'],
                'line_total' => $lineTotal,
                'order_date' => $order['order_date'],
                'delivery_date' => $order['delivery_date'],
                'tracking_status' => $trackingStatus,
                'tracking_number' => $order['tracking_number'],
                'progress_percent' => ot_progress_for_status($trackingStatus),
                'latest_checkpoint' => $order['latest_checkpoint'] ?? '',
                'rfq_title' => $order['rfq_title'] ?? '',
                'events' => $events,
            ];
        }
    }

    usort($lines, static fn ($a, $b) => strcmp($b['order_date'], $a['order_date']));

    return ['success' => true, 'demo_mode' => true, 'lines' => $lines];
}

function db_build_product_orders(mysqli $connection): array
{
    $sql = "
        SELECT po.po_id, po.po_number, po.supplier_id, po.total_amount,
               po.issued_date AS order_date, po.expected_delivery AS delivery_date,
               po.status, po.tracking_status, po.tracking_number, po.rfq_id,
               s.company_name AS supplier_name, r.title AS rfq_title
        FROM purchase_orders po
        LEFT JOIN users u ON po.supplier_id = u.id
        LEFT JOIN suppliers s ON s.user_id = u.id
        LEFT JOIN rfqs r ON po.rfq_id = r.id
        ORDER BY po.issued_date DESC
    ";
    $result = $connection->query($sql);
    $lines = [];

    while ($po = $result->fetch_assoc()) {
        $poId = (int)$po['po_id'];
        $trackingStatus = $po['tracking_status'] ?: 'PO_CREATED';

        $itemStmt = $connection->prepare('SELECT item_name, quantity, unit_price, total_price FROM po_items WHERE po_id = ?');
        $itemStmt->bind_param('i', $poId);
        $itemStmt->execute();
        $itemRes = $itemStmt->get_result();
        $items = [];
        while ($row = $itemRes->fetch_assoc()) {
            $items[] = $row;
        }
        $itemStmt->close();

        if (empty($items)) {
            $items[] = [
                'item_name' => $po['rfq_title'] ?: 'Procurement line',
                'quantity' => 1,
                'unit_price' => (float)$po['total_amount'],
                'total_price' => (float)$po['total_amount'],
            ];
        }

        $eventStmt = $connection->prepare('
            SELECT e.id, e.po_id, e.status, e.description, e.created_at, u.full_name AS updated_by_name
            FROM order_tracking_events e
            LEFT JOIN users u ON e.updated_by = u.id
            WHERE e.po_id = ?
            ORDER BY e.created_at ASC
        ');
        $eventStmt->bind_param('i', $poId);
        $eventStmt->execute();
        $eventRes = $eventStmt->get_result();
        $events = [];
        while ($ev = $eventRes->fetch_assoc()) {
            $events[] = $ev;
        }
        $eventStmt->close();

        foreach ($items as $idx => $item) {
            $lines[] = [
                'id' => $poId . '-' . $idx,
                'po_id' => $poId,
                'po_number' => $po['po_number'],
                'sku' => 'LINE-' . $poId . '-' . ($idx + 1),
                'product_name' => $item['item_name'],
                'category' => 'Procurement',
                'supplier_name' => $po['supplier_name'],
                'quantity' => (int)$item['quantity'],
                'unit_price' => (float)$item['unit_price'],
                'line_total' => (float)$item['total_price'],
                'order_date' => $po['order_date'],
                'delivery_date' => $po['delivery_date'],
                'tracking_status' => $trackingStatus,
                'tracking_number' => $po['tracking_number'],
                'progress_percent' => ot_progress_for_status($trackingStatus),
                'latest_checkpoint' => !empty($events) ? end($events)['description'] : 'PO issued',
                'rfq_title' => $po['rfq_title'],
                'events' => $events,
            ];
        }
    }

    return ['success' => true, 'lines' => $lines];
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$connection = db_try_connection();
if ($connection === null) {
    echo json_encode(demo_build_product_orders());
    exit;
}

try {
    echo json_encode(db_build_product_orders($connection));
} catch (Throwable $e) {
    echo json_encode(demo_build_product_orders());
}
