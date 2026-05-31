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

$connection = db_try_connection();
if ($connection === null) {
    require_once __DIR__ . '/../lib/demo_store.php';
    demo_handle_audit_logs();
    exit;
}

require_once __DIR__ . '/../lib/audit_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $module = isset($_GET['module']) ? trim((string)$_GET['module']) : '';
    $limit = isset($_GET['limit']) ? max(1, min(500, (int)$_GET['limit'])) : 100;

    $sql = '
        SELECT al.log_id, al.action, al.details, al.ip_address, al.timestamp,
               u.full_name AS user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
    ';
    $params = [];
    $types = '';

    if ($module !== '') {
        $sql .= ' WHERE al.action LIKE ? OR al.details LIKE ?';
        $like = '%' . $module . '%';
        $params = [$like, $like];
        $types = 'ss';
    }

    $sql .= ' ORDER BY al.timestamp DESC LIMIT ?';
    $params[] = $limit;
    $types .= 'i';

    $stmt = $connection->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = [
            'id' => (int)$row['log_id'],
            'time' => $row['timestamp'],
            'user' => $row['user_name'] ?? 'System',
            'action' => $row['action'],
            'module' => 'Governance',
            'result' => 'Success',
            'details' => $row['details'],
            'ip_address' => $row['ip_address'],
        ];
    }
    $stmt->close();

    echo json_encode(['success' => true, 'logs' => $logs]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $input = is_array($input) ? $input : [];

    $userId = isset($input['user_id']) ? (int)$input['user_id'] : null;
    $action = isset($input['action']) ? trim((string)$input['action']) : '';
    $details = isset($input['details']) ? trim((string)$input['details']) : '';

    if ($action === '') {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Action is required.']);
        exit;
    }

    create_audit_log($connection, $userId, $action, $details);
    echo json_encode(['success' => true, 'message' => 'Audit log recorded.']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
