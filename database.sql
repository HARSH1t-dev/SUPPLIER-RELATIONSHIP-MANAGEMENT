-- ============================================================
-- SRM Bidding System - Complete MySQL Database Schema
-- Version: 1.0.0
-- Description: Supplier Relationship Management Bidding Module
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS `srm_bidding`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `srm_bidding`;

-- ============================================================
-- TABLE: users
-- Stores system users: admins and suppliers.
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
    `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `name`          VARCHAR(150)    NOT NULL,
    `email`         VARCHAR(255)    NOT NULL,
    `password_hash` VARCHAR(255)    NOT NULL,
    `role`          ENUM('admin','supplier') NOT NULL DEFAULT 'supplier',
    `is_active`     TINYINT(1)      NOT NULL DEFAULT 1,
    `last_login`    DATETIME        NULL DEFAULT NULL,
    `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_email` (`email`),
    KEY `idx_users_role` (`role`),
    KEY `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='System users: admins and supplier accounts';


-- ============================================================
-- TABLE: suppliers
-- Extended profile for users with role = supplier.
-- ============================================================
CREATE TABLE IF NOT EXISTS `suppliers` (
    `id`             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `user_id`        INT UNSIGNED    NOT NULL,
    `company_name`   VARCHAR(200)    NOT NULL,
    `contact_person` VARCHAR(150)    NOT NULL,
    `phone`          VARCHAR(30)     NOT NULL,
    `address`        TEXT            NOT NULL,
    `gst_number`     VARCHAR(20)     NULL DEFAULT NULL,
    `category`       VARCHAR(100)    NOT NULL,
    `status`         ENUM('active','inactive','blacklisted') NOT NULL DEFAULT 'active',
    `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_suppliers_user_id` (`user_id`),
    UNIQUE KEY `uq_suppliers_gst` (`gst_number`),
    KEY `idx_suppliers_status` (`status`),
    KEY `idx_suppliers_category` (`category`),
    CONSTRAINT `fk_suppliers_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Supplier company profiles linked to user accounts';


-- ============================================================
-- TABLE: rfqs
-- Request for Quotation records created by admins.
-- rfq_number is a unique human-readable identifier.
-- ============================================================
CREATE TABLE IF NOT EXISTS `rfqs` (
    `id`                     INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    `rfq_number`             VARCHAR(20)      NOT NULL,
    `title`                  VARCHAR(255)     NOT NULL,
    `product_name`           VARCHAR(200)     NOT NULL,
    `description`            TEXT             NOT NULL,
    `quantity`               DECIMAL(15,2)    NOT NULL,
    `unit`                   VARCHAR(50)      NOT NULL,
    `category`               VARCHAR(100)     NOT NULL,
    `initial_expected_price` DECIMAL(15,2)    NOT NULL DEFAULT 0.00,
    `required_delivery_date` DATE             NOT NULL,
    `terms_conditions`       TEXT             NULL DEFAULT NULL,
    `deadline`               DATETIME         NOT NULL,
    `status`                 ENUM('OPEN','CLOSED','FINALIZED','CANCELLED') NOT NULL DEFAULT 'OPEN',
    `created_by`             INT UNSIGNED     NOT NULL,
    `created_at`             DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`             DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_rfqs_number` (`rfq_number`),
    KEY `idx_rfqs_status` (`status`),
    KEY `idx_rfqs_category` (`category`),
    KEY `idx_rfqs_deadline` (`deadline`),
    KEY `idx_rfqs_created_by` (`created_by`),
    CONSTRAINT `fk_rfqs_created_by`
        FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Request for Quotations created by administrators';


-- ============================================================
-- TABLE: rfq_suppliers
-- Maps which suppliers are invited/assigned to an RFQ.
-- ============================================================
CREATE TABLE IF NOT EXISTS `rfq_suppliers` (
    `id`          INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    `rfq_id`      INT UNSIGNED   NOT NULL,
    `supplier_id` INT UNSIGNED   NOT NULL,
    `assigned_at` DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `notified_at` DATETIME       NULL DEFAULT NULL,
    `status`      ENUM('pending','viewed','responded') NOT NULL DEFAULT 'pending',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_rfq_supplier` (`rfq_id`, `supplier_id`),
    KEY `idx_rfq_suppliers_rfq_id` (`rfq_id`),
    KEY `idx_rfq_suppliers_supplier_id` (`supplier_id`),
    KEY `idx_rfq_suppliers_status` (`status`),
    CONSTRAINT `fk_rfq_suppliers_rfq_id`
        FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_rfq_suppliers_supplier_id`
        FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Junction table assigning suppliers to specific RFQs';


-- ============================================================
-- TABLE: bids
-- Bid submitted by a supplier against an RFQ.
-- ============================================================
CREATE TABLE IF NOT EXISTS `bids` (
    `id`                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `rfq_id`              INT UNSIGNED    NOT NULL,
    `supplier_id`         INT UNSIGNED    NOT NULL,
    `price_per_unit`      DECIMAL(15,2)   NOT NULL,
    `total_amount`        DECIMAL(15,2)   NOT NULL,
    `delivery_timeline`   INT UNSIGNED    NOT NULL COMMENT 'Delivery time in days',
    `notes`               TEXT            NULL DEFAULT NULL,
    `status`              ENUM('SUBMITTED','UNDER_NEGOTIATION','COUNTERED','ACCEPTED','REJECTED','FINALIZED') NOT NULL DEFAULT 'SUBMITTED',
    `final_agreed_amount` DECIMAL(15,2)   NULL DEFAULT NULL,
    `submitted_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_bids_rfq_supplier` (`rfq_id`, `supplier_id`),
    KEY `idx_bids_rfq_id` (`rfq_id`),
    KEY `idx_bids_supplier_id` (`supplier_id`),
    KEY `idx_bids_status` (`status`),
    CONSTRAINT `fk_bids_rfq_id`
        FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_bids_supplier_id`
        FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Supplier bids submitted in response to RFQs';


-- ============================================================
-- TABLE: negotiations
-- Tracks each round of price negotiation on a bid.
-- ============================================================
CREATE TABLE IF NOT EXISTS `negotiations` (
    `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `bid_id`        INT UNSIGNED    NOT NULL,
    `round_number`  INT UNSIGNED    NOT NULL DEFAULT 1,
    `initiated_by`  INT UNSIGNED    NOT NULL,
    `offered_price` DECIMAL(15,2)   NOT NULL,
    `message`       TEXT            NULL DEFAULT NULL,
    `status`        ENUM('PENDING','ACCEPTED','REJECTED','COUNTERED') NOT NULL DEFAULT 'PENDING',
    `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_negotiations_bid_id` (`bid_id`),
    KEY `idx_negotiations_initiated_by` (`initiated_by`),
    KEY `idx_negotiations_status` (`status`),
    CONSTRAINT `fk_negotiations_bid_id`
        FOREIGN KEY (`bid_id`) REFERENCES `bids` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_negotiations_initiated_by`
        FOREIGN KEY (`initiated_by`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Negotiation rounds per bid with offered prices and statuses';


-- ============================================================
-- TABLE: bid_messages
-- Threaded messages/offers exchanged per bid (admin <-> supplier).
-- ============================================================
CREATE TABLE IF NOT EXISTS `bid_messages` (
    `id`           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `bid_id`       INT UNSIGNED    NOT NULL,
    `sender_id`    INT UNSIGNED    NOT NULL,
    `message`      TEXT            NOT NULL,
    `message_type` ENUM('message','counter_offer','acceptance','rejection','system') NOT NULL DEFAULT 'message',
    `is_read`      TINYINT(1)      NOT NULL DEFAULT 0,
    `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_bid_messages_bid_id` (`bid_id`),
    KEY `idx_bid_messages_sender_id` (`sender_id`),
    KEY `idx_bid_messages_is_read` (`is_read`),
    KEY `idx_bid_messages_created_at` (`created_at`),
    CONSTRAINT `fk_bid_messages_bid_id`
        FOREIGN KEY (`bid_id`) REFERENCES `bids` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_bid_messages_sender_id`
        FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Threaded messages exchanged during bid negotiation';


-- ============================================================
-- TABLE: bid_attachments
-- Files attached to a bid (quotes, specs, certificates, etc.).
-- ============================================================
CREATE TABLE IF NOT EXISTS `bid_attachments` (
    `id`                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `bid_id`            INT UNSIGNED    NOT NULL,
    `uploaded_by`       INT UNSIGNED    NOT NULL,
    `original_filename` VARCHAR(255)    NOT NULL,
    `stored_filename`   VARCHAR(255)    NOT NULL,
    `file_size`         INT UNSIGNED    NOT NULL COMMENT 'File size in bytes',
    `mime_type`         VARCHAR(100)    NOT NULL,
    `uploaded_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_bid_attachments_bid_id` (`bid_id`),
    KEY `idx_bid_attachments_uploaded_by` (`uploaded_by`),
    CONSTRAINT `fk_bid_attachments_bid_id`
        FOREIGN KEY (`bid_id`) REFERENCES `bids` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_bid_attachments_uploaded_by`
        FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Files and documents attached to bids';


-- ============================================================
-- TABLE: audit_logs
-- Immutable log of all significant system actions.
-- user_id is nullable to capture unauthenticated events.
-- ============================================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id`          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `user_id`     INT UNSIGNED     NULL DEFAULT NULL,
    `action`      VARCHAR(100)     NOT NULL,
    `entity_type` VARCHAR(50)      NOT NULL,
    `entity_id`   INT UNSIGNED     NULL DEFAULT NULL,
    `description` TEXT             NULL DEFAULT NULL,
    `ip_address`  VARCHAR(45)      NULL DEFAULT NULL COMMENT 'Supports IPv6',
    `user_agent`  VARCHAR(500)     NULL DEFAULT NULL,
    `created_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_audit_logs_user_id` (`user_id`),
    KEY `idx_audit_logs_action` (`action`),
    KEY `idx_audit_logs_entity` (`entity_type`, `entity_id`),
    KEY `idx_audit_logs_created_at` (`created_at`),
    CONSTRAINT `fk_audit_logs_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable audit trail for all significant system events';


-- ============================================================
-- TABLE: notifications
-- In-app notifications delivered to users.
-- ============================================================
CREATE TABLE IF NOT EXISTS `notifications` (
    `id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `user_id`    INT UNSIGNED    NOT NULL,
    `type`       ENUM('rfq_assigned','bid_submitted','counter_offer','bid_finalized','bid_rejected','bid_accepted') NOT NULL,
    `title`      VARCHAR(255)    NOT NULL,
    `message`    TEXT            NOT NULL,
    `related_id` INT UNSIGNED    NULL DEFAULT NULL COMMENT 'ID of the related entity (bid_id, rfq_id, etc.)',
    `is_read`    TINYINT(1)      NOT NULL DEFAULT 0,
    `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_notifications_user_id` (`user_id`),
    KEY `idx_notifications_is_read` (`is_read`),
    KEY `idx_notifications_type` (`type`),
    KEY `idx_notifications_created_at` (`created_at`),
    CONSTRAINT `fk_notifications_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='In-app notifications for users';


SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- SEED DATA
-- ============================================================

-- --------------------------------------------------------
-- Admin user: admin@srm.com / Admin@123
-- Password hash generated with: password_hash('Admin@123', PASSWORD_BCRYPT, ['cost'=>12])
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `is_active`, `created_at`) VALUES
(1, 'System Administrator', 'admin@srm.com',
 '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'admin', 1, NOW());

-- --------------------------------------------------------
-- Supplier users: supplier[1-3]@test.com / Supplier@123
-- Password hash generated with: password_hash('Supplier@123', PASSWORD_BCRYPT, ['cost'=>12])
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `is_active`, `created_at`) VALUES
(2, 'Rajesh Kumar',  'supplier1@test.com',
 '$2y$12$8N9FkW1QfSWmW3TJxDw6W.6MuSjOGHJ7VHkXBrH5T7cGWf1FnTmJe',
 'supplier', 1, NOW()),
(3, 'Priya Sharma',  'supplier2@test.com',
 '$2y$12$8N9FkW1QfSWmW3TJxDw6W.6MuSjOGHJ7VHkXBrH5T7cGWf1FnTmJe',
 'supplier', 1, NOW()),
(4, 'Amit Patel',    'supplier3@test.com',
 '$2y$12$8N9FkW1QfSWmW3TJxDw6W.6MuSjOGHJ7VHkXBrH5T7cGWf1FnTmJe',
 'supplier', 1, NOW());

-- --------------------------------------------------------
-- Supplier profiles
-- --------------------------------------------------------
INSERT INTO `suppliers` (`id`, `user_id`, `company_name`, `contact_person`, `phone`, `address`, `gst_number`, `category`, `status`, `created_at`) VALUES
(1, 2, 'Kumar Enterprises Pvt. Ltd.',  'Rajesh Kumar', '+91-9876543210',
 '12, Industrial Area, Phase-II, Chandigarh - 160002', '22AAAAA0000A1Z5',
 'Raw Materials', 'active', NOW()),
(2, 3, 'Sharma Tech Solutions',        'Priya Sharma',  '+91-9123456789',
 '45, Tech Park, Whitefield, Bengaluru - 560066',       '29BBBBB1111B1Z6',
 'IT Equipment',  'active', NOW()),
(3, 4, 'Patel Industrial Supplies',    'Amit Patel',    '+91-9988776655',
 '78, GIDC Estate, Vatva, Ahmedabad - 382445',          '24CCCCC2222C1Z7',
 'Machinery',     'active', NOW());

-- --------------------------------------------------------
-- Sample RFQs
-- --------------------------------------------------------
INSERT INTO `rfqs` (`id`, `rfq_number`, `title`, `product_name`, `description`, `quantity`, `unit`,
                    `category`, `initial_expected_price`, `required_delivery_date`, `terms_conditions`,
                    `deadline`, `status`, `created_by`, `created_at`) VALUES
(1, 'RFQ-2024-0001',
 'Office Workstation Procurement',
 'Desktop Workstation',
 'Procurement of high-performance desktop workstations for the engineering team. Required specs: Intel Core i7 13th Gen, 32GB DDR5 RAM, 1TB NVMe SSD, Dedicated 8GB GPU, Windows 11 Pro.',
 50.00, 'Units', 'IT Equipment', 75000.00,
 DATE_ADD(CURDATE(), INTERVAL 30 DAY),
 'Payment within 30 days of delivery. Warranty minimum 3 years on-site. GST invoice mandatory. Delivery charges included.',
 DATE_ADD(NOW(), INTERVAL 7 DAY),
 'OPEN', 1, NOW()),
(2, 'RFQ-2024-0002',
 'Industrial Steel Raw Material Supply',
 'MS Steel Sheets (3mm)',
 'Supply of mild steel sheets of 3mm thickness, IS 2062 Grade E250 compliant. Dimensions: 2500mm x 1250mm. Surface finish: hot-rolled. Material test certificates required.',
 500.00, 'Sheets', 'Raw Materials', 4500.00,
 DATE_ADD(CURDATE(), INTERVAL 45 DAY),
 'Delivery in lots of 100 sheets per week. Quality certificates (MTC) mandatory per lot. Payment Net-45 days. Rejected material to be replaced within 7 working days.',
 DATE_ADD(NOW(), INTERVAL 10 DAY),
 'OPEN', 1, NOW());

-- --------------------------------------------------------
-- Assign suppliers to RFQs
-- --------------------------------------------------------
INSERT INTO `rfq_suppliers` (`rfq_id`, `supplier_id`, `status`, `assigned_at`, `notified_at`) VALUES
-- RFQ-1: IT Equipment → assigned to Sharma Tech and Patel Industrial
(1, 2, 'responded', NOW(), NOW()),
(1, 3, 'viewed',    NOW(), NOW()),
-- RFQ-2: Raw Materials → assigned to Kumar Enterprises and Patel Industrial
(2, 1, 'responded', NOW(), NOW()),
(2, 3, 'pending',   NOW(), NULL);

-- --------------------------------------------------------
-- Sample bids
-- --------------------------------------------------------
INSERT INTO `bids` (`id`, `rfq_id`, `supplier_id`, `price_per_unit`, `total_amount`, `delivery_timeline`,
                    `notes`, `status`, `final_agreed_amount`, `submitted_at`) VALUES
(1, 1, 2,
 72500.00, 3625000.00, 21,
 'Includes on-site installation and configuration. 3-year comprehensive warranty with 24-hour support SLA. All units pre-tested before dispatch.',
 'UNDER_NEGOTIATION', NULL, NOW()),
(2, 2, 1,
 4200.00, 2100000.00, 14,
 'IS 2062 E250 certified material. MTC provided per batch. Delivery in 5 lots of 100 sheets each starting from Day 7 of PO. Replacement guaranteed within 5 working days.',
 'SUBMITTED', NULL, NOW());

-- --------------------------------------------------------
-- Sample negotiation (Round 1 on Bid #1)
-- --------------------------------------------------------
INSERT INTO `negotiations` (`bid_id`, `round_number`, `initiated_by`, `offered_price`, `message`, `status`, `created_at`) VALUES
(1, 1, 1,
 70000.00,
 'Thank you for your quotation. Based on our budget allocation and market benchmarks, we would like to counter-offer at INR 70,000 per unit for a quantity of 50 units. Please review and confirm if this is acceptable.',
 'PENDING', NOW());

-- --------------------------------------------------------
-- Bid messages corresponding to negotiation
-- --------------------------------------------------------
INSERT INTO `bid_messages` (`bid_id`, `sender_id`, `message`, `message_type`, `is_read`, `created_at`) VALUES
(1, 1,
 'Thank you for submitting your bid. We have reviewed your proposal and would like to initiate a negotiation. Please find our counter-offer in the negotiation section.',
 'message', 0, NOW()),
(1, 1,
 'Counter-offer: INR 70,000 per unit. Total value: INR 35,00,000. Please respond at your earliest convenience.',
 'counter_offer', 0, NOW());

-- --------------------------------------------------------
-- Sample notifications
-- --------------------------------------------------------
INSERT INTO `notifications` (`user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES
(2, 'rfq_assigned',
 'New RFQ Assigned: RFQ-2024-0001',
 'You have been invited to submit a bid for RFQ-2024-0001 - Office Workstation Procurement. Deadline: ' || DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 7 DAY), '%d-%m-%Y'),
 1, 0, NOW()),
(3, 'rfq_assigned',
 'New RFQ Assigned: RFQ-2024-0001',
 'You have been invited to submit a bid for RFQ-2024-0001 - Office Workstation Procurement. Deadline: ' || DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 7 DAY), '%d-%m-%Y'),
 1, 0, NOW()),
(2, 'counter_offer',
 'Counter-Offer Received on RFQ-2024-0001',
 'The procurement team has sent a counter-offer of INR 70,000 per unit on your bid for RFQ-2024-0001. Please review and respond.',
 1, 0, NOW()),
(1, 'bid_submitted',
 'New Bid Received: RFQ-2024-0002',
 'Supplier "Kumar Enterprises Pvt. Ltd." has submitted a bid of INR 4,200 per unit for RFQ-2024-0002 - Industrial Steel Raw Material Supply.',
 2, 0, NOW());

-- --------------------------------------------------------
-- Sample audit log entries
-- --------------------------------------------------------
INSERT INTO `audit_logs` (`user_id`, `action`, `entity_type`, `entity_id`, `description`, `ip_address`, `created_at`) VALUES
(1, 'CREATE',      'rfq',         1, 'Created RFQ RFQ-2024-0001: Office Workstation Procurement',         '127.0.0.1', NOW()),
(1, 'CREATE',      'rfq',         2, 'Created RFQ RFQ-2024-0002: Industrial Steel Raw Material Supply',    '127.0.0.1', NOW()),
(1, 'ASSIGN',      'rfq_supplier',1, 'Assigned supplier ID 2 (Sharma Tech) to RFQ-2024-0001',             '127.0.0.1', NOW()),
(1, 'ASSIGN',      'rfq_supplier',2, 'Assigned supplier ID 3 (Patel Industrial) to RFQ-2024-0001',        '127.0.0.1', NOW()),
(2, 'SUBMIT_BID',  'bid',         1, 'Supplier ID 2 submitted bid INR 72,500/unit for RFQ-2024-0001',      '192.168.1.10', NOW()),
(1, 'NEGOTIATE',   'negotiation', 1, 'Admin initiated negotiation Round 1 on Bid ID 1 at INR 70,000/unit', '127.0.0.1', NOW()),
(1, 'LOGIN',       'user',        1, 'Admin logged into the system',                                        '127.0.0.1', NOW()),
(2, 'LOGIN',       'user',        2, 'Supplier Rajesh Kumar logged into the system',                        '192.168.1.10', NOW());
