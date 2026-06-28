-- =========================================================
-- SUPPLIER RELATIONSHIP MANAGEMENT (SRM) DATABASE
-- =========================================================
-- Project: Web-Based Supplier Relationship Management Portal
-- Database: MySQL
-- Purpose:
-- This database supports:
--   - Supplier registration & approval
--   - Product management
--   - RFQ (Request for Quotation) lifecycle
--   - Quotation bidding
--   - PDF quotation uploads
--   - Purchase orders
--   - Goods receiving
--   - Supplier reviews & analytics
--
-- Recommended Engine: InnoDB
-- Recommended Charset: utf8mb4
-- =========================================================


-- =========================================================
-- CREATE DATABASE
-- =========================================================

CREATE DATABASE IF NOT EXISTS srm_portal
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE srm_portal;



-- =========================================================
-- USERS TABLE
-- =========================================================
-- Stores login credentials and role information.
-- Roles:
--   - admin
--   - supplier
--
-- status:
--   - pending  -> waiting for approval
--   - active   -> approved and usable
--   - blocked  -> suspended user
-- =========================================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(120) UNIQUE NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    phone VARCHAR(20),

    role ENUM('admin', 'supplier') NOT NULL,

    status ENUM('pending', 'active', 'blocked')
    DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB;



-- =========================================================
-- SUPPLIERS TABLE
-- =========================================================
-- Stores supplier/company-specific information.
-- Linked to the users table.
--
-- approved_by:
--     Admin who approved the supplier
-- =========================================================

CREATE TABLE suppliers (

    supplier_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    company_name VARCHAR(150) NOT NULL,

    gst_number VARCHAR(50),

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100),

    website VARCHAR(255),

    rating DECIMAL(2,1) DEFAULT 0.0,

    approved_by INT NULL,

    approved_at TIMESTAMP NULL,

    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE,

    FOREIGN KEY (approved_by)
    REFERENCES users(user_id)
    ON DELETE SET NULL

) ENGINE=InnoDB;



-- =========================================================
-- PRODUCT CATEGORIES TABLE
-- =========================================================
-- Used for organizing supplier products.
-- =========================================================

CREATE TABLE categories (

    category_id INT AUTO_INCREMENT PRIMARY KEY,

    category_name VARCHAR(100) UNIQUE NOT NULL

) ENGINE=InnoDB;



-- =========================================================
-- PRODUCTS TABLE
-- =========================================================
-- Products uploaded by suppliers.
-- Each product belongs to:
--     - one supplier
--     - one category
-- =========================================================

CREATE TABLE products (

    product_id INT AUTO_INCREMENT PRIMARY KEY,

    supplier_id INT NOT NULL,

    category_id INT,

    product_name VARCHAR(150) NOT NULL,

    description TEXT,

    unit_price DECIMAL(10,2),

    stock_quantity INT DEFAULT 0,

    unit VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (supplier_id)
    REFERENCES suppliers(supplier_id)
    ON DELETE CASCADE,

    FOREIGN KEY (category_id)
    REFERENCES categories(category_id)
    ON DELETE SET NULL

) ENGINE=InnoDB;



-- =========================================================
-- RFQ TABLE (REQUEST FOR QUOTATION)
-- =========================================================
-- Created by admins to invite supplier quotations.
--
-- status:
--   open      -> suppliers can bid
--   closed    -> deadline passed
--   awarded   -> quotation selected
-- =========================================================

CREATE TABLE rfqs (

    rfq_id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    created_by INT NOT NULL,

    deadline DATETIME NOT NULL,

    status ENUM('open', 'closed', 'awarded')
    DEFAULT 'open',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by)
    REFERENCES users(user_id)
    ON DELETE CASCADE

) ENGINE=InnoDB;



-- =========================================================
-- RFQ ITEMS TABLE
-- =========================================================
-- Each RFQ can contain multiple requested items.
-- =========================================================

CREATE TABLE rfq_items (

    rfq_item_id INT AUTO_INCREMENT PRIMARY KEY,

    rfq_id INT NOT NULL,

    product_name VARCHAR(150) NOT NULL,

    quantity INT NOT NULL,

    specifications TEXT,

    FOREIGN KEY (rfq_id)
    REFERENCES rfqs(rfq_id)
    ON DELETE CASCADE

) ENGINE=InnoDB;



-- =========================================================
-- QUOTATIONS TABLE
-- =========================================================
-- Supplier quotation submission against RFQs.
--
-- status:
--   submitted
--   selected
--   rejected
-- =========================================================

CREATE TABLE quotations (

    quotation_id INT AUTO_INCREMENT PRIMARY KEY,

    rfq_id INT NOT NULL,

    supplier_id INT NOT NULL,

    total_amount DECIMAL(12,2),

    delivery_days INT,

    remarks TEXT,

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status ENUM('submitted', 'selected', 'rejected')
    DEFAULT 'submitted',

    FOREIGN KEY (rfq_id)
    REFERENCES rfqs(rfq_id)
    ON DELETE CASCADE,

    FOREIGN KEY (supplier_id)
    REFERENCES suppliers(supplier_id)
    ON DELETE CASCADE

) ENGINE=InnoDB;



