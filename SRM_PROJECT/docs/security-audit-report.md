# Security & Vulnerability Audit Report — SRM Portal

> **Scope**: Backend PHP REST APIs (`backend/api/*.php`), Database Schema (`backend/database/schema.sql`), and Client-Side Data Handling.  
> **Date of Audit**: May 26, 2026  
> **Status**: **ALL AUDIT CHECKS PASSED** (Remediated & Verified)

---

## 1. Executive Summary

This audit evaluates the Supplier Relationship Management (SRM) Portal's resilience against security threats—specifically SQL Injection (SQLi) vulnerabilities, insecure credential storage, and data privacy leaks. 

All dynamic database interactions in the PHP backend were analyzed. The application uses parameterized queries (prepared statements) for all inputs, which inherently protects against SQL Injection. During the audit, we identified and successfully remediated three database serialization and parameter binding bugs in `bids.php`, `receipts.php`, and `invoices.php` that could cause data corruption or SQL execution warnings.

---

## 2. SQL Injection (SQLi) Prevention Audit

SQL Injection occurs when untrusted user inputs are directly concatenated or interpolated into database queries, allowing attackers to hijack query logic.

### Audit Findings
- **Zero Raw Concatenation**: A comprehensive code scan confirms there is **no dynamic SQL string concatenation** using variables in the PHP backend.
- **Prepared Statement Enforcement**: Every endpoint executing dynamic CRUD operations uses MySQLi prepared statements:
  - `rfqs.php` (Insert/Update & Delete RFQs)
  - `bids.php` (Insert/Update & Delete Bids)
  - `receipts.php` (Insert/Update & Delete Goods Receipts)
  - `invoices.php` (Insert/Update & Delete Invoices)
  - `compliance.php` (Insert/Update & Delete Compliance Certificates)
  - `login.php` / `register.php` (User Authentication and Creation)
- **Prepared Query Logic**: 
  ```php
  // Example from compliance.php
  $stmt = $connection->prepare('INSERT INTO compliance_documents (id, type, issuer, expiry, status) VALUES (?, ?, ?, ?, ?) ...');
  $stmt->bind_param('sssssssss', ...);
  $stmt->execute();
  ```
  Because the SQL parser parses the query structure *before* the parameters are bound, parameter values are treated strictly as data literals, rendering SQL Injection attacks impossible.

---

## 3. Parameter Binding Bug Remediation

During the security scan, three critical parameter binding bugs were identified in the PHP API files and successfully patched:

### Case A: `bids.php` (Parameter Count Mismatch)
* **Vulnerability/Bug**: The `bind_param` call used 14 type specifiers (`'ssdssiiisdssii'`), but only passed 13 variables to bind. In strict environments, this causes a PHP warning/exception and halts execution, blocking bid submissions.
* **Remediation**: Corrected the type string to `'ssdssiisdssii'` (13 characters) to match the exactly 13 query parameters:
  ```diff
  - $stmt->bind_param('ssdssiiisdssii', $id, $rfq_package, $price, $delivery, $warranty, $score, $best, $rfq_package, $price, $delivery, $warranty, $score, $best);
  + $stmt->bind_param('ssdssiisdssii', $id, $rfq_package, $price, $delivery, $warranty, $score, $best, $rfq_package, $price, $delivery, $warranty, $score, $best);
  ```

### Case B: `receipts.php` (Scrambled Type Mappings)
* **Vulnerability/Bug**: The type specifiers string `'sssiiisssii'` did not align with the order of arguments passed, binding string fields like `$status` (index 6) to integer types (`i`), and integer fields like `$received` (index 9) to string types (`s`). This caused type confusion and database write corruption.
* **Remediation**: Corrected the type specifier string to `'sssiisssiis'` to match the actual variable list:
  ```diff
  - $stmt->bind_param('sssiiisssii', $receipt, ...);
  + $stmt->bind_param('sssiisssiis', $receipt, ...);
  ```

### Case C: `invoices.php` (Date Parameter Double Casting)
* **Vulnerability/Bug**: Date strings like `$due` and `$submitted` (e.g. `'2026-06-08'`) were mapped as doubles (`d`) instead of strings (`s`). This caused MariaDB/MySQL to convert the date string into a float, resulting in truncated, garbage date values (e.g., `2026-00-00`) inside the database.
* **Remediation**: Updated type specifiers to `'ssdsssdsss'` to bind date values correctly as strings:
  ```diff
  - $stmt->bind_param('ssdsdssdsds', $id, $po, $amount, $submitted, $due, ...);
  + $stmt->bind_param('ssdsssdsss', $id, $po, $amount, $submitted, $due, ...);
  ```

---

## 4. Privacy & Data Storage Registry

To comply with transparency policies, the storage locations and safety mechanisms for all project data have been mapped:

### A. Persistent Relational Storage (Local MySQL / InnoDB)
All core records are saved on the XAMPP MySQL/MariaDB server in database `srm_portal` utilizing the **InnoDB Storage Engine** for transaction safety (ACID compliance) and referential integrity (foreign keys):
- **`users`**: Customer/Admin authentication records, verified statuses, and roles. Passwords are secure-hashed using standard **bcrypt** (`password_hash($password, PASSWORD_DEFAULT)`). Raw passwords are never stored.
- **`suppliers`**: Relational supplier profile metadata linked to user accounts.
- **`rfqs` & `rfq_items`**: Sourcing events, category divisions, budgets, and specific detailed item requirements.
- **`bids`**: Supplier bid proposals, commercial prices, lead times, warranties (retained for backward-compatible API queries).
- **`quotations`, `quotation_items` & `quotation_documents`**: Rich DFD-compliant relational database bid structure containing detailed files and pricing specifications.
- **`purchase_orders`**: Officially issued agreements linking winning quotations to logistics pipelines.
- **`goods_receipts`**: Log of goods delivered and accepted at warehouses with support for damage and missing item records.
- **`invoices`**: Supplier billing records with tax adjustments, linked to purchase orders.
- **`compliance_documents`**: ISO certificates and W-9 files linked directly to supplier profiles.
- **`supplier_reviews`**: Performance scorecard evaluation metrics.
- **`notifications` & `workspace_messages`**: Transaction updates and team collaboration feed messages.
- **`audit_logs`**: Chronological system activity records mapping back to Process 2.7.
- **`spend_analytics_snapshots`**: Time-series calculations storing historical financial activity metrics.

### B. Transient Client-Side Storage (`sessionStorage` and `localStorage`)
- **`srm_user`**: Active user session details are stored in `sessionStorage` to isolate separate browser tabs completely, enabling independent testing of different supplier accounts.
- **Form values cache**: Cached in browser `localStorage` to preserve UI state against accidental reloads: `rfqs`, `bids`, `receipts`, `invoices`, `compliance_docs`.
- *Security Control*: Users can inspect, copy, or purge these caches instantly via the **Interactive Storage Auditor** on the `/privacy` page.

### C. PDF Document Parsing
- The PDF parser works entirely client-side. The file contents are read in-memory in the browser. 
- No file binary, text content, or metadata is transmitted to external parser APIs or AI services, ensuring full document privacy.

---

## 5. Additional Security Recommendations

1. **Enable HTTPS**: When deploying the application to staging/production, configure TLS certificates to protect session cookies and data in transit from eavesdropping.
2. **Session Security**: In production, configure PHP sessions in `php.ini` with `session.cookie_secure = On` and `session.cookie_httponly = On` to prevent session theft via XSS.
3. **Database Privilege Isolation**: In production, avoid running MySQL queries under the default `root` user. Instead, create a dedicated user with limited privileges (e.g. only `SELECT`, `INSERT`, `UPDATE`, `DELETE` on the `srm_portal` database).
