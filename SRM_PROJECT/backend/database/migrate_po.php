<?php
// ============================================================
// migrate_po.php — Add Purchase Order fields and tables to srm_portal
// ============================================================

require_once __DIR__ . '/../config/db.php';
$connection = db_connection();

echo "Running PO integration migrations...\n";

// 1. Create po_items table if it does not exist
$createTableQuery = "
CREATE TABLE IF NOT EXISTS po_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

if ($connection->query($createTableQuery)) {
    echo "Table 'po_items' created or already exists.\n";
} else {
    echo "Failed to create 'po_items': " . $connection->error . "\n";
}

// Helper function to safely add columns if they don't exist
function addColumnIfNeeded($connection, $table, $column, $definition) {
    $result = $connection->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    if ($result->num_rows === 0) {
        if ($connection->query("ALTER TABLE `$table` ADD COLUMN `$column` $definition")) {
            echo "Successfully added column '$column' to table '$table'.\n";
        } else {
            echo "Failed to add column '$column' to table '$table': " . $connection->error . "\n";
        }
    } else {
        echo "Column '$column' in table '$table' already exists.\n";
    }
}

// 2. Add columns to purchase_orders table
addColumnIfNeeded($connection, 'purchase_orders', 'rfq_id', "VARCHAR(50) DEFAULT NULL AFTER supplier_quote_id");
addColumnIfNeeded($connection, 'purchase_orders', 'supplier_id', "INT UNSIGNED DEFAULT NULL AFTER rfq_id");
addColumnIfNeeded($connection, 'purchase_orders', 'total_amount', "DECIMAL(12,2) DEFAULT NULL AFTER supplier_id");
addColumnIfNeeded($connection, 'purchase_orders', 'legal_terms', "TEXT DEFAULT NULL AFTER total_amount");
addColumnIfNeeded($connection, 'purchase_orders', 'final_terms_agreed', "TINYINT(1) DEFAULT 1 AFTER legal_terms");
addColumnIfNeeded($connection, 'purchase_orders', 'issued_to_supplier', "TINYINT(1) DEFAULT 0 AFTER final_terms_agreed");

// Check if constraints already exist, if not add them
$fkRfqRes = $connection->query("
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'srm_portal' 
      AND TABLE_NAME = 'purchase_orders' 
      AND COLUMN_NAME = 'rfq_id' 
      AND REFERENCED_TABLE_NAME = 'rfqs'
");
if ($fkRfqRes->num_rows === 0) {
    if ($connection->query("ALTER TABLE purchase_orders ADD CONSTRAINT fk_po_rfq FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE SET NULL")) {
        echo "Successfully added constraint fk_po_rfq.\n";
    } else {
        echo "Failed to add constraint fk_po_rfq: " . $connection->error . "\n";
    }
}

$fkSupplierRes = $connection->query("
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'srm_portal' 
      AND TABLE_NAME = 'purchase_orders' 
      AND COLUMN_NAME = 'supplier_id' 
      AND REFERENCED_TABLE_NAME = 'users'
");
if ($fkSupplierRes->num_rows === 0) {
    if ($connection->query("ALTER TABLE purchase_orders ADD CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE SET NULL")) {
        echo "Successfully added constraint fk_po_supplier.\n";
    } else {
        echo "Failed to add constraint fk_po_supplier: " . $connection->error . "\n";
    }
}

// 3. Add status ENUM to supplier_quotes if not exists
addColumnIfNeeded($connection, 'supplier_quotes', 'status', "ENUM('submitted','under_review','awarded','rejected') DEFAULT 'submitted'");

// 4. Add status ENUM to bids if not exists
addColumnIfNeeded($connection, 'bids', 'status', "ENUM('submitted','under_review','awarded','rejected') DEFAULT 'submitted'");

// 5. Modify purchase_orders status ENUM values
$connection->query("ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('issued', 'pending', 'shipped', 'delivered', 'fulfilled', 'cancelled') DEFAULT 'issued'");
echo "Updated purchase_orders status ENUM values.\n";

echo "PO migration completed.\n";
?>