-- =========================================================
-- QUOTATION ITEMS TABLE
-- =========================================================
-- Stores detailed pricing for individual RFQ items.
-- Enables bid comparison.
-- =========================================================

CREATE TABLE quotation_items (

    quotation_item_id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL,

    rfq_item_id INT NOT NULL,

    quoted_price DECIMAL(10,2) NOT NULL,

    quantity INT NOT NULL,

    FOREIGN KEY (quotation_id)
    REFERENCES quotations(quotation_id)
    ON DELETE CASCADE,

    FOREIGN KEY (rfq_item_id)
    REFERENCES rfq_items(rfq_item_id)
    ON DELETE CASCADE

) ENGINE=InnoDB;



-- =========================================================
-- QUOTATION DOCUMENTS TABLE
-- =========================================================
-- Stores uploaded quotation PDF metadata.
--
-- IMPORTANT:
-- Actual PDF files are stored on the server/cloud storage.
-- MySQL stores only:
--     - file path
--     - file name
--     - metadata
-- =========================================================

CREATE TABLE quotation_documents (

    document_id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL,

    supplier_id INT NOT NULL,

    original_file_name VARCHAR(255) NOT NULL,

    stored_file_name VARCHAR(255) NOT NULL,

    file_path VARCHAR(500) NOT NULL,

    file_size BIGINT,

    mime_type VARCHAR(100),

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quotation_id)
    REFERENCES quotations(quotation_id)
    ON DELETE CASCADE,

    FOREIGN KEY (supplier_id)
    REFERENCES suppliers(supplier_id)
    ON DELETE CASCADE

) ENGINE=InnoDB;



-- =========================================================
-- PURCHASE ORDERS TABLE
-- =========================================================
-- Generated after selecting the winning quotation.
--
-- status:
--   issued
--   shipped
--   delivered
--   cancelled
-- =========================================================

CREATE TABLE purchase_orders (

    po_id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL,

    po_number VARCHAR(100) UNIQUE NOT NULL,

    issued_by INT NOT NULL,

    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    expected_delivery DATE,

    status ENUM(
        'issued',
        'shipped',
        'delivered',
        'cancelled'
    ) DEFAULT 'issued',

    FOREIGN KEY (quotation_id)
    REFERENCES quotations(quotation_id)
    ON DELETE CASCADE,

    FOREIGN KEY (issued_by)
    REFERENCES users(user_id)
    ON DELETE CASCADE

) ENGINE=InnoDB;



-- =========================================================
-- GOODS RECEIPTS TABLE
-- =========================================================
-- Stores delivery verification details.
-- Used when admin receives ordered goods.
-- =========================================================

CREATE TABLE goods_receipts (

    receipt_id INT AUTO_INCREMENT PRIMARY KEY,

    po_id INT NOT NULL,

    received_by INT NOT NULL,

    received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    damaged_items INT DEFAULT 0,

    missing_items INT DEFAULT 0,

    remarks TEXT,

    FOREIGN KEY (po_id)
    REFERENCES purchase_orders(po_id)
    ON DELETE CASCADE,

    FOREIGN KEY (received_by)
    REFERENCES users(user_id)
    ON DELETE CASCADE

) ENGINE=InnoDB;



-- =========================================================
-- SUPPLIER REVIEWS TABLE
-- =========================================================
-- Admin rates supplier performance after procurement cycle.
-- =========================================================

CREATE TABLE supplier_reviews (

    review_id INT AUTO_INCREMENT PRIMARY KEY,

    supplier_id INT NOT NULL,

    po_id INT NOT NULL,

    rating INT CHECK (rating BETWEEN 1 AND 5),

    review TEXT,

    reviewed_by INT NOT NULL,

    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (supplier_id)
    REFERENCES suppliers(supplier_id)
    ON DELETE CASCADE,

    FOREIGN KEY (po_id)
    REFERENCES purchase_orders(po_id)
    ON DELETE CASCADE,

    FOREIGN KEY (reviewed_by)
    REFERENCES users(user_id)
    ON DELETE CASCADE

) ENGINE=InnoDB;



-- =========================================================
-- NOTIFICATIONS TABLE
-- =========================================================
-- Stores user notifications.
-- Example:
--   - RFQ published
--   - quotation selected
--   - PO generated
-- =========================================================

CREATE TABLE notifications (

    notification_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    message TEXT NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE

) ENGINE=InnoDB;



-- =========================================================
-- INDEXES
-- =========================================================
-- Improves query/search performance.
-- =========================================================

CREATE INDEX idx_user_email
ON users(email);

CREATE INDEX idx_supplier_company
ON suppliers(company_name);

CREATE INDEX idx_product_supplier
ON products(supplier_id);

CREATE INDEX idx_rfq_deadline
ON rfqs(deadline);

CREATE INDEX idx_quotation_supplier
ON quotations(supplier_id);

CREATE INDEX idx_po_number
ON purchase_orders(po_number);



-- =========================================================
-- END OF DATABASE SCHEMA
-- =========================================================