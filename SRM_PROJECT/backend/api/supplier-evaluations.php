<?php

declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$connection = db_try_connection();
if ($connection === null) {
    require_once __DIR__ . '/../lib/demo_store.php';
    demo_handle_supplier_evaluations();
    exit;
}

require_once __DIR__ . '/../lib/audit_helper.php';
require_once __DIR__ . '/../lib/evaluation_scoring.php';

$method = $_SERVER['REQUEST_METHOD'];

function json_error(int $code, string $message): void
{
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

function allowed_status(string $status): bool
{
    return in_array($status, ['pending', 'shortlisted', 'approved_for_bidding', 'rejected'], true);
}

function status_label(string $status): string
{
    return match ($status) {
        'shortlisted' => 'Shortlisted',
        'approved_for_bidding' => 'Approved',
        'rejected' => 'Rejected',
        default => 'Pending',
    };
}

function sync_evaluations_for_rfq(mysqli $connection, string $rfqId, array $weights): void
{
    $stmt = $connection->prepare('
        SELECT sq.id AS bid_id, sq.rfq_id, sq.supplier_id, sq.grand_total, sq.delivery, sq.warranty,
               s.rating AS supplier_rating, s.supplier_id AS supplier_table_id
        FROM supplier_quotes sq
        LEFT JOIN suppliers s ON s.user_id = sq.supplier_id
        WHERE sq.rfq_id = ?
    ');
    $stmt->bind_param('s', $rfqId);
    $stmt->execute();
    $result = $stmt->get_result();
    $quotes = [];
    while ($row = $result->fetch_assoc()) {
        $quotes[] = $row;
    }
    $stmt->close();

    foreach ($quotes as $quote) {
        $supplierTableId = (int)($quote['supplier_table_id'] ?? 0);
        $compliance = $supplierTableId > 0
            ? scoring_compliance_for_supplier($connection, $supplierTableId)
            : ['score' => 50.0];
        $score = scoring_calculate_quote_score($quote, $quotes, $weights, (float)$compliance['score']);

        $insert = $connection->prepare('
            INSERT INTO rfq_supplier_evaluations (rfq_id, supplier_id, bid_id, status, evaluation_score)
            VALUES (?, ?, ?, \'pending\', ?)
            ON DUPLICATE KEY UPDATE evaluation_score = VALUES(evaluation_score), updated_at = CURRENT_TIMESTAMP
        ');
        $supplierId = (int)$quote['supplier_id'];
        $bidId = (string)$quote['bid_id'];
        $insert->bind_param('sisd', $rfqId, $supplierId, $bidId, $score);
        $insert->execute();
        $insert->close();
    }
}

function fetch_evaluation_metrics(mysqli $connection): array
{
    $totalSuppliers = 0;
    $res = $connection->query('SELECT COUNT(*) AS c FROM suppliers');
    if ($res) {
        $totalSuppliers = (int)($res->fetch_assoc()['c'] ?? 0);
    }

    $counts = [
        'pending' => 0,
        'shortlisted' => 0,
        'approved_for_bidding' => 0,
        'rejected' => 0,
    ];
    $statusRes = $connection->query('SELECT status, COUNT(*) AS c FROM rfq_supplier_evaluations GROUP BY status');
    if ($statusRes) {
        while ($row = $statusRes->fetch_assoc()) {
            $counts[$row['status']] = (int)$row['c'];
        }
    }

    return [
        'total_suppliers' => $totalSuppliers,
        'pending_evaluation' => $counts['pending'],
        'shortlisted_suppliers' => $counts['shortlisted'],
        'approved_suppliers' => $counts['approved_for_bidding'],
        'rejected_suppliers' => $counts['rejected'],
    ];
}

function build_evaluations_list(mysqli $connection, ?string $rfqId, ?string $statusFilter, ?string $sort, ?string $search): array
{
    $weights = scoring_get_weights($connection);
    if ($rfqId !== null && $rfqId !== '') {
        sync_evaluations_for_rfq($connection, $rfqId, $weights);
    }

    $sql = '
        SELECT e.id AS evaluation_id, e.rfq_id, e.supplier_id, e.bid_id, e.status, e.admin_notes,
               e.evaluation_score, e.created_at, e.updated_at,
               sq.grand_total, sq.delivery, sq.warranty, sq.submitted_at,
               r.title AS rfq_title,
               u.full_name AS supplier_name, u.email AS supplier_email,
               s.company_name, s.rating AS supplier_rating, s.supplier_id AS supplier_table_id
        FROM rfq_supplier_evaluations e
        JOIN supplier_quotes sq ON e.bid_id = sq.id
        JOIN rfqs r ON e.rfq_id = r.id
        JOIN users u ON e.supplier_id = u.id
        LEFT JOIN suppliers s ON s.user_id = e.supplier_id
        WHERE 1=1
    ';
    $params = [];
    $types = '';

    if ($rfqId !== null && $rfqId !== '') {
        $sql .= ' AND e.rfq_id = ?';
        $params[] = $rfqId;
        $types .= 's';
    }
    if ($statusFilter !== null && $statusFilter !== '' && allowed_status($statusFilter)) {
        $sql .= ' AND e.status = ?';
        $params[] = $statusFilter;
        $types .= 's';
    }
    if ($search !== null && $search !== '') {
        $sql .= ' AND (u.full_name LIKE ? OR s.company_name LIKE ? OR u.email LIKE ?)';
        $like = '%' . $search . '%';
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $types .= 'sss';
    }

    switch ($sort) {
        case 'price_asc':
            $sql .= ' ORDER BY sq.grand_total ASC';
            break;
        case 'rating_desc':
            $sql .= ' ORDER BY s.rating DESC';
            break;
        case 'score_desc':
        default:
            $sql .= ' ORDER BY e.evaluation_score DESC';
            break;
    }

    $stmt = $connection->prepare($sql);
    if ($types !== '') {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $supplierTableId = (int)($row['supplier_table_id'] ?? 0);
        $compliance = $supplierTableId > 0
            ? scoring_compliance_for_supplier($connection, $supplierTableId)
            : ['status' => 'Unknown', 'score' => 50.0];

        $rows[] = [
            'evaluation_id' => (int)$row['evaluation_id'],
            'rfq_id' => $row['rfq_id'],
            'rfq_title' => $row['rfq_title'],
            'supplier_id' => (int)$row['supplier_id'],
            'supplier_table_id' => $supplierTableId,
            'bid_id' => $row['bid_id'],
            'supplier_name' => $row['supplier_name'],
            'company_name' => $row['company_name'] ?: $row['supplier_name'],
            'supplier_rating' => (float)($row['supplier_rating'] ?? 0),
            'total_orders_completed' => scoring_count_completed_orders($connection, (int)$row['supplier_id']),
            'compliance_status' => $compliance['status'],
            'bid_amount' => (float)$row['grand_total'],
            'quotation_price' => (float)$row['grand_total'],
            'delivery_time' => $row['delivery'],
            'delivery_days' => scoring_parse_delivery_days((string)$row['delivery']),
            'warranty' => $row['warranty'],
            'warranty_months' => scoring_parse_warranty_months((string)$row['warranty']),
            'rfq_applied_for' => $row['rfq_title'],
            'bid_submission_date' => $row['submitted_at'],
            'score' => (float)$row['evaluation_score'],
            'evaluation_score' => (float)$row['evaluation_score'],
            'status' => $row['status'],
            'status_label' => status_label((string)$row['status']),
            'admin_notes' => $row['admin_notes'],
            'updated_at' => $row['updated_at'],
        ];
    }
    $stmt->close();

    return $rows;
}

function update_evaluation_status(
    mysqli $connection,
    int $evaluationId,
    string $status,
    ?string $adminNotes,
    ?int $adminUserId
): array {
    if (!allowed_status($status)) {
        json_error(422, 'Invalid evaluation status.');
    }

    $fetch = $connection->prepare('
        SELECT e.*, s.company_name, u.full_name
        FROM rfq_supplier_evaluations e
        LEFT JOIN suppliers s ON s.user_id = e.supplier_id
        LEFT JOIN users u ON e.supplier_id = u.id
        WHERE e.id = ?
        LIMIT 1
    ');
    $fetch->bind_param('i', $evaluationId);
    $fetch->execute();
    $existing = $fetch->get_result()->fetch_assoc();
    $fetch->close();

    if (!$existing) {
        json_error(404, 'Evaluation record not found.');
    }

    $stmt = $connection->prepare('
        UPDATE rfq_supplier_evaluations
        SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ');
    $notes = $adminNotes;
    $stmt->bind_param('ssi', $status, $notes, $evaluationId);
    $stmt->execute();
    $stmt->close();

    $company = $existing['company_name'] ?? $existing['full_name'] ?? 'Supplier';
    $rfqId = $existing['rfq_id'];
    $action = match ($status) {
        'shortlisted' => 'SUPPLIER_SHORTLISTED',
        'approved_for_bidding' => 'SUPPLIER_APPROVED_FOR_BIDDING',
        'rejected' => 'SUPPLIER_REJECTED',
        default => 'SUPPLIER_EVALUATION_UPDATED',
    };
    $details = sprintf(
        '%s for RFQ %s (evaluation #%d, bid %s)',
        $company,
        $rfqId,
        $evaluationId,
        $existing['bid_id']
    );
    if ($adminNotes) {
        $details .= ' — Notes: ' . $adminNotes;
    }
    create_audit_log($connection, $adminUserId, $action, $details);

    return ['evaluation_id' => $evaluationId, 'status' => $status, 'status_label' => status_label($status)];
}

function fetch_supplier_detail(mysqli $connection, int $supplierUserId): array
{
    $profileStmt = $connection->prepare('
        SELECT u.id, u.full_name, u.email, u.phone, u.company_name, u.status AS account_status,
               s.supplier_id, s.company_name AS registered_company, s.rating, s.gst_number,
               s.address, s.city, s.state, s.country, s.website
        FROM users u
        LEFT JOIN suppliers s ON s.user_id = u.id
        WHERE u.id = ? AND u.role = \'supplier\'
        LIMIT 1
    ');
    $profileStmt->bind_param('i', $supplierUserId);
    $profileStmt->execute();
    $profile = $profileStmt->get_result()->fetch_assoc();
    $profileStmt->close();

    if (!$profile) {
        json_error(404, 'Supplier not found.');
    }

    $supplierTableId = (int)($profile['supplier_id'] ?? 0);
    $compliance = $supplierTableId > 0
        ? scoring_compliance_for_supplier($connection, $supplierTableId)
        : ['status' => 'Unknown', 'score' => 50.0];

    $bidsStmt = $connection->prepare('
        SELECT sq.id, sq.rfq_id, r.title AS rfq_title, sq.grand_total, sq.delivery, sq.warranty,
               sq.submitted_at, sq.score
        FROM supplier_quotes sq
        JOIN rfqs r ON sq.rfq_id = r.id
        WHERE sq.supplier_id = ?
        ORDER BY sq.submitted_at DESC
    ');
    $bidsStmt->bind_param('i', $supplierUserId);
    $bidsStmt->execute();
    $bidsResult = $bidsStmt->get_result();
    $pastBids = [];
    while ($row = $bidsResult->fetch_assoc()) {
        $pastBids[] = $row;
    }
    $bidsStmt->close();

    $evalStmt = $connection->prepare('
        SELECT e.*, r.title AS rfq_title
        FROM rfq_supplier_evaluations e
        JOIN rfqs r ON e.rfq_id = r.id
        WHERE e.supplier_id = ?
        ORDER BY e.updated_at DESC
    ');
    $evalStmt->bind_param('i', $supplierUserId);
    $evalStmt->execute();
    $evalResult = $evalStmt->get_result();
    $evaluationHistory = [];
    while ($row = $evalResult->fetch_assoc()) {
        $row['status_label'] = status_label((string)$row['status']);
        $evaluationHistory[] = $row;
    }
    $evalStmt->close();

    $docs = [];
    if ($supplierTableId > 0) {
        $docStmt = $connection->prepare('SELECT id, type, issuer, expiry, status FROM compliance_documents WHERE supplier_id = ?');
        $docStmt->bind_param('i', $supplierTableId);
        $docStmt->execute();
        $docRes = $docStmt->get_result();
        while ($doc = $docRes->fetch_assoc()) {
            $docs[] = $doc;
        }
        $docStmt->close();
    }

    $reviewsStmt = $connection->prepare('
        SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count
        FROM supplier_reviews WHERE supplier_id = ?
    ');
    $avgRating = (float)($profile['rating'] ?? 0);
    $reviewCount = 0;
    if ($supplierTableId > 0) {
        $reviewsStmt->bind_param('i', $supplierTableId);
        $reviewsStmt->execute();
        $reviewRow = $reviewsStmt->get_result()->fetch_assoc();
        if ($reviewRow && $reviewRow['review_count'] > 0) {
            $avgRating = round((float)$reviewRow['avg_rating'], 1);
            $reviewCount = (int)$reviewRow['review_count'];
        }
        $reviewsStmt->close();
    }

    return [
        'profile' => $profile,
        'company_information' => $profile,
        'compliance_status' => $compliance['status'],
        'compliance_documents' => $docs,
        'past_rfqs' => array_values(array_unique(array_map(static fn ($b) => $b['rfq_id'], $pastBids))),
        'past_bids' => $pastBids,
        'orders_completed' => scoring_count_completed_orders($connection, $supplierUserId),
        'average_rating' => $avgRating,
        'review_count' => $reviewCount,
        'evaluation_history' => $evaluationHistory,
    ];
}

function handle_mutation(mysqli $connection, array $input, string $methodLabel): void
{
    $action = isset($input['action']) ? trim((string)$input['action']) : '';
    $adminUserId = isset($input['admin_user_id']) ? (int)$input['admin_user_id'] : null;
    $adminNotes = isset($input['admin_notes']) ? trim((string)$input['admin_notes']) : null;

    if ($action === '') {
        json_error(422, 'action is required.');
    }

    if ($action === 'bulk_approve') {
        $rfqId = isset($input['rfq_id']) ? trim((string)$input['rfq_id']) : '';
        $supplierIds = isset($input['supplier_ids']) && is_array($input['supplier_ids']) ? $input['supplier_ids'] : [];
        if ($rfqId === '' || count($supplierIds) === 0) {
            json_error(422, 'rfq_id and supplier_ids are required for bulk approve.');
        }

        $approved = [];
        foreach ($supplierIds as $supplierId) {
            $supplierId = (int)$supplierId;
            $find = $connection->prepare('SELECT id FROM rfq_supplier_evaluations WHERE rfq_id = ? AND supplier_id = ? LIMIT 1');
            $find->bind_param('si', $rfqId, $supplierId);
            $find->execute();
            $row = $find->get_result()->fetch_assoc();
            $find->close();
            if ($row) {
                $approved[] = update_evaluation_status($connection, (int)$row['id'], 'approved_for_bidding', $adminNotes, $adminUserId);
            }
        }

        echo json_encode([
            'success' => true,
            'message' => count($approved) . ' supplier(s) approved for final bidding.',
            'approved' => $approved,
        ]);
        exit;
    }

    $evaluationId = isset($input['evaluation_id']) ? (int)$input['evaluation_id'] : 0;
    $rfqId = isset($input['rfq_id']) ? trim((string)$input['rfq_id']) : '';
    $supplierId = isset($input['supplier_id']) ? (int)$input['supplier_id'] : 0;
    $bidId = isset($input['bid_id']) ? trim((string)$input['bid_id']) : '';

    if ($evaluationId <= 0 && $rfqId !== '' && $supplierId > 0 && $bidId !== '') {
        sync_evaluations_for_rfq($connection, $rfqId, scoring_get_weights($connection));
        $lookup = $connection->prepare('SELECT id FROM rfq_supplier_evaluations WHERE rfq_id = ? AND supplier_id = ? AND bid_id = ? LIMIT 1');
        $lookup->bind_param('sis', $rfqId, $supplierId, $bidId);
        $lookup->execute();
        $found = $lookup->get_result()->fetch_assoc();
        $lookup->close();
        $evaluationId = $found ? (int)$found['id'] : 0;
    }

    if ($evaluationId <= 0) {
        json_error(422, 'evaluation_id or rfq_id/supplier_id/bid_id are required.');
    }

    $newStatus = match ($action) {
        'shortlist' => 'shortlisted',
        'approve_for_bidding', 'approve' => 'approved_for_bidding',
        'reject' => 'rejected',
        'update_notes' => null,
        default => null,
    };

    if ($action === 'update_notes') {
        $stmt = $connection->prepare('UPDATE rfq_supplier_evaluations SET admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->bind_param('si', $adminNotes, $evaluationId);
        $stmt->execute();
        $stmt->close();
        create_audit_log($connection, $adminUserId, 'SUPPLIER_EVALUATION_NOTES_UPDATED', 'Notes updated for evaluation #' . $evaluationId);
        echo json_encode(['success' => true, 'message' => 'Admin notes saved.', 'evaluation_id' => $evaluationId]);
        exit;
    }

    if ($newStatus === null) {
        json_error(422, 'Unknown action: ' . $action);
    }

    $updated = update_evaluation_status($connection, $evaluationId, $newStatus, $adminNotes, $adminUserId);
    echo json_encode([
        'success' => true,
        'message' => 'Supplier evaluation ' . $methodLabel . ' successfully.',
        'evaluation' => $updated,
    ]);
    exit;
}

if ($method === 'GET') {
    if (isset($_GET['metrics']) && $_GET['metrics'] === '1') {
        echo json_encode(['success' => true, 'metrics' => fetch_evaluation_metrics($connection)]);
        exit;
    }

    $supplierId = isset($_GET['supplier_id']) ? (int)$_GET['supplier_id'] : 0;
    if ($supplierId > 0 && (isset($_GET['detail']) && $_GET['detail'] === '1')) {
        echo json_encode(['success' => true, 'supplier' => fetch_supplier_detail($connection, $supplierId)]);
        exit;
    }

    $rfqId = isset($_GET['rfq_id']) ? trim((string)$_GET['rfq_id']) : null;
    $statusFilter = isset($_GET['status']) ? trim((string)$_GET['status']) : null;
    $sort = isset($_GET['sort']) ? trim((string)$_GET['sort']) : 'score_desc';
    $search = isset($_GET['search']) ? trim((string)$_GET['search']) : null;

    $evaluations = build_evaluations_list($connection, $rfqId, $statusFilter, $sort, $search);

    echo json_encode([
        'success' => true,
        'evaluations' => $evaluations,
        'metrics' => fetch_evaluation_metrics($connection),
        'rfq_id' => $rfqId,
    ]);
    exit;
}

if ($method === 'POST' || $method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $input = is_array($input) ? $input : [];
    handle_mutation($connection, $input, strtolower($method));
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
