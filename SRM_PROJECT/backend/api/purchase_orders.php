<?php
// ============================================================
// api/purchase_orders.php — Purchase Orders Manager
// DFD Process 2.4 | Actor: Admin & Supplier
// Methods: GET (list/single), PATCH (update status)
// ============================================================

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents("php://input"), true);
$input  = is_array($input) ? $input : [];

$config = db_config();
try {
    $pdo = new PDO("mysql:host={$config['host']};dbname={$config['name']};charset=utf8mb4", $config['user'], $config['pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "DB connection failed: " . $e->getMessage()]);
    exit;
}

switch ($method) {

    // ── GET: Admin & Supplier PO Manager — list all or fetch single PO ──
    case 'GET':
        if (isset($_GET['id'])) {
            // Single PO — full detail including line items and legal terms
            $stmt = $pdo->prepare("
                SELECT
                    po.po_id AS id,
                    po.po_number,
                    po.supplier_quote_id,
                    po.rfq_id,
                    po.supplier_id,
                    po.total_amount,
                    po.issued_by,
                    po.issued_date AS order_date,
                    po.expected_delivery AS delivery_date,
                    po.status,
                    po.legal_terms,
                    po.final_terms_agreed,
                    po.issued_to_supplier,
                    po.issued_date AS created_at,
                    s.company_name  AS supplier_name,
                    u.email         AS supplier_email,
                    u.phone         AS supplier_phone,
                    s.address       AS supplier_address,
                    r.id            AS rfq_number,
                    r.title         AS rfq_title,
                    ui.full_name    AS awarded_by_name
                FROM purchase_orders po
                LEFT JOIN users u         ON po.supplier_id = u.id
                LEFT JOIN suppliers s     ON s.user_id = u.id
                LEFT JOIN rfqs r          ON po.rfq_id = r.id
                LEFT JOIN users ui        ON po.issued_by = ui.id
                WHERE po.po_id = ?
            ");
            $stmt->execute([$_GET['id']]);
            $po = $stmt->fetch();

            if (!$po) {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "Purchase Order not found"]);
                exit;
            }

            // Convert fields to correct types
            $po['id'] = (int)$po['id'];
            $po['supplier_id'] = (int)$po['supplier_id'];
            $po['total_amount'] = (float)$po['total_amount'];
            $po['final_terms_agreed'] = (bool)$po['final_terms_agreed'];
            $po['issued_to_supplier'] = (bool)$po['issued_to_supplier'];

            // Attach line items
            $stmt2 = $pdo->prepare("SELECT * FROM po_items WHERE po_id = ?");
            $stmt2->execute([$_GET['id']]);
            $items = $stmt2->fetchAll();

            foreach ($items as &$item) {
                $item['id'] = (int)$item['id'];
                $item['po_id'] = (int)$item['po_id'];
                $item['quantity'] = (int)$item['quantity'];
                $item['unit_price'] = (float)$item['unit_price'];
                $item['total_price'] = (float)$item['total_price'];
            }

            $po['items'] = $items;

            echo json_encode([
                "success" => true,
                "po" => $po
            ]);

        } else {
            // All POs — optional status and supplier filters
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
                    po.po_id AS id,
                    po.po_number,
                    po.status,
                    po.total_amount,
                    po.issued_date AS order_date,
                    po.expected_delivery AS delivery_date,
                    po.final_terms_agreed,
                    po.issued_to_supplier,
                    po.issued_date AS created_at,
                    s.company_name AS supplier_name,
                    r.id           AS rfq_number
                FROM purchase_orders po
                LEFT JOIN users u     ON po.supplier_id = u.id
                LEFT JOIN suppliers s ON s.user_id = u.id
                LEFT JOIN rfqs r      ON po.rfq_id = r.id
                {$whereClause}
                ORDER BY po.issued_date DESC
            ");
            $stmt->execute($params);
            $pos = $stmt->fetchAll();

            foreach ($pos as &$po) {
                $po['id'] = (int)$po['id'];
                $po['total_amount'] = (float)$po['total_amount'];
                $po['final_terms_agreed'] = (bool)$po['final_terms_agreed'];
                $po['issued_to_supplier'] = (bool)$po['issued_to_supplier'];
            }

            echo json_encode([
                "success" => true,
                "purchase_orders" => $pos
            ]);
        }
        break;

    // ── PATCH: Admin updates PO status ──
    case 'PATCH':
        if (empty($input['id']) || empty($input['status'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "id and status are required"]);
            exit;
        }

        $allowed = ['issued', 'pending', 'shipped', 'delivered', 'fulfilled', 'cancelled'];
        $statusValue = strtolower(trim((string)$input['status']));
        if (!in_array($statusValue, $allowed)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message"   => "Invalid status value",
                "allowed" => $allowed
            ]);
            exit;
        }

        // Verify PO exists
        $check = $pdo->prepare("SELECT po_id, status FROM purchase_orders WHERE po_id = ?");
        $check->execute([$input['id']]);
        $existing = $check->fetch();

        if (!$existing) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Purchase Order not found"]);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE purchase_orders SET status = ? WHERE po_id = ?");
        $stmt->execute([$statusValue, $input['id']]);

        echo json_encode([
            "success"    => true,
            "status"     => "updated",
            "po_id"      => (int)$input['id'],
            "old_status" => $existing['status'],
            "new_status" => $statusValue
        ]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
