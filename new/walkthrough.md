# SRM Bidding System — Walkthrough & Setup Guide

The **3.3 BIDDING SYSTEM (Bid Management)** module has been fully implemented as a complete MVC PHP application. It is designed to run locally with secure, role-based controls between the **Procurement Admin** and **Suppliers**.

---

## 🚀 Key Features Implemented

1. **Role-Based Authentication**: Secure login for Admin (`admin@srm.com`) and multiple Suppliers (`supplier[1-3]@test.com`) with session hijacking protection and timeout tracking.
2. **RFQ Management (Admin)**: Full creation of Requests for Quotation (RFQs) with unit price estimation, delivery timelines, and multi-supplier invitation assignments.
3. **Supplier Quotation Submission**: Real-time total cost estimation (Quantity × Unit Price) and support for secure PDF document upload.
4. **Interactive Negotiation Room**:
   - Live conversation feed between Admin and Supplier.
   - Admin counter-offers with price changes and notes.
   - Supplier replies (Accept counter-offer, Reject & withdraw, or propose revised price).
   - Real-time text messaging between both roles.
   - Dynamic message and status updates powered by **3-second AJAX polling**.
5. **Contract Finalization**: Accept and finalize bid agreements, locking in the final price, closing the RFQ, and generating immutable audit logs.
6. **Audit Trail & System Security**: High-security middlewares for session validation, CSRF verification, and XSS sanitization. Log table tracks all user operations with IP and User Agent logging.
7. **Premium Aesthetics**: Styled with Bootstrap 5 and customized dark sidebars, status-colored badges, chat message bubbles, clear visual layout grids, and notification status bars.

## 🖥️ UI Visualization

![Admin Negotiation Room Interface Mockup](C:/Users/prana/.gemini/antigravity/brain/f45782e7-e8ce-4ecb-a28a-513322e95fa2/admin_negotiation_room_1780035942102.png)

---


## 📂 Project Architecture & Code Links

All codebase files are located in the project directory at [srm-bidding-system](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/). Below is an overview of the key components:

- **Router**:
  - [index.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/index.php) — Router front controller.
- **Database & Configuration**:
  - [database.sql](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/database.sql) — Full schema & seed data.
  - [config/config.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/config/config.php) — Central constants & settings.
  - [config/database.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/config/database.php) — PDO singleton instance wrapper.
- **Security Middlewares & Helpers**:
  - [middleware/AuthMiddleware.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/middleware/AuthMiddleware.php) — Auth state & timeout check.
  - [middleware/RoleMiddleware.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/middleware/RoleMiddleware.php) — Role constraints.
  - [middleware/CSRFMiddleware.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/middleware/CSRFMiddleware.php) — CSRF token generator & verify.
  - [helpers/Security.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/helpers/Security.php) — Sanitization and password utilities.
  - [helpers/Validator.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/helpers/Validator.php) — Input rules validation.
  - [helpers/FileUpload.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/helpers/FileUpload.php) — Secure PDF uploader.
- **Models**:
  - [models/RFQ.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/models/RFQ.php) — RFQ data access.
  - [models/Bid.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/models/Bid.php) — Quotation lifecycle.
  - [models/Negotiation.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/models/Negotiation.php) — Price counters logging.
  - [models/BidMessage.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/models/BidMessage.php) — Chat thread logs.
- **Controllers & APIs**:
  - [controllers/BidController.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/controllers/BidController.php) — Bidding controller operations.
  - [apis/bid.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/apis/bid.php) — Real-time chat & status update API.
- **Frontend Views**:
  - **Layouts**: [header.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/views/layouts/header.php) | [footer.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/views/layouts/footer.php) | [admin_sidebar.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/views/layouts/admin_sidebar.php) | [supplier_sidebar.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/views/layouts/supplier_sidebar.php)
  - **Admin**: [negotiation_panel.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/views/admin/negotiation_panel.php) | [finalized_bids.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/views/admin/finalized_bids.php)
  - **Supplier**: [dashboard.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/views/supplier/dashboard.php) | [rfq_list.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/views/supplier/rfq_list.php) | [submit_bid.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/views/supplier/submit_bid.php) | [bid_status.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/views/supplier/bid_status.php) | [bid_list.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/views/supplier/bid_list.php)

---

## 🛠️ Step-by-Step Local Setup

To run and verify the bidding portal locally, follow these steps:

### 1. Database Setup
1. Open your MySQL client (e.g., MySQL Command Line Client, phpMyAdmin, or DBeaver).
2. Create the database or run the SQL file directly. The SQL script auto-creates the `srm_bidding` database:
   ```sql
   SOURCE C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/database.sql;
   ```
   This will set up all tables and pre-populate them with demo users, active suppliers, mock RFQs, and ongoing negotiation logs.

### 2. Configure Credentials
Open [config/config.php](file:///C:/Users/prana/.gemini/antigravity/scratch/srm-bidding-system/config/config.php) and adjust the database host, user, and password constants if they differ from your local environment defaults:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'your_password'); // Enter your local MySQL password
define('DB_NAME', 'srm_bidding');
```

### 3. Run Built-In PHP Web Server
Open your terminal (PowerShell or Command Prompt), navigate to the project directory, and launch the built-in development server:
```powershell
cd C:\Users\prana\.gemini\antigravity\scratch\srm-bidding-system
php -S localhost:8080
```

### 4. Access the Application
Open your web browser and navigate to:
```
http://localhost:8080
```

---

## 🔑 Login Credentials

You can use the following seeded accounts to verify the interactive flows:

| Role | Username / Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin (Procurement)** | `admin@srm.com` | `Admin@123` | Can create RFQs, view supplier bids side-by-side, send counter-offers, accept/reject bids, and finalize deals. |
| **Supplier 1** | `supplier1@test.com` | `Supplier@123` | Kumar Enterprises Pvt. Ltd. (Raw Materials) |
| **Supplier 2** | `supplier2@test.com` | `Supplier@123` | Sharma Tech Solutions (IT Equipment) |
| **Supplier 3** | `supplier3@test.com` | `Supplier@123` | Patel Industrial Supplies (Machinery) |

> [!NOTE]
> Since this is a pair-programming project directory, it is highly recommended to set `C:\Users\prana\.gemini\antigravity\scratch\srm-bidding-system` as your active workspace in your IDE for easier access to all files.
