CREATE DATABASE IF NOT EXISTS srm_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE srm_portal;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  role ENUM('admin', 'supplier') NOT NULL DEFAULT 'supplier',
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(190) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RFQs Table
CREATE TABLE IF NOT EXISTS rfqs (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  deadline VARCHAR(50) NOT NULL,
  bids INT UNSIGNED DEFAULT 0,
  value DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bids Table
CREATE TABLE IF NOT EXISTS bids (
  id VARCHAR(50) PRIMARY KEY,
  rfq_package VARCHAR(50) NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  delivery VARCHAR(100) NOT NULL,
  warranty VARCHAR(100) NOT NULL,
  score INT UNSIGNED DEFAULT 85,
  best INT DEFAULT 0, -- 0 for false, 1 for true
  user_id INT UNSIGNED DEFAULT NULL,
  supplier_name VARCHAR(120) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goods Receipts Table
CREATE TABLE IF NOT EXISTS goods_receipts (
  receipt VARCHAR(50) PRIMARY KEY,
  po VARCHAR(50) NOT NULL,
  item VARCHAR(255) NOT NULL,
  received INT UNSIGNED NOT NULL,
  accepted INT UNSIGNED NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY,
  po VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  submitted DATE NOT NULL,
  due DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Documents Table
CREATE TABLE IF NOT EXISTS compliance_documents (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  expiry DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Users
INSERT INTO users (full_name, email, role, password_hash)
VALUES
  ('Admin User', 'admin@srm.local', 'admin', '$2y$10$BwdvZC2acsiRTVNHASMmWu6tpu9QVCX.NWuM9UrIzWfK6vMIissQG'),
  ('Supplier User', 'supplier@srm.local', 'supplier', '$2y$10$BwdvZC2acsiRTVNHASMmWu6tpu9QVCX.NWuM9UrIzWfK6vMIissQG')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Seed Initial RFQs
INSERT INTO rfqs (id, title, category, deadline, bids, value, status)
VALUES
  ('RFQ-24061', 'Industrial Ball Bearings Sourcing', 'Manufacturing', '2026-06-30', 3, 120000.00, 'Under Evaluation'),
  ('RFQ-24062', 'Warehouse Rack Installation', 'Facilities', '2026-07-15', 2, 45000.00, 'Open'),
  ('RFQ-24063', 'High-grade Silicon Wafers', 'Manufacturing', '2026-08-01', 0, 320000.00, 'Draft')
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- Seed Initial Bids
INSERT INTO bids (id, rfq_package, price, delivery, warranty, score, best)
VALUES
  ('BID-1', 'RFQ-24061', 115000.00, '10 Days', '3 Years', 92, 1),
  ('BID-2', 'RFQ-24061', 125000.00, '15 Days', '2 Years', 88, 0),
  ('BID-3', 'RFQ-24061', 110000.00, '20 Days', '1 Year', 81, 0)
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- Seed Initial Goods Receipts
INSERT INTO goods_receipts (receipt, po, item, received, accepted, status)
VALUES
  ('REC-9081', 'PO-88021', 'Industrial Bearings', 2500, 2490, 'Approved'),
  ('REC-9082', 'PO-88022', 'Hydraulic Valves', 800, 800, 'Approved'),
  ('REC-9083', 'PO-88023', 'Copper Cables', 1200, 1180, 'Approved')
ON DUPLICATE KEY UPDATE receipt = VALUES(receipt);

-- Seed Initial Invoices
INSERT INTO invoices (id, po, amount, submitted, due, status)
VALUES
  ('INV-5401', 'PO-88021', 218000.00, '2026-05-20', '2026-06-04', 'Submitted'),
  ('INV-5402', 'PO-88022', 650000.00, '2026-05-22', '2026-06-06', 'Approved'),
  ('INV-5403', 'PO-88023', 92000.00, '2026-05-24', '2026-06-08', 'Pending'),
  ('INV-5398', 'PO-87991', 184000.00, '2026-04-22', '2026-05-07', 'Paid')
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- Seed Initial Compliance Documents
INSERT INTO compliance_documents (id, type, issuer, expiry, status)
VALUES
  ('CERT-390481', 'ISO 9001', 'Global Certification Corp', '2027-04-15', 'Active'),
  ('CERT-8401185', 'Tax Certification', 'Internal Revenue Service', '2026-12-31', 'Active')
ON DUPLICATE KEY UPDATE id = VALUES(id);
