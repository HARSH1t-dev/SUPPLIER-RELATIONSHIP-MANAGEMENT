-- ============================================================
-- SRM Purchase Order Backend — Database Schema
-- Tata Motors Internship Project
-- ============================================================

CREATE DATABASE IF NOT EXISTS srm_db;
USE srm_db;

-- Users (Admin / Supplier accounts)
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('admin', 'supplier', 'viewer') DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    phone         VARCHAR(20),
    address       TEXT,
    category      VARCHAR(100),
    status        ENUM('active', 'inactive', 'blacklisted') DEFAULT 'active',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RFQ (Request for Quotation)
CREATE TABLE IF NOT EXISTS rfq (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    rfq_number VARCHAR(50) UNIQUE,
    title      VARCHAR(255),
    description TEXT,
    deadline   DATE,
    status     ENUM('open', 'closed', 'awarded') DEFAULT 'open',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- RFQ Line Items
CREATE TABLE IF NOT EXISTS rfq_items (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id    INT,
    item_name VARCHAR(255),
    quantity  INT,
    unit      VARCHAR(50),
    FOREIGN KEY (rfq_id) REFERENCES rfq(id)
);

-- Supplier Proposals / Bids
CREATE TABLE IF NOT EXISTS proposals (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id        INT,
    supplier_id   INT,
    total_quoted  DECIMAL(12,2),
    delivery_days INT,
    validity_days INT,
    notes         TEXT,
    status        ENUM('submitted','under_review','awarded','rejected') DEFAULT 'submitted',
    submitted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfq_id)      REFERENCES rfq(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Proposal Line Items
CREATE TABLE IF NOT EXISTS proposal_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT,
    rfq_item_id INT,
    item_name   VARCHAR(255),
    quantity    INT,
    unit_price  DECIMAL(10,2),
    total_price DECIMAL(10,2),
    FOREIGN KEY (proposal_id) REFERENCES proposals(id),
    FOREIGN KEY (rfq_item_id) REFERENCES rfq_items(id)
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    po_number            VARCHAR(50) UNIQUE,
    rfq_id               INT,
    proposal_id          INT,
    supplier_id          INT,
    awarded_by           INT,
    order_date           DATE,
    delivery_date        DATE,
    total_amount         DECIMAL(12,2),
    status               ENUM('issued','pending','fulfilled','cancelled') DEFAULT 'issued',
    legal_terms          TEXT,
    final_terms_agreed   TINYINT(1) DEFAULT 1,
    issued_to_supplier   TINYINT(1) DEFAULT 0,
    awarded_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfq_id)      REFERENCES rfq(id),
    FOREIGN KEY (proposal_id) REFERENCES proposals(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (awarded_by)  REFERENCES users(id)
);

-- PO Line Items
CREATE TABLE IF NOT EXISTS po_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    po_id       INT,
    item_name   VARCHAR(255),
    quantity    INT,
    unit_price  DECIMAL(10,2),
    total_price DECIMAL(10,2),
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
);
