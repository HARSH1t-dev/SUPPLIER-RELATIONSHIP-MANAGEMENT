<?php

declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/order_tracking_lib.php';

$connection = db_try_connection();
if ($connection === null) {
    require_once __DIR__ . '/../lib/order_tracking_demo.php';
    ot_demo_handle();
    exit;
}

require_once __DIR__ . '/../lib/audit_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

function ot_fetch_po(mysqli $connection, int $poId): ?array
{
    $stmt = $connection->prepare("
        SELECT po.po_id AS id, po.po_id, po.po_number, po.supplier_id, po.rfq_id, po.total_amount,
               po.issued_date AS order_date, po.expected_delivery AS delivery_date, po.status,
               po.tracking_status, po.tracking_number,
               s.company_name AS supplier_name, u.email AS supplier_email, u.phone AS supplier_phone,
               u.full_name AS supplier_contact, r.id AS rfq_number, r.title AS rfq_title,
               ui.full_name AS awarded_by_name
        FROM purchase_orders po
        LEFT JOIN users u ON po.supplier_id = u.id
        LEFT JOIN suppliers s ON s.user_id = u.id
        LEFT JOIN rfqs r ON po.rfq_id = r.id
        LEFT JOIN users ui ON po.issued_by = ui.id
        WHERE po.po_id = ?
        LIMIT 1
    ");
    $stmt->bind_param('i', $poId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return $row ?: null;
}

function ot_fetch_events(mysqli $connection, int $poId): array
{
    $stmt = $connection->prepare("
        SELECT e.id, e.po_id, e.status, e.description, e.updated_by, e.created_at,
               u.full_name AS updated_by_name
        FROM order_tracking_events e
        LEFT JOIN users u ON e.updated_by = u.id
        WHERE e.po_id = ?
        ORDER BY e.created_at ASC, e.id ASC
    ");
    $stmt->bind_param('i', $poId);
    $stmt->execute();
    $result = $stmt->get_result();
    $events = [];
    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int)$row['id'];
        $row['po_id'] = (int)$row['po_id'];
        $events[] = $row;
    }
    $stmt->close();
    return $events;
}

function ot_enrich_order(array $po, array $events): array
{
    $last = !empty($events) ? end($events) : null;
    $trackingStatus = $po['tracking_status'] ?: ($last['status'] ?? 'PO_CREATED');

    $po['id'] = (int)$po['id'];
    $po['po_id'] = (int)$po['po_id'];
    $po['supplier_id'] = (int)($po['supplier_id'] ?? 0);
    $po['total_amount'] = (float)($po['total_amount'] ?? 0);
    $po['tracking_status'] = $trackingStatus;
    $po['progress_percent'] = ot_progress_for_status($trackingStatus);
    $po['latest_checkpoint'] = $last['description'] ?? 'Purchase order issued';
    return $po;
}

function ot_list_orders(mysqli $connection, ?int $supplierId = null): array
{
    $sql = "
        SELECT po.po_id AS id, po.po_id, po.po_number, po.supplier_id, po.total_amount,
               po.issued_date AS order_date, po.expected_delivery AS delivery_date, po.status,
               po.tracking_status, po.tracking_number,
               s.company_name AS supplier_name, r.id AS rfq_number, r.title AS rfq_title
        FROM purchase_orders po
        LEFT JOIN users u ON po.supplier_id = u.id
        LEFT JOIN suppliers s ON s.user_id = u.id
        LEFT JOIN rfqs r ON po.rfq_id = r.id
    ";
    if ($supplierId) {
        $sql .= ' WHERE po.supplier_id = ?';
    }
    $sql .= ' ORDER BY po.issued_date DESC';

    if ($supplierId) {
        $stmt = $connection->prepare($sql);
        $stmt->bind_param('i', $supplierId);
    } else {
        $stmt = $connection->prepare($sql);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $poId = (int)$row['po_id'];
        $events = ot_fetch_events($connection, $poId);
        if (empty($events)) {
            $events = [[
                'status' => 'PO_CREATED',
                'description' => 'Purchase order ' . $row['po_number'] . ' issued.',
                'created_at' => $row['order_date'],
            ]];
        }
        $orders[] = ot_enrich_order($row, $events);
    }
    $stmt->close();
    return $orders;
}

if ($method === 'GET') {
    if (isset($_GET['list']) && $_GET['list'] === '1') {
        echo json_encode(['success' => true, 'orders' => ot_list_orders($connection)]);
        exit;
    }

    $supplierId = isset($_GET['supplier_id']) ? (int)$_GET['supplier_id'] : 0;
    if ($supplierId > 0) {
        echo json_encode(['success' => true, 'orders' => ot_list_orders($connection, $supplierId)]);
        exit;
    }

    $poId = isset($_GET['po_id']) ? (int)$_GET['po_id'] : 0;
    if ($poId > 0) {
        $po = ot_fetch_po($connection, $poId);
        if (!$po) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Purchase order not found.']);
            exit;
        }
        $events = ot_fetch_events($connection, $poId);
        if (empty($events)) {
            $events = [[
                'id' => 0,
                'po_id' => $poId,
                'status' => 'PO_CREATED',
                'description' => ot_action_description('PO_CREATED', $po['po_number']),
                'updated_by' => null,
                'updated_by_name' => 'System',
                'created_at' => $po['order_date'],
            ]];
        }
        echo json_encode([
            'success' => true,
            'order' => ot_enrich_order($po, $events),
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
    $customStatus = trim((string)($input['status'] ?? ''));

    if ($poId <= 0) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'po_id is required.']);
        exit;
    }

    $po = ot_fetch_po($connection, $poId);
    if (!$po) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Purchase order not found.']);
        exit;
    }

    if ($action !== '' && isset(OT_SUPPLIER_ACTIONS[$action])) {
        $newStatus = OT_SUPPLIER_ACTIONS[$action]['status'];
    } elseif ($customStatus !== '' && in_array($customStatus, OT_TIMELINE_STEPS, true)) {
        $newStatus = $customStatus;
    } else {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Valid action or status required.']);
        exit;
    }

    $description = trim((string)($input['description'] ?? ''));
    if ($description === '') {
        $description = ot_action_description($newStatus, $po['po_number']);
    }

    $updatedById = ($updatedBy ?? 0) > 0 ? (int)$updatedBy : null;
    if ($updatedById === null) {
        $stmt = $connection->prepare('
            INSERT INTO order_tracking_events (po_id, status, description, updated_by)
            VALUES (?, ?, ?, NULL)
        ');
        $stmt->bind_param('iss', $poId, $newStatus, $description);
    } else {
        $stmt = $connection->prepare('
            INSERT INTO order_tracking_events (po_id, status, description, updated_by)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->bind_param('issi', $poId, $newStatus, $description, $updatedById);
    }
    $stmt->execute();
    $stmt->close();

    $poStatus = ot_po_status_for_tracking($newStatus);
    $trackingNumber = $po['tracking_number'];
    if ($newStatus === 'DISPATCHED' && !$trackingNumber) {
        $trackingNumber = 'TRK-' . strtoupper(substr(md5((string)$poId . time()), 0, 8));
    }

    $upd = $connection->prepare('
        UPDATE purchase_orders
        SET status = ?, tracking_status = ?, tracking_number = COALESCE(?, tracking_number)
        WHERE po_id = ?
    ');
    $upd->bind_param('sssi', $poStatus, $newStatus, $trackingNumber, $poId);
    $upd->execute();
    $upd->close();

    // Automatically generate supplier invoice in database when shipped (DISPATCHED)
    if ($newStatus === 'DISPATCHED') {
        $chk = $connection->prepare('SELECT id FROM invoices WHERE po_id = ? LIMIT 1');
        $chk->bind_param('i', $poId);
        $chk->execute();
        $invoiceExists = $chk->get_result()->fetch_assoc();
        $chk->close();

        if (!$invoiceExists) {
            $invId = 'INV-' . strtoupper(substr(md5($po['po_number'] . time()), 0, 8));
            $invoiceNumber = 'INV-' . str_replace('PO-', '', $po['po_number']);
            $amount = (float)$po['total_amount'];
            $taxAmount = round($amount * 0.18, 2); // 18% tax
            $submittedDate = date('Y-m-d');
            $dueDate = date('Y-m-d', strtotime('+30 days'));
            $invStatus = 'Pending';

            $insInv = $connection->prepare('
                INSERT INTO invoices (id, po, amount, submitted, due, status, po_id, supplier_id, invoice_number, tax_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $poNum = $po['po_number'];
            $supplierId = (int)$po['supplier_id'];
            $insInv->bind_param(
                'ssdsssiisd',
                $invId,
                $poNum,
                $amount,
                $submittedDate,
                $dueDate,
                $invStatus,
                $poId,
                $supplierId,
                $invoiceNumber,
                $taxAmount
            );
            $insInv->execute();
            $insInv->close();
        }
    }

    create_audit_log(
        $connection,
        $updatedBy,
        ot_audit_action_for_status($newStatus),
        ($po['supplier_name'] ?? 'Supplier') . ' — ' . $po['po_number'] . ': ' . $description
    );

    $events = ot_fetch_events($connection, $poId);
    $po = ot_fetch_po($connection, $poId);

    echo json_encode([
        'success' => true,
        'message' => 'Tracking updated.',
        'order' => ot_enrich_order($po, $events),
        'events' => $events,
        'timeline' => ot_build_timeline($events),
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
