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
    $result = $connection->query('SELECT * FROM bids ORDER BY created_at DESC');
    $bids = [];
    while ($row = $result->fetch_assoc()) {
        $row['price'] = (float)$row['price'];
        $row['score'] = (int)$row['score'];
        $row['best'] = (bool)$row['best'];
        $row['user_id'] = $row['user_id'] !== null ? (int)$row['user_id'] : null;
        $bids[] = $row;
    }
    echo json_encode([
        'success' => true,
        'bids' => $bids
    ]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $input = is_array($input) ? $input : [];

    $id = isset($input['id']) ? trim((string)$input['id']) : '';
    $rfq_package = isset($input['rfqPackage']) ? trim((string)$input['rfqPackage']) : '';
    $price = isset($input['price']) ? (float)$input['price'] : 0.0;
    $delivery = isset($input['delivery']) ? trim((string)$input['delivery']) : '';
    $warranty = isset($input['warranty']) ? trim((string)$input['warranty']) : '';
    $score = isset($input['score']) ? (int)$input['score'] : 85;
    $best = isset($input['best']) && $input['best'] ? 1 : 0;
    $user_id = isset($input['userId']) && $input['userId'] !== '' ? (int)$input['userId'] : null;
    $supplier_name = isset($input['supplierName']) ? trim((string)$input['supplierName']) : null;

    if ($id === '' || $rfq_package === '') {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Bid ID and RFQ Package are required.'
        ]);
        exit;
    }

    $stmt = $connection->prepare('INSERT INTO bids (id, rfq_package, price, delivery, warranty, score, best, user_id, supplier_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE rfq_package=?, price=?, delivery=?, warranty=?, score=?, best=?, user_id=?, supplier_name=?');
    $stmt->bind_param('ssdssiisssdssiiss', $id, $rfq_package, $price, $delivery, $warranty, $score, $best, $user_id, $supplier_name, $rfq_package, $price, $delivery, $warranty, $score, $best, $user_id, $supplier_name);

    if ($stmt->execute()) {
        // Increment bid count in rfqs table
        $updateStmt = $connection->prepare('UPDATE rfqs SET bids = bids + 1 WHERE id = ?');
        $updateStmt->bind_param('s', $rfq_package);
        $updateStmt->execute();
        $updateStmt->close();

        echo json_encode([
            'success' => true,
            'message' => 'Bid quotation submitted successfully.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save bid proposal: ' . $stmt->error
        ]);
    }
    $stmt->close();
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';

    if ($id === '') {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Bid ID is required.'
        ]);
        exit;
    }

    $stmt = $connection->prepare('DELETE FROM bids WHERE id = ?');
    $stmt->bind_param('s', $id);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Bid deleted successfully.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete bid.'
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
