<?php

declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$connection = db_connection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Single RFQ Detail with Line Items
    if (isset($_GET['id'])) {
        $id = trim((string)$_GET['id']);
        $stmt = $connection->prepare('SELECT * FROM rfqs WHERE id = ? LIMIT 1');
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $rfq = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($rfq) {
            $rfq['value'] = (float)$rfq['value'];
            $rfq['bids'] = (int)$rfq['bids'];

            // Fetch line items
            $itemStmt = $connection->prepare('SELECT id, item_name, specification, quantity, unit FROM rfq_items WHERE rfq_id = ?');
            $itemStmt->bind_param('s', $id);
            $itemStmt->execute();
            $itemRes = $itemStmt->get_result();
            $items = [];
            while ($itemRow = $itemRes->fetch_assoc()) {
                $itemRow['id'] = (int)$itemRow['id'];
                $itemRow['quantity'] = (int)$itemRow['quantity'];
                $items[] = $itemRow;
            }
            $itemStmt->close();
            $rfq['items'] = $items;

            echo json_encode([
                'success' => true,
                'rfq' => $rfq
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'RFQ not found.'
            ]);
        }
        exit;
    }

    // List of all RFQs (standard behavior)
    $result = $connection->query('SELECT * FROM rfqs ORDER BY created_at DESC');
    $rfqs = [];
    while ($row = $result->fetch_assoc()) {
        $row['value'] = (float)$row['value'];
        $row['bids'] = (int)$row['bids'];
        $rfqs[] = $row;
    }
    echo json_encode([
        'success' => true,
        'rfqs' => $rfqs
    ]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $input = is_array($input) ? $input : [];

    $id = isset($input['id']) ? trim((string)$input['id']) : '';
    $title = isset($input['title']) ? trim((string)$input['title']) : '';
    $category = isset($input['category']) ? trim((string)$input['category']) : '';
    $deadline = isset($input['deadline']) ? trim((string)$input['deadline']) : '';
    $value = isset($input['value']) ? (float)$input['value'] : 0.0;
    $status = isset($input['status']) ? trim((string)$input['status']) : 'Draft';
    $description = isset($input['description']) ? trim((string)$input['description']) : '';
    $items = isset($input['items']) && is_array($input['items']) ? $input['items'] : [];

    if ($id === '' || $title === '') {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'RFQ ID and Title are required.'
        ]);
        exit;
    }

    $connection->begin_transaction();
    try {
        $stmt = $connection->prepare('INSERT INTO rfqs (id, title, category, deadline, value, status, description) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=?, category=?, deadline=?, value=?, status=?, description=?');
        $stmt->bind_param('ssssdsssssdss', $id, $title, $category, $deadline, $value, $status, $description, $title, $category, $deadline, $value, $status, $description);
        $stmt->execute();
        $stmt->close();

        // Clear existing line items
        $deleteStmt = $connection->prepare('DELETE FROM rfq_items WHERE rfq_id = ?');
        $deleteStmt->bind_param('s', $id);
        $deleteStmt->execute();
        $deleteStmt->close();

        // Insert new line items
        if (!empty($items)) {
            $itemStmt = $connection->prepare('INSERT INTO rfq_items (rfq_id, item_name, specification, quantity, unit) VALUES (?, ?, ?, ?, ?)');
            foreach ($items as $item) {
                $itemName = isset($item['item_name']) ? trim((string)$item['item_name']) : (isset($item['itemName']) ? trim((string)$item['itemName']) : '');
                $specification = isset($item['specification']) ? trim((string)$item['specification']) : '';
                $quantity = isset($item['quantity']) ? (int)$item['quantity'] : 0;
                $unit = isset($item['unit']) ? trim((string)$item['unit']) : 'pcs';

                if ($itemName !== '') {
                    $itemStmt->bind_param('sssis', $id, $itemName, $specification, $quantity, $unit);
                    $itemStmt->execute();
                }
            }
            $itemStmt->close();
        }

        $connection->commit();
        echo json_encode([
            'success' => true,
            'message' => 'RFQ saved successfully.'
        ]);
    } catch (Exception $e) {
        $connection->rollback();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save RFQ: ' . $e->getMessage()
        ]);
    }
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';

    if ($id === '') {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'RFQ ID is required.'
        ]);
        exit;
    }

    $stmt = $connection->prepare('DELETE FROM rfqs WHERE id = ?');
    $stmt->bind_param('s', $id);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'RFQ deleted successfully.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete RFQ.'
        ]);
    }
    $stmt->close();
    exit;
}

http_response_code(405);
echo json_encode([
    'success' => false,
    'message' => 'Method not allowed.'
]);
