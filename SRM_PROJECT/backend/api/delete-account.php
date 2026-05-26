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
$userId = isset($input['id']) ? (int)$input['id'] : 0;

if ($userId <= 0) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Valid user ID is required.',
    ]);
    exit;
}

if ($userId === 1) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Cannot delete the system super admin account.',
    ]);
    exit;
}

$connection = db_connection();

// Start transaction to clean up user data
$connection->begin_transaction();

try {
    // Delete bids associated with this user
    $stmt = $connection->prepare('DELETE FROM bids WHERE user_id = ?');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $stmt->close();

    // Delete the user record
    $stmt = $connection->prepare('DELETE FROM users WHERE id = ?');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    
    if ($stmt->affected_rows === 0) {
        throw new Exception('User account not found.');
    }
    $stmt->close();

    $connection->commit();
    
    // Clear session if active on the server
    session_start();
    if (isset($_SESSION['user']) && $_SESSION['user']['id'] === $userId) {
        $_SESSION = [];
        session_destroy();
    }

    echo json_encode([
        'success' => true,
        'message' => 'Account deleted successfully.',
    ]);
} catch (Exception $e) {
    $connection->rollback();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to delete account: ' . $e->getMessage(),
    ]);
}
