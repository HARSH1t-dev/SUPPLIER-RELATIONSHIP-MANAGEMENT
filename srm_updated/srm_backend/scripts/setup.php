<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/src/Database.php';
require_once dirname(__DIR__) . '/src/RfqService.php';

$config = require dirname(__DIR__) . '/config/config.php';

echo "SRM RFQ — MySQL setup\n";
echo "Host: {$config['db_host']}:{$config['db_port']}\n";
echo "Database: {$config['db_name']}\n\n";

try {
    $server = \Srm\Database::serverConnection($config);
} catch (Throwable $e) {
    fwrite(STDERR, "Cannot connect to MySQL server: {$e->getMessage()}\n");
    fwrite(STDERR, "Check DB_HOST, DB_USER, DB_PASS in .env\n");
    exit(1);
}

$dbName = $config['db_name'];
$server->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$server->exec("USE `{$dbName}`");

$schema = file_get_contents(dirname(__DIR__) . '/sql/schema.sql');
if ($schema === false) {
    fwrite(STDERR, "Could not read sql/schema.sql\n");
    exit(1);
}

foreach (array_filter(array_map('trim', explode(';', $schema))) as $statement) {
    if ($statement !== '') {
        $server->exec($statement);
    }
}

$service = new \Srm\RfqService(\Srm\Database::connection());
$service->seedIfEmpty();

echo "Setup complete. Tables ready with demo data (if empty).\n";
echo "Start API: php -S 127.0.0.1:3001 -t public public/router.php\n";
