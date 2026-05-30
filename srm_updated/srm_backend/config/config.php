<?php

declare(strict_types=1);

$envPath = dirname(__DIR__) . '/.env';
if (is_readable($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value, " \t\"'");
    }
}

return [
    'db_host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
    'db_port' => (int) ($_ENV['DB_PORT'] ?? 3306),
    'db_name' => $_ENV['DB_NAME'] ?? 'srm_rfq',
    'db_user' => $_ENV['DB_USER'] ?? 'root',
    'db_pass' => $_ENV['DB_PASS'] ?? '',
    'cors_origin' => $_ENV['CORS_ORIGIN'] ?? '*',
];
