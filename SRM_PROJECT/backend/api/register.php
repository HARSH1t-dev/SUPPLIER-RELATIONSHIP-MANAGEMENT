<?php

declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.',
    ]);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$input = json_decode(file_get_contents('php://input'), true);
$input = is_array($input) ? $input : [];

$fullName = isset($input['fullName']) ? trim((string) $input['fullName']) : '';
$email = isset($input['email']) ? trim((string) $input['email']) : '';
$password = isset($input['password']) ? (string) $input['password'] : '';
$role = isset($input['role']) ? trim((string) $input['role']) : 'supplier';

if ($fullName === '' || $email === '' || $password === '') {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Full name, email, and password are required.',
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Enter a valid email address.',
    ]);
    exit;
}

if ($role !== 'admin' && $role !== 'supplier') {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid role.',
    ]);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Password must be at least 6 characters.',
    ]);
    exit;
}

$connection = db_connection();

$checkStmt = $connection->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$checkStmt->bind_param('s', $email);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->fetch_assoc()) {
    $checkStmt->close();
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'message' => 'An account with this email already exists.',
    ]);
    exit;
}

$checkStmt->close();

$passwordHash = password_hash($password, PASSWORD_DEFAULT);
$insertStmt = $connection->prepare('INSERT INTO users (full_name, email, role, password_hash) VALUES (?, ?, ?, ?)');
$insertStmt->bind_param('ssss', $fullName, $email, $role, $passwordHash);

if (!$insertStmt->execute()) {
    $insertStmt->close();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to create account right now.',
    ]);
    exit;
}

$userId = $connection->insert_id;
$insertStmt->close();

session_start();
$_SESSION['user'] = [
    'id' => (int) $userId,
    'fullName' => $fullName,
    'email' => $email,
    'role' => $role,
];

echo json_encode([
    'success' => true,
    'message' => 'Account created successfully.',
    'user' => $_SESSION['user'],
]);