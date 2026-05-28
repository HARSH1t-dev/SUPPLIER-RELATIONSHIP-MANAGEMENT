<?php
// ============================================================
// api/purchase_orders.php — Purchase Orders Manager
// DFD Process 2.4 | Actor: Admin & Supplier
// Methods: GET (list/single), PATCH (update status)
// ============================================================

header("Content-Type: application/json");
require '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents("php://input"), true);

switch ($method) {

    // ── GET: Admin PO Manager — list all or fetch single PO ─────────────────
    case 'GET':
        if (isset($_GET['id'])) {
            // Single PO — full detail including line items and legal terms
            $stmt = $pdo->prepare("
                SELECT
                    po.*,
                    s.name          AS supplier_name,
                    s.contact_email AS supplier_email,
                    s.phone         AS supplier_phone,
                    s.address       AS supplier_address,
                    r.rfq_number,
                    r.title         AS rfq_title,
                    u.name          AS awarded_by_name
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.id
                JOIN rfq r       ON po.rfq_id = r.id
                JOIN users u     ON po.awarded_by = u.id
                WHERE po.id = ?
            ");
            $stmt->execute([$_GET['id']]);
            $po = $stmt->fetch();

            if (!$po) {
                http_response_code(404);
                echo json_encode(["error" => "Purchase Order not found"]);
                exit;
            }

            // Attach line items
            $stmt2 = $pdo->prepare("SELECT * FROM po_items WHERE po_id = ?");
            $stmt2->execute([$_GET['id']]);
            $po['items'] = $stmt2->fetchAll();

            echo json_encode($po);

        } else {
            // All POs — sidebar list view with optional status filter
            // Usage: /api/purchase_orders.php?status=issued
            $status      = $_GET['status']      ?? null;
            $supplier_id = $_GET['supplier_id'] ?? null;

            $where  = [];
            $params = [];

            if ($status) {
                $where[]  = "po.status = ?";
                $params[] = $status;
            }
            if ($supplier_id) {
                $where[]  = "po.supplier_id = ?";
                $params[] = $supplier_id;
            }

            $whereClause = $where ? "WHERE " . implode(" AND ", $where) : "";

            $stmt = $pdo->prepare("
                SELECT
                    po.id,
                    po.po_number,
                    po.status,
                    po.total_amount,
                    po.order_date,
                    po.delivery_date,
                    po.final_terms_agreed,
                    po.issued_to_supplier,
                    po.created_at,
                    s.name    AS supplier_name,
                    r.rfq_number
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.id
                JOIN rfq r       ON po.rfq_id = r.id
                {$whereClause}
                ORDER BY po.created_at DESC
            ");
            $stmt->execute($params);

            echo json_encode($stmt->fetchAll());
        }
        break;

    // ── PATCH: Admin updates PO status ───────────────────────────────────────
    // e.g. issued → fulfilled, or issued → cancelled
    case 'PATCH':
        if (empty($input['id']) || empty($input['status'])) {
            http_response_code(400);
            echo json_encode(["error" => "id and status are required"]);
            exit;
        }

        $allowed = ['issued', 'pending', 'fulfilled', 'cancelled'];
        if (!in_array($input['status'], $allowed)) {
            http_response_code(400);
            echo json_encode([
                "error"   => "Invalid status value",
                "allowed" => $allowed
            ]);
            exit;
        }

        // Verify PO exists
        $check = $pdo->prepare("SELECT id, status FROM purchase_orders WHERE id = ?");
        $check->execute([$input['id']]);
        $existing = $check->fetch();

        if (!$existing) {
            http_response_code(404);
            echo json_encode(["error" => "Purchase Order not found"]);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE purchase_orders SET status = ? WHERE id = ?");
        $stmt->execute([$input['status'], $input['id']]);

        echo json_encode([
            "status"     => "updated",
            "po_id"      => $input['id'],
            "old_status" => $existing['status'],
            "new_status" => $input['status']
        ]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
