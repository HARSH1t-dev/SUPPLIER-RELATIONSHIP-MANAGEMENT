<?php

declare(strict_types=1);

function audit_client_ip(): ?string
{
    return $_SERVER['REMOTE_ADDR'] ?? null;
}

function create_audit_log(mysqli $connection, ?int $userId, string $action, string $details): void
{
    $stmt = $connection->prepare(
        'INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)'
    );
    if (!$stmt) {
        return;
    }

    $ip = audit_client_ip();
    $stmt->bind_param('isss', $userId, $action, $ip, $details);
    $stmt->execute();
    $stmt->close();
}
