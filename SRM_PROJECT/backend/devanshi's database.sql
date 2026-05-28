-- =========================================================
-- SUPPLIER RELATIONSHIP MANAGEMENT (SRM) DATABASE (DFD-COMPLIANT)
-- =========================================================
-- Project: Web-Based Supplier Relationship Management Portal
-- Database: MySQL
-- Updated to strictly map Data Stores D1 to D12 from Level 1 DFD
-- Engine: InnoDB | Charset: utf8mb4
-- =========================================================

CREATE DATABASE IF NOT EXISTS srm_portal
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE srm_portal;


-- =========================================================
-- [D1] USERS & ROLES
-- =========================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'supplier') NOT NULL DEFAULT 'supplier',
    status ENUM('pending', 'active', 'blocked') DEFAULT 'pending',
    -- Verification fields to support 3-step signup flow safety
    verification_code VARCHAR(6) NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- =========================================================
-- [D2] SUPPLIERS & SUPPLIER PROFILES
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
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- =========================================================
-- [D9] COMPLIANCE DOCUMENTS 
-- Tracks legal onboarding documents (Onboard / Manage Suppliers flow)
-- =========================================================
CREATE TABLE compliance_documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- e.g., 'GST Certificate', 'ISO Certification'
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    remarks TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- [D6] PRODUCTS & INVENTORY
-- Supports Supplier Process 3.5 (Catalog & Inventory Manager)
-- =========================================================
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL
) ENGINE=InnoDB;

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
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- =========================================================
-- [D3] RFQs & RFQ INVITATIONS
-- Supports Admin Process 2.2 and Supplier Process 3.2
-- =========================================================
CREATE TABLE rfqs (
    rfq_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    deadline DATETIME NOT NULL,
    status ENUM('open', 'closed', 'awarded') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE rfq_items (
    rfq_item_id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id INT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL,
    specifications TEXT,
    FOREIGN KEY (rfq_id) REFERENCES rfqs(rfq_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- [D4] BIDS & BID EVALUATIONS
-- Maps Bid Submission Flow (Processes 2.3 & 3.3)
-- =========================================================
CREATE TABLE quotations (
    quotation_id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id INT NOT NULL,
    supplier_id INT NOT NULL,
    total_amount DECIMAL(12,2),
    delivery_days INT,
    remarks TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('submitted', 'selected', 'rejected') DEFAULT 'submitted',
    FOREIGN KEY (rfq_id) REFERENCES rfqs(rfq_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quotation_items (
    quotation_item_id INT AUTO_INCREMENT PRIMARY KEY,
    quotation_id INT NOT NULL,
    rfq_item_id INT NOT NULL,
    quoted_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE,
    FOREIGN KEY (rfq_item_id) REFERENCES rfq_items(rfq_item_id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
    FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- [D5] PURCHASE ORDERS
-- Maps PO Award Flow (Process 2.4 & Process 3.4)
-- =========================================================
CREATE TABLE purchase_orders (
    po_id INT AUTO_INCREMENT PRIMARY KEY,
    quotation_id INT NOT NULL,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    issued_by INT NOT NULL,
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_delivery DATE,
    status ENUM('issued', 'shipped', 'delivered', 'cancelled') DEFAULT 'issued',
    FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- [D7] DELIVERIES & SHIPMENTS
-- Maps Goods Receiving, Inspection, & Delivery Verification (Process 2.6)
-- =========================================================
CREATE TABLE goods_receipts (
    receipt_id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT NOT NULL,
    received_by INT NOT NULL,
    received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    damaged_items INT DEFAULT 0,
    missing_items INT DEFAULT 0,
    remarks TEXT,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    FOREIGN KEY (received_by) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- [D8] INVOICES & PAYMENTS
-- Explicitly added to handle the DFD Payment Flow architecture
-- =========================================================
CREATE TABLE invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT NOT NULL,
    supplier_id INT NOT NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('pending', 'approved', 'paid', 'rejected') DEFAULT 'pending',
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- SUPPLIER PERFORMANCE (Linked to Admin Process 2.5)
-- Evaluation records used to calculate scorecards and KPI values
-- =========================================================
CREATE TABLE supplier_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    po_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    reviewed_by INT NOT NULL,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- [D10] NOTIFICATIONS & MESSAGES
-- Supports Process 3.7 (Notification Center) and 3.6 (Workspace Feed)
-- =========================================================
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Workspace Feed table to support internal team collaboration streams
CREATE TABLE workspace_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id INT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfq_id) REFERENCES rfqs(rfq_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- [D11] AUDIT LOGS
-- Explicitly added to back Process 2.7 Audit & Governance
-- =========================================================
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(255) NOT NULL, -- e.g., 'RFQ_CREATED', 'BID_ACCEPTED'
    ip_address VARCHAR(45),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- =========================================================
-- [D12] ANALYTICS WAREHOUSE
-- Added to hold historic calculation data snapshots for Process 2.1
-- =========================================================
CREATE TABLE spend_analytics_snapshots (
    snapshot_id INT AUTO_INCREMENT PRIMARY KEY,
    record_year INT NOT NULL,
    record_month INT NOT NULL,
    total_spend DECIMAL(15,2) NOT NULL,
    active_suppliers_count INT DEFAULT 0,
    rfqs_processed_count INT DEFAULT 0,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- =========================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =========================================================
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_supplier_company ON suppliers(company_name);
CREATE INDEX idx_product_supplier ON products(supplier_id);
CREATE INDEX idx_rfq_deadline ON rfqs(deadline);
CREATE INDEX idx_quotation_supplier ON quotations(supplier_id);
CREATE INDEX idx_po_number ON purchase_orders(po_number);
CREATE INDEX idx_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_audit_action ON audit_logs(action);