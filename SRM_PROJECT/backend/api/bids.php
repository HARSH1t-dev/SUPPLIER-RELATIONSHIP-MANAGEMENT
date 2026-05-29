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
    $result = $connection->query('SELECT * FROM supplier_quotes ORDER BY submitted_at DESC');
    $bids = [];
    while ($row = $result->fetch_assoc()) {
        $bidId = $row['id'];
        
        // Fetch quote line items
        $itemStmt = $connection->prepare('
            SELECT sqi.id, sqi.rfq_item_id, sqi.unit_price, sqi.quantity, sqi.tax_percent, sqi.line_total, sqi.remarks, ri.item_name, ri.specification, ri.unit 
            FROM supplier_quote_items sqi 
            JOIN rfq_items ri ON sqi.rfq_item_id = ri.id 
            WHERE sqi.supplier_quote_id = ?
        ');
        $itemStmt->bind_param('s', $bidId);
        $itemStmt->execute();
        $itemRes = $itemStmt->get_result();
        $items = [];
        while ($itemRow = $itemRes->fetch_assoc()) {
            $itemRow['id'] = (int)$itemRow['id'];
            $itemRow['rfq_item_id'] = (int)$itemRow['rfq_item_id'];
            $itemRow['unit_price'] = (float)$itemRow['unit_price'];
            $itemRow['quantity'] = (int)$itemRow['quantity'];
            $itemRow['tax_percent'] = (float)$itemRow['tax_percent'];
            $itemRow['line_total'] = (float)$itemRow['line_total'];
            $items[] = $itemRow;
        }
        $itemStmt->close();

        $bids[] = [
            'id' => $row['id'],
            'rfq_package' => $row['rfq_id'],
            'rfqPackage' => $row['rfq_id'],
            'price' => (float)$row['grand_total'],
            'delivery' => $row['delivery'],
            'warranty' => $row['warranty'],
            'score' => (int)$row['score'],
            'best' => (bool)$row['best'],
            'user_id' => (int)$row['supplier_id'],
            'supplier_name' => $row['supplier_name'],
            'created_at' => $row['submitted_at'],
            'subtotal' => (float)$row['subtotal'],
            'tax_total' => (float)$row['tax_total'],
            'freight' => (float)$row['freight'],
            'grand_total' => (float)$row['grand_total'],
            'items' => $items
        ];
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
    $rfq_id = isset($input['rfqPackage']) ? trim((string)$input['rfqPackage']) : (isset($input['rfqId']) ? trim((string)$input['rfqId']) : '');
    $price = isset($input['price']) ? (float)$input['price'] : 0.0;
    $delivery = isset($input['delivery']) ? trim((string)$input['delivery']) : '';
    $warranty = isset($input['warranty']) ? trim((string)$input['warranty']) : '';
    $score = isset($input['score']) ? (int)$input['score'] : 85;
    $best = isset($input['best']) && $input['best'] ? 1 : 0;
    $user_id = isset($input['userId']) && $input['userId'] !== '' ? (int)$input['userId'] : 2;
    $supplier_name = isset($input['supplierName']) ? trim((string)$input['supplierName']) : 'Apex Industrial Components';

    $subtotal = isset($input['subtotal']) ? (float)$input['subtotal'] : $price;
    $tax_total = isset($input['taxTotal']) ? (float)$input['taxTotal'] : 0.0;
    $freight = isset($input['freight']) ? (float)$input['freight'] : 0.0;
    $grand_total = isset($input['grandTotal']) ? (float)$input['grandTotal'] : $price;
    $items = isset($input['items']) && is_array($input['items']) ? $input['items'] : [];

    if ($id === '' || $rfq_id === '') {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Quote ID and RFQ Package are required.'
        ]);
        exit;
    }

    $connection->begin_transaction();
    try {
        // 1. Insert into bids compatibility table
        $stmt1 = $connection->prepare('INSERT INTO bids (id, rfq_package, price, delivery, warranty, score, best, user_id, supplier_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE rfq_package=?, price=?, delivery=?, warranty=?, score=?, best=?, user_id=?, supplier_name=?');
        $stmt1->bind_param('ssdssiisssdssiiss', $id, $rfq_id, $grand_total, $delivery, $warranty, $score, $best, $user_id, $supplier_name, $rfq_id, $grand_total, $delivery, $warranty, $score, $best, $user_id, $supplier_name);
        $stmt1->execute();
        $stmt1->close();

        // 2. Insert into supplier_quotes table
        $stmt2 = $connection->prepare('INSERT INTO supplier_quotes (id, rfq_id, supplier_id, supplier_name, subtotal, tax_total, freight, grand_total, delivery, warranty, score, best) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE rfq_id=?, supplier_id=?, supplier_name=?, subtotal=?, tax_total=?, freight=?, grand_total=?, delivery=?, warranty=?, score=?, best=?');
        $stmt2->bind_param('ssisddddssiiisiddddssii', $id, $rfq_id, $user_id, $supplier_name, $subtotal, $tax_total, $freight, $grand_total, $delivery, $warranty, $score, $best, $rfq_id, $user_id, $supplier_name, $subtotal, $tax_total, $freight, $grand_total, $delivery, $warranty, $score, $best);
        $stmt2->execute();
        $stmt2->close();

        // 3. Clear and insert quote items
        $stmt3 = $connection->prepare('DELETE FROM supplier_quote_items WHERE supplier_quote_id = ?');
        $stmt3->bind_param('s', $id);
        $stmt3->execute();
        $stmt3->close();

        if (!empty($items)) {
            $stmt4 = $connection->prepare('INSERT INTO supplier_quote_items (supplier_quote_id, rfq_item_id, unit_price, quantity, tax_percent, line_total, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)');
            foreach ($items as $item) {
                $rfqItemId = (int)$item['rfq_item_id'];
                $unitPrice = (float)$item['unit_price'];
                $qty = (int)$item['quantity'];
                $taxPct = (float)$item['tax_percent'];
                $lineTot = (float)$item['line_total'];
                $remarks = isset($item['remarks']) ? trim((string)$item['remarks']) : '';

                $stmt4->bind_param('sidddds', $id, $rfqItemId, $unitPrice, $qty, $taxPct, $lineTot, $remarks);
                $stmt4->execute();
              }
              $stmt4->close();
          }

          // 4. Increment bids count on RFQ
          $updateStmt = $connection->prepare('UPDATE rfqs SET bids = bids + 1 WHERE id = ?');
          $updateStmt->bind_param('s', $rfq_id);
          $updateStmt->execute();
          $updateStmt->close();

          $connection->commit();
          echo json_encode([
              'success' => true,
              'message' => 'Bid quotation submitted successfully.'
          ]);
      } catch (Exception $e) {
          $connection->rollback();
          http_response_code(500);
          echo json_encode([
              'success' => false,
              'message' => 'Failed to save bid: ' . $e->getMessage()
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
            'message' => 'Bid ID is required.'
        ]);
        exit;
    }

    $connection->begin_transaction();
    try {
        $stmt1 = $connection->prepare('DELETE FROM bids WHERE id = ?');
        $stmt1->bind_param('s', $id);
        $stmt1->execute();
        $stmt1->close();

        $stmt2 = $connection->prepare('DELETE FROM supplier_quotes WHERE id = ?');
        $stmt2->bind_param('s', $id);
        $stmt2->execute();
        $stmt2->close();

        $connection->commit();
        echo json_encode([
            'success' => true,
            'message' => 'Bid deleted successfully.'
        ]);
    } catch (Exception $e) {
        $connection->rollback();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete bid: ' . $e->getMessage()
          ]);
      }
      exit;
}

http_response_code(405);
echo json_encode([
    'success' => false,
    'message' => 'Method not allowed.'
]);
