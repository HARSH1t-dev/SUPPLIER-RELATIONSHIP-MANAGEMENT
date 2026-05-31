<?php

declare(strict_types=1);

require_once __DIR__ . '/order_tracking_lib.php';
require_once __DIR__ . '/audit_helper.php';

function ot_demo_path(): string
{
    return __DIR__ . '/../data/order_tracking_store.json';
}

function ot_demo_load(): array
{
    $raw = file_get_contents(ot_demo_path());
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : ['orders' => [], 'events' => []];
}

function ot_demo_save(array $data): void
{
    $data['demo_mode'] = true;
    file_put_contents(ot_demo_path(), json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function ot_demo_find_order(array $store, int $poId): ?array
{
    foreach ($store['orders'] as $order) {
        if ((int)($order['po_id'] ?? $order['id']) === $poId) {
            return $order;
        }
    }
    return null;
}

function ot_demo_enrich_order(array $store, array $order): array
{
    $poId = (int)($order['po_id'] ?? $order['id']);
    $events = $store['events'][(string)$poId] ?? [];
    $last = !empty($events) ? end($events) : null;
    $trackingStatus = $last['status'] ?? 'PO_CREATED';

    $order['tracking_status'] = $trackingStatus;
    $order['progress_percent'] = ot_progress_for_status($trackingStatus);
    $order['latest_checkpoint'] = $last['description'] ?? 'Purchase order issued';
    return $order;
}

function ot_demo_handle(): void
{
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    $store = ot_demo_load();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        if (isset($_GET['list']) && $_GET['list'] === '1') {
            $orders = array_map(static fn ($o) => ot_demo_enrich_order($store, $o), $store['orders'] ?? []);
            echo json_encode(['success' => true, 'demo_mode' => true, 'orders' => $orders]);
            exit;
        }

        $supplierId = isset($_GET['supplier_id']) ? (int)$_GET['supplier_id'] : 0;
        if ($supplierId > 0) {
            $orders = [];
            foreach ($store['orders'] as $order) {
                if ((int)($order['supplier_id'] ?? 0) === $supplierId) {
                    $orders[] = ot_demo_enrich_order($store, $order);
                }
            }
            echo json_encode(['success' => true, 'demo_mode' => true, 'orders' => $orders]);
            exit;
        }

        $poId = isset($_GET['po_id']) ? (int)$_GET['po_id'] : 0;
        if ($poId > 0) {
            $order = ot_demo_find_order($store, $poId);
            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Purchase order not found.']);
                exit;
            }
            $order = ot_demo_enrich_order($store, $order);
            $events = $store['events'][(string)$poId] ?? [];
            echo json_encode([
                'success' => true,
                'demo_mode' => true,
                'order' => $order,
                'events' => $events,
                'timeline' => ot_build_timeline($events),
            ]);
            exit;
        }

        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'po_id, supplier_id, or list=1 required.']);
        exit;
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $input = is_array($input) ? $input : [];

        $poId = (int)($input['po_id'] ?? 0);
        $action = trim((string)($input['action'] ?? ''));
        $updatedBy = isset($input['updated_by']) ? (int)$input['updated_by'] : null;

        if ($poId <= 0 || $action === '') {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'po_id and action are required.']);
            exit;
        }

        if (!isset(OT_SUPPLIER_ACTIONS[$action])) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Invalid supplier action.']);
            exit;
        }

        $order = ot_demo_find_order($store, $poId);
        if (!$order) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Purchase order not found.']);
            exit;
        }

        $newStatus = OT_SUPPLIER_ACTIONS[$action]['status'];
        $poNumber = $order['po_number'] ?? ('PO-' . $poId);
        $eventId = (int)($store['next_event_id'] ?? 1);

        $event = [
            'id' => $eventId,
            'po_id' => $poId,
            'status' => $newStatus,
            'description' => ot_action_description($newStatus, $poNumber),
            'updated_by' => $updatedBy,
            'updated_by_name' => $updatedBy === 2 ? 'Supplier User' : 'Admin User',
            'created_at' => date('Y-m-d H:i:s'),
        ];

        if (!isset($store['events'][(string)$poId])) {
            $store['events'][(string)$poId] = [];
        }
        $store['events'][(string)$poId][] = $event;
        $store['next_event_id'] = $eventId + 1;

        foreach ($store['orders'] as $idx => $o) {
            if ((int)($o['po_id'] ?? $o['id']) === $poId) {
                $store['orders'][$idx]['status'] = ot_po_status_for_tracking($newStatus);
                $store['orders'][$idx]['tracking_status'] = $newStatus;
                $store['orders'][$idx]['progress_percent'] = ot_progress_for_status($newStatus);
                $store['orders'][$idx]['latest_checkpoint'] = $event['description'];
                if ($newStatus === 'DISPATCHED' && empty($store['orders'][$idx]['tracking_number'])) {
                    $store['orders'][$idx]['tracking_number'] = 'TRK-' . strtoupper(substr(md5((string)$poId), 0, 8));
                }
                break;
            }
        }

        ot_demo_save($store);

        $order = ot_demo_enrich_order($store, ot_demo_find_order($store, $poId));
        $events = $store['events'][(string)$poId];

        echo json_encode([
            'success' => true,
            'demo_mode' => true,
            'message' => 'Tracking updated.',
            'order' => $order,
            'events' => $events,
            'timeline' => ot_build_timeline($events),
        ]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
}
