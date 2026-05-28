<?php
define('SRM_PROJECT_ROOT', 'c:/xampp/htdocs/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT');
require_once SRM_PROJECT_ROOT . '/backend/config/db.php';

$connection = db_connection();
$email = 'admin@srm.local';
$password = 'password123';

$stmt = $connection->prepare('SELECT id, full_name, role, password_hash, company_name FROM users WHERE email = ? LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user) {
    echo "User not found\n";
    exit(1);
}

if (password_verify($password, $user['password_hash'])) {
    echo "Login check PASSED for admin@srm.local!\n";
} else {
    echo "Login check FAILED for admin@srm.local\n";
}

