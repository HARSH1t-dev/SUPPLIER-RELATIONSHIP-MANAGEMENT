CREATE DATABASE IF NOT EXISTS srm_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE srm_portal;
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  role ENUM('admin', 'supplier') NOT NULL DEFAULT 'supplier',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (full_name, email, role, password_hash)
VALUES
  ('Admin User', 'admin@srm.local', 'admin', '$2y$10$BwdvZC2acsiRTVNHASMmWu6tpu9QVCX.NWuM9UrIzWfK6vMIissQG'),
  ('Supplier User', 'supplier@srm.local', 'supplier', '$2y$10$BwdvZC2acsiRTVNHASMmWu6tpu9QVCX.NWuM9UrIzWfK6vMIissQG')
ON DUPLICATE KEY UPDATE email = VALUES(email);
