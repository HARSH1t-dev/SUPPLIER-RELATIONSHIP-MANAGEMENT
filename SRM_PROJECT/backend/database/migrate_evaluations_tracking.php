<?php
require_once __DIR__ . '/../config/db.php';

echo "Running evaluations and tracking schema migrations (full table alter & create)...\n";

try {
    $conn = db_connection();

    // Disable foreign keys momentarily
    $conn->query("SET FOREIGN_KEY_CHECKS = 0");

    // 1. Add tracking_status and tracking_number to purchase_orders if they don't exist
    $columnsRes = $conn->query("SHOW COLUMNS FROM `purchase_orders` LIKE 'tracking_status'");
    if ($columnsRes->num_rows === 0) {
        echo "Adding 'tracking_status' and 'tracking_number' columns to 'purchase_orders'... ";
        $alterSql = "
            ALTER TABLE `purchase_orders`
            ADD COLUMN `tracking_status` varchar(50) DEFAULT NULL AFTER `status`,
            ADD COLUMN `tracking_number` varchar(100) DEFAULT NULL AFTER `tracking_status`
        ";
        if ($conn->query($alterSql)) {
            echo "OK\n";
        } else {
            echo "FAILED: " . $conn->error . "\n";
        }
    } else {
        echo "Tracking columns already exist in 'purchase_orders'.\n";
    }

    // Drop tracking_events table to recreate with correct schema if needed
    $conn->query("DROP TABLE IF EXISTS `order_tracking_events`");
    $conn->query("DROP TABLE IF EXISTS `rfq_supplier_evaluations`");

    // 2. Create rfq_supplier_evaluations table
    $evaluationsTableSql = "
        CREATE TABLE `rfq_supplier_evaluations` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `rfq_id` varchar(50) NOT NULL,
          `supplier_id` int(10) unsigned NOT NULL,
          `bid_id` varchar(50) NOT NULL,
          `status` enum('pending','shortlisted','approved_for_bidding','rejected') NOT NULL DEFAULT 'pending',
          `admin_notes` text DEFAULT NULL,
          `evaluation_score` decimal(5,2) NOT NULL DEFAULT 0.00,
          `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          UNIQUE KEY `rfq_supplier_bid` (`rfq_id`, `supplier_id`, `bid_id`),
          KEY `idx_eval_rfq` (`rfq_id`),
          KEY `idx_eval_supplier` (`supplier_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    echo "Creating 'rfq_supplier_evaluations' table... ";
    if ($conn->query($evaluationsTableSql)) {
        echo "OK\n";
    } else {
        echo "FAILED: " . $conn->error . "\n";
    }

    // 3. Create order_tracking_events table
    $trackingTableSql = "
        CREATE TABLE `order_tracking_events` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `po_id` int(11) NOT NULL,
          `status` varchar(50) NOT NULL,
          `description` text DEFAULT NULL,
          `updated_by` int(10) unsigned DEFAULT NULL,
          `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `po_id` (`po_id`),
          KEY `idx_tracking_updated_by` (`updated_by`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    echo "Creating 'order_tracking_events' table... ";
    if ($conn->query($trackingTableSql)) {
        echo "OK\n";
    } else {
        echo "FAILED: " . $conn->error . "\n";
    }

    // Enable foreign keys back
    $conn->query("SET FOREIGN_KEY_CHECKS = 1");

    // 4. Seed some initial supplier evaluations
    echo "Seeding initial evaluations from bids/quotes... ";
    $quotesRes = $conn->query("
        SELECT sq.id AS bid_id, sq.rfq_id, sq.supplier_id, sq.grand_total, sq.delivery, sq.warranty
        FROM supplier_quotes sq
    ");
    if ($quotesRes) {
        $inserted = 0;
        while ($q = $quotesRes->fetch_assoc()) {
            $score = rand(70, 95);
            $stmt = $conn->prepare("
                INSERT INTO rfq_supplier_evaluations (rfq_id, supplier_id, bid_id, status, evaluation_score)
                VALUES (?, ?, ?, 'pending', ?)
                ON DUPLICATE KEY UPDATE id=id
            ");
            $supplierId = (int)$q['supplier_id'];
            $stmt->bind_param("sisd", $q['rfq_id'], $supplierId, $q['bid_id'], $score);
            $stmt->execute();
            $stmt->close();
            $inserted++;
        }
        echo "OK (Seeded $inserted evaluations)\n";
    } else {
        echo "No quotes to seed from.\n";
    }

    // 5. Seed initial order tracking events for purchase orders
    echo "Seeding initial tracking events from purchase orders... ";
    $posRes = $conn->query("
        SELECT po_id, po_number, status, issued_by
        FROM purchase_orders
    ");
    if ($posRes) {
        $inserted = 0;
        while ($po = $posRes->fetch_assoc()) {
            $poId = (int)$po['po_id'];
            $poNumber = $po['po_number'];
            $status = $po['status'];
            
            $trackingStatus = 'PO_CREATED';
            $description = "Purchase order $poNumber created and issued.";
            
            $stmt = $conn->prepare("
                INSERT INTO order_tracking_events (po_id, status, description, updated_by)
                VALUES (?, ?, ?, ?)
            ");
            $updatedBy = (int)$po['issued_by'];
            $stmt->bind_param("issi", $poId, $trackingStatus, $description, $updatedBy);
            $stmt->execute();
            $stmt->close();
            $inserted++;
            
            if ($status === 'shipped' || $status === 'delivered' || $status === 'fulfilled') {
                $trackingStatus = 'SUPPLIER_ACCEPTED';
                $description = "Supplier accepted purchase order $poNumber.";
                $stmt = $conn->prepare("INSERT INTO order_tracking_events (po_id, status, description) VALUES (?, ?, ?)");
                $stmt->bind_param("iss", $poId, $trackingStatus, $description);
                $stmt->execute();
                $stmt->close();
                $inserted++;

                $trackingStatus = 'DISPATCHED';
                $description = "Shipment dispatched to carrier.";
                $stmt = $conn->prepare("INSERT INTO order_tracking_events (po_id, status, description) VALUES (?, ?, ?)");
                $stmt->bind_param("iss", $poId, $trackingStatus, $description);
                $stmt->execute();
                $stmt->close();
                $inserted++;
            }
            
            if ($status === 'delivered' || $status === 'fulfilled') {
                $trackingStatus = 'DELIVERED';
                $description = "Order delivered to buyer location.";
                $stmt = $conn->prepare("INSERT INTO order_tracking_events (po_id, status, description) VALUES (?, ?, ?)");
                $stmt->bind_param("iss", $poId, $trackingStatus, $description);
                $stmt->execute();
                $stmt->close();
                $inserted++;
            }

            if ($status === 'fulfilled') {
                $trackingStatus = 'PAYMENT_COMPLETED';
                $description = "Payment completed — order closed.";
                $stmt = $conn->prepare("INSERT INTO order_tracking_events (po_id, status, description) VALUES (?, ?, ?)");
                $stmt->bind_param("iss", $poId, $trackingStatus, $description);
                $stmt->execute();
                $stmt->close();
                $inserted++;
            }
            
            // Sync current tracking status back to purchase_orders table
            $upd = $conn->prepare("
                UPDATE purchase_orders
                SET tracking_status = ?, tracking_number = ?
                WHERE po_id = ?
            ");
            $trackingNumber = 'TRK-' . strtoupper(substr(md5((string)$poId), 0, 8));
            $upd->bind_param("ssi", $trackingStatus, $trackingNumber, $poId);
            $upd->execute();
            $upd->close();
        }
        echo "OK (Seeded $inserted tracking events)\n";
    } else {
        echo "No purchase orders to seed from.\n";
    }

    echo "\nMIGRATION COMPLETED SUCCESSFULLY!\n";
} catch (Exception $e) {
    echo "\nMIGRATION FAILED: " . $e->getMessage() . "\n";
    exit(1);
}
