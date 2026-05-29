CREATE DATABASE IF NOT EXISTS srm_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE srm_portal;

-- =========================================================
-- [D1] USERS & ROLES
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  role ENUM('admin', 'supplier') NOT NULL DEFAULT 'supplier',
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(190) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  status ENUM('pending', 'active', 'blocked') NOT NULL DEFAULT 'active',
  verification_code VARCHAR(6) DEFAULT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- [D2] SUPPLIERS & SUPPLIER PROFILES
-- =========================================================
CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  gst_number VARCHAR(50) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  state VARCHAR(100) DEFAULT NULL,
  country VARCHAR(100) DEFAULT NULL,
  website VARCHAR(255) DEFAULT NULL,
  rating DECIMAL(2,1) DEFAULT 0.0,
  approved_by INT UNSIGNED DEFAULT NULL,
  approved_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- [D9] COMPLIANCE DOCUMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS compliance_documents (
  id VARCHAR(50) PRIMARY KEY,
  supplier_id INT DEFAULT NULL,
  type VARCHAR(100) NOT NULL, -- e.g., 'GST Certificate', 'ISO Certification'
  issuer VARCHAR(255) NOT NULL,
  expiry DATE NOT NULL,
  file_name VARCHAR(255) DEFAULT NULL,
  file_path VARCHAR(500) DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Active',
  remarks TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- [D6] PRODUCTS & INVENTORY
-- =========================================================
CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  category_id INT DEFAULT NULL,
  product_name VARCHAR(150) NOT NULL,
  description TEXT DEFAULT NULL,
  unit_price DECIMAL(10,2) DEFAULT NULL,
  stock_quantity INT DEFAULT 0,
  unit VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- [D3] RFQs & RFQ INVITATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS rfqs (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  deadline VARCHAR(50) NOT NULL,
  bids INT UNSIGNED DEFAULT 0,
  value DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Draft',
  description TEXT DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rfq_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rfq_id VARCHAR(50) NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  specification TEXT DEFAULT NULL,
  quantity INT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- [D4] BIDS & BID EVALUATIONS (COMPATIBILITY + DFD TABLES)
-- =========================================================
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rfq_package) REFERENCES rfqs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supplier_quotes (
  id VARCHAR(50) PRIMARY KEY,
  rfq_id VARCHAR(50) NOT NULL,
  supplier_id INT UNSIGNED NOT NULL,
  supplier_name VARCHAR(120) DEFAULT NULL,
  subtotal DECIMAL(15, 2) NOT NULL,
  tax_total DECIMAL(15, 2) NOT NULL,
  freight DECIMAL(15, 2) NOT NULL,
  grand_total DECIMAL(15, 2) NOT NULL,
  delivery VARCHAR(100) DEFAULT NULL,
  warranty VARCHAR(100) DEFAULT NULL,
  score INT UNSIGNED DEFAULT 85,
  best INT DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supplier_quote_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_quote_id VARCHAR(50) NOT NULL,
  rfq_item_id INT NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  quantity INT NOT NULL,
  tax_percent DECIMAL(5, 2) DEFAULT 0.00,
  line_total DECIMAL(15, 2) NOT NULL,
  remarks TEXT DEFAULT NULL,
  FOREIGN KEY (supplier_quote_id) REFERENCES supplier_quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (rfq_item_id) REFERENCES rfq_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supplier_quote_documents (
  document_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_quote_id VARCHAR(50) NOT NULL,
  supplier_id INT UNSIGNED NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  stored_file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT DEFAULT NULL,
  mime_type VARCHAR(100) DEFAULT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_quote_id) REFERENCES supplier_quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- [D5] PURCHASE ORDERS
-- =========================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  po_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_quote_id VARCHAR(50) DEFAULT NULL,
  po_number VARCHAR(100) UNIQUE NOT NULL,
  issued_by INT UNSIGNED NOT NULL,
  issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_delivery DATE DEFAULT NULL,
  status ENUM('issued', 'shipped', 'delivered', 'cancelled') DEFAULT 'issued',
  FOREIGN KEY (supplier_quote_id) REFERENCES supplier_quotes(id) ON DELETE SET NULL,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- [D7] DELIVERIES & SHIPMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS goods_receipts (
  receipt VARCHAR(50) PRIMARY KEY,
  po VARCHAR(50) NOT NULL,
  item VARCHAR(255) NOT NULL,
  received INT UNSIGNED NOT NULL,
  accepted INT UNSIGNED NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  po_id INT DEFAULT NULL,
  received_by INT UNSIGNED DEFAULT NULL,
  damaged_items INT DEFAULT 0,
  missing_items INT DEFAULT 0,
  remarks TEXT DEFAULT NULL,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE SET NULL,
  FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- [D8] INVOICES & PAYMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY,
  po VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  submitted DATE NOT NULL,
  due DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  po_id INT DEFAULT NULL,
  supplier_id INT DEFAULT NULL,
  invoice_number VARCHAR(100) DEFAULT NULL UNIQUE,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- SUPPLIER PERFORMANCE
-- =========================================================
CREATE TABLE IF NOT EXISTS supplier_reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  po_id INT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  review TEXT DEFAULT NULL,
  reviewed_by INT UNSIGNED NOT NULL,
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- [D10] NOTIFICATIONS & MESSAGES
-- =========================================================
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  rfq_id VARCHAR(50) DEFAULT NULL,
  sender_id INT UNSIGNED NOT NULL,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- [D11] AUDIT LOGS
-- =========================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  action VARCHAR(255) NOT NULL, -- e.g., 'RFQ_CREATED', 'BID_ACCEPTED'
  ip_address VARCHAR(45) DEFAULT NULL,
  details TEXT DEFAULT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- [D12] ANALYTICS WAREHOUSE
-- =========================================================
CREATE TABLE IF NOT EXISTS spend_analytics_snapshots (
  snapshot_id INT AUTO_INCREMENT PRIMARY KEY,
  record_year INT NOT NULL,
  record_month INT NOT NULL,
  total_spend DECIMAL(15,2) NOT NULL,
  active_suppliers_count INT DEFAULT 0,
  rfqs_processed_count INT DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =========================================================
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_supplier_company ON suppliers(company_name);
CREATE INDEX idx_product_supplier ON products(supplier_id);
CREATE INDEX idx_rfq_deadline ON rfqs(deadline);
CREATE INDEX idx_quote_supplier ON supplier_quotes(supplier_id);
CREATE INDEX idx_po_number ON purchase_orders(po_number);
CREATE INDEX idx_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- =========================================================
-- SEED INITIAL DATA
-- =========================================================

-- Seed Initial Users
INSERT INTO users (id, full_name, email, role, password_hash, company_name)
VALUES
  (1, 'Admin User', 'admin@srm.local', 'admin', '$2y$10$BwdvZC2acsiRTVNHASMmWu6tpu9QVCX.NWuM9UrIzWfK6vMIissQG', NULL),
  (2, 'Supplier User', 'supplier@srm.local', 'supplier', '$2y$10$BwdvZC2acsiRTVNHASMmWu6tpu9QVCX.NWuM9UrIzWfK6vMIissQG', 'Apex Industrial Components')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Seed Initial Suppliers
INSERT INTO suppliers (supplier_id, user_id, company_name)
VALUES
  (1, 2, 'Apex Industrial Components')
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

-- Seed Initial RFQs
INSERT INTO rfqs (id, title, category, deadline, bids, value, status)
VALUES
  ('RFQ-24061', 'Industrial Ball Bearings Sourcing', 'Mechanical', '2026-06-30', 3, 120000.00, 'Under Evaluation'),
  ('RFQ-24062', 'Warehouse Rack Installation', 'Facilities & Maintenance', '2026-07-15', 2, 45000.00, 'Open'),
  ('RFQ-24063', 'High-grade Silicon Wafers', 'Chemical & Raw Materials', '2026-08-01', 0, 320000.00, 'Draft')
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- Seed Initial RFQ Items
INSERT INTO rfq_items (id, rfq_id, item_name, specification, quantity, unit)
VALUES
  (1, 'RFQ-24061', 'Steel Bearings SB-100', 'Grade A Double Sealed, Heavy Duty', 1000, 'pcs'),
  (2, 'RFQ-24061', 'Brass Bushings BB-50', 'Heavy duty self-lubricating sleeve', 500, 'pcs'),
  (3, 'RFQ-24062', 'Heavy Duty Steel Racks', '4-Tier Industrial Shelving units', 20, 'units'),
  (4, 'RFQ-24063', 'Silicon Wafers 300mm', 'Ultra-pure Prime grade 100-type', 150, 'units')
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- Seed Initial Bids
INSERT INTO bids (id, rfq_package, price, delivery, warranty, score, best, user_id, supplier_name)
VALUES
  ('BID-1', 'RFQ-24061', 115000.00, '10 Days', '3 Years', 92, 1, 2, 'Apex Industrial Components'),
  ('BID-2', 'RFQ-24061', 125000.00, '15 Days', '2 Years', 88, 0, 2, 'Apex Industrial Components'),
  ('BID-3', 'RFQ-24061', 110000.00, '20 Days', '1 Year', 81, 0, 2, 'Apex Industrial Components')
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- Seed Initial Supplier Quotes
INSERT INTO supplier_quotes (id, rfq_id, supplier_id, supplier_name, subtotal, tax_total, freight, grand_total, delivery, warranty, score, best)
VALUES
  ('BID-1', 'RFQ-24061', 2, 'Apex Industrial Components', 97000.00, 17460.00, 540.00, 115000.00, '10 Days', '3 Years', 92, 1),
  ('BID-2', 'RFQ-24061', 2, 'Apex Industrial Components', 105000.00, 18900.00, 1100.00, 125000.00, '15 Days', '2 Years', 88, 0),
  ('BID-3', 'RFQ-24061', 2, 'Apex Industrial Components', 92500.00, 16650.00, 850.00, 110000.00, '20 Days', '1 Year', 81, 0)
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- Seed Initial Supplier Quote Items
INSERT INTO supplier_quote_items (id, supplier_quote_id, rfq_item_id, unit_price, quantity, tax_percent, line_total, remarks)
VALUES
  (1, 'BID-1', 1, 75.00, 1000, 18.00, 88500.00, 'Standard grade'),
  (2, 'BID-1', 2, 44.00, 500, 18.00, 25960.00, 'Premium bushing'),
  (3, 'BID-2', 1, 80.00, 1000, 18.00, 94400.00, 'Reinforced seal'),
  (4, 'BID-2', 2, 50.00, 500, 18.00, 29500.00, 'Custom finish'),
  (5, 'BID-3', 1, 70.00, 1000, 18.00, 82600.00, 'Budget bearings'),
  (6, 'BID-3', 2, 45.00, 500, 18.00, 26550.00, 'Standard bushing')
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
INSERT INTO compliance_documents (id, type, issuer, expiry, status, supplier_id)
VALUES
  ('CERT-390481', 'ISO 9001', 'Global Certification Corp', '2027-04-15', 'Active', 1),
  ('CERT-8401185', 'Tax Certification', 'Internal Revenue Service', '2026-12-31', 'Active', 1)
ON DUPLICATE KEY UPDATE id = VALUES(id);
