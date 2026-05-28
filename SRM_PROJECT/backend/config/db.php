<?php

declare(strict_types=1);

function db_config(): array
{
    return [
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'user' => getenv('DB_USER') ?: 'root',
        'pass' => getenv('DB_PASS') ?: '',
        'name' => getenv('DB_NAME') ?: 'srm_portal',
        'port' => 3307, // Added custom port tracking for XAMPP conflict
    ];
}

function db_connection(): mysqli
{
    $config = db_config();
    $connection = new mysqli(
        $config['host'],
        $config['user'],
        $config['pass'],
        $config['name'],
        $config['port'] // Added port variable right here
    );

    if ($connection->connect_error) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $connection->connect_error,
        ]);
        exit;
    }

    $connection->set_charset('utf8mb4');
    return $connection;
}