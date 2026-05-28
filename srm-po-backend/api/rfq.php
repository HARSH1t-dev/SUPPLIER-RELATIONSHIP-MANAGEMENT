<?php
// ============================================================
// api/rfq.php — RFQ (Request for Quotation) API
// Methods: GET (list/single), POST (create)
// ============================================================

header("Content-Type: application/json");
require '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents("php://input"), true);

switch ($method) {

    // ── GET: List all RFQs or fetch single RFQ with items ──
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM rfq WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $rfq = $stmt->fetch();

            if (!$rfq) {
                http_response_code(404);
                echo json_encode(["error" => "RFQ not found"]);
                exit;
            }

            $stmt2 = $pdo->prepare("SELECT * FROM rfq_items WHERE rfq_id = ?");
            $stmt2->execute([$_GET['id']]);
            $rfq['items'] = $stmt2->fetchAll();

            echo json_encode($rfq);
        } else {
            $stmt = $pdo->query("SELECT * FROM rfq ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll());
        }
        break;

    // ── POST: Admin creates a new RFQ ──
    case 'POST':
        if (empty($input['title']) || empty($input['items'])) {
            http_response_code(400);
            echo json_encode(["error" => "title and items are required"]);
            exit;
        }

        $year       = date('Y');
        $count      = $pdo->query("SELECT COUNT(*) FROM rfq")->fetchColumn();
        $rfq_number = 'RFQ-' . $year . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

        $stmt = $pdo->prepare("
            INSERT INTO rfq (rfq_number, title, description, deadline, created_by)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $rfq_number,
            $input['title'],
            $input['description'] ?? '',
            $input['deadline'],
            $input['created_by']
        ]);
        $rfq_id = $pdo->lastInsertId();

        $itemStmt = $pdo->prepare("
            INSERT INTO rfq_items (rfq_id, item_name, quantity, unit)
            VALUES (?, ?, ?, ?)
        ");
        foreach ($input['items'] as $item) {
            $itemStmt->execute([
                $rfq_id,
                $item['item_name'],
                $item['quantity'],
                $item['unit']
            ]);
        }

        echo json_encode([
            "status"     => "success",
            "rfq_id"     => $rfq_id,
            "rfq_number" => $rfq_number
        ]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
