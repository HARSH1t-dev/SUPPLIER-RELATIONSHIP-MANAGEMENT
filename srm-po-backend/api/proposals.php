<?php
// ============================================================
// api/proposals.php — Supplier Bid Submission API
// Methods: GET (all bids for RFQ), POST (supplier submits bid)
// ============================================================

header("Content-Type: application/json");
require '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents("php://input"), true);

switch ($method) {

    // ── GET: Fetch all proposals for a given RFQ ──
    case 'GET':
        if (empty($_GET['rfq_id'])) {
            http_response_code(400);
            echo json_encode(["error" => "rfq_id is required"]);
            exit;
        }

        $stmt = $pdo->prepare("
            SELECT p.*, s.name AS supplier_name, s.contact_email
            FROM proposals p
            JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.rfq_id = ?
            ORDER BY p.total_quoted ASC
        ");
        $stmt->execute([$_GET['rfq_id']]);
        $proposals = $stmt->fetchAll();

        foreach ($proposals as &$proposal) {
            $stmt2 = $pdo->prepare("SELECT * FROM proposal_items WHERE proposal_id = ?");
            $stmt2->execute([$proposal['id']]);
            $proposal['items'] = $stmt2->fetchAll();
        }

        echo json_encode($proposals);
        break;

    // ── POST: Supplier submits a proposal/bid ──
    case 'POST':
        if (empty($input['rfq_id']) || empty($input['supplier_id']) || empty($input['items'])) {
            http_response_code(400);
            echo json_encode(["error" => "rfq_id, supplier_id and items are required"]);
            exit;
        }

        // Verify RFQ is still open
        $rfqStmt = $pdo->prepare("SELECT status, deadline FROM rfq WHERE id = ?");
        $rfqStmt->execute([$input['rfq_id']]);
        $rfq = $rfqStmt->fetch();

        if (!$rfq) {
            http_response_code(404);
            echo json_encode(["error" => "RFQ not found"]);
            exit;
        }

        if ($rfq['status'] !== 'open') {
            http_response_code(400);
            echo json_encode(["error" => "RFQ is not open for proposals"]);
            exit;
        }

        if ($rfq['deadline'] && date('Y-m-d') > $rfq['deadline']) {
            http_response_code(400);
            echo json_encode(["error" => "RFQ deadline has passed"]);
            exit;
        }

        // Auto-calculate total
        $total = 0;
        foreach ($input['items'] as $item) {
            $total += $item['quantity'] * $item['unit_price'];
        }

        $stmt = $pdo->prepare("
            INSERT INTO proposals
                (rfq_id, supplier_id, total_quoted, delivery_days, validity_days, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $input['rfq_id'],
            $input['supplier_id'],
            $total,
            $input['delivery_days'],
            $input['validity_days'] ?? 30,
            $input['notes'] ?? ''
        ]);
        $proposal_id = $pdo->lastInsertId();

        $itemStmt = $pdo->prepare("
            INSERT INTO proposal_items
                (proposal_id, rfq_item_id, item_name, quantity, unit_price, total_price)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        foreach ($input['items'] as $item) {
            $itemStmt->execute([
                $proposal_id,
                $item['rfq_item_id'],
                $item['item_name'],
                $item['quantity'],
                $item['unit_price'],
                $item['quantity'] * $item['unit_price']
            ]);
        }

        echo json_encode([
            "status"       => "success",
            "proposal_id"  => $proposal_id,
            "total_quoted" => $total
        ]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
