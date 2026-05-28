<?php

define('SRM_PROJECT_ROOT', 'c:/xampp/htdocs/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT');
require_once SRM_PROJECT_ROOT . '/backend/config/db.php';

echo "Testing DB Connection...\n";
try {
    $conn = db_connection();
    echo "Connected successfully.\n\n";
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

$tables = [
    'users' => 'SELECT id, full_name, email, role, password_hash, company_name FROM users LIMIT 1',
    'suppliers' => 'SELECT supplier_id, user_id, company_name, rating FROM suppliers LIMIT 1',
    'compliance_documents' => 'SELECT id, type, issuer, expiry, status FROM compliance_documents LIMIT 1',
    'categories' => 'SELECT category_id, category_name FROM categories LIMIT 1',
    'products' => 'SELECT product_id, supplier_id, product_name, unit_price FROM products LIMIT 1',
    'rfqs' => 'SELECT id, title, category, deadline, bids, value, status FROM rfqs LIMIT 1',
    'rfq_items' => 'SELECT rfq_item_id, rfq_id, product_name, quantity FROM rfq_items LIMIT 1',
    'bids' => 'SELECT id, rfq_package, price, delivery, warranty, score, best, user_id, supplier_name FROM bids LIMIT 1',
    'quotations' => 'SELECT quotation_id, rfq_id, supplier_id, total_amount, delivery_days FROM quotations LIMIT 1',
    'quotation_items' => 'SELECT quotation_item_id, quotation_id, quoted_price, quantity FROM quotation_items LIMIT 1',
    'purchase_orders' => 'SELECT po_id, po_number, issued_by, status FROM purchase_orders LIMIT 1',
    'goods_receipts' => 'SELECT receipt, po, item, received, accepted, status FROM goods_receipts LIMIT 1',
    'invoices' => 'SELECT id, po, amount, submitted, due, status FROM invoices LIMIT 1',
    'supplier_reviews' => 'SELECT review_id, supplier_id, po_id, rating FROM supplier_reviews LIMIT 1',
    'notifications' => 'SELECT notification_id, user_id, message FROM notifications LIMIT 1',
    'workspace_messages' => 'SELECT message_id, rfq_id, sender_id, message_text FROM workspace_messages LIMIT 1',
    'audit_logs' => 'SELECT log_id, user_id, action FROM audit_logs LIMIT 1',
    'spend_analytics_snapshots' => 'SELECT snapshot_id, record_year, record_month, total_spend FROM spend_analytics_snapshots LIMIT 1'
];

$errors = 0;
foreach ($tables as $table => $query) {
    echo "Testing table '$table'... ";
    $res = $conn->query($query);
    if ($res) {
        echo "OK (Rows: " . $res->num_rows . ")\n";
    } else {
        echo "FAILED: " . $conn->error . "\n";
        $errors++;
    }
}

if ($errors === 0) {
    echo "\nALL TESTS PASSED! Unified schema is fully backward-compatible.\n";
} else {
    echo "\n$errors TABLES FAILED COMPATIBILITY CHECK!\n";
    exit(1);
}

