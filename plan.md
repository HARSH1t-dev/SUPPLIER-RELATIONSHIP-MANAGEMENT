# SRM Portal Plan

## 1. Project Overview

This project is a **Supplier Relationship Management (SRM) portal** designed to digitize the procurement workflow between an organization and its suppliers.

The system follows a **2-role model**:

- **Admin**: manages suppliers, creates RFQs, compares bids, generates purchase orders, verifies delivery, and reviews suppliers.
- **User**: acts as the supplier/vendor, registers on the platform, uploads products, receives RFQs, submits quotations, and tracks orders.

The project is built to simulate a real procurement lifecycle in a simple but structured web application.

---

## 2. Core Workflow

The main business flow of the system is:

1. Supplier registers on the portal.
2. Admin reviews and approves the supplier account.
3. Supplier uploads product/service details.
4. Admin creates an RFQ (Request for Quotation).
5. Eligible suppliers receive the RFQ.
6. Suppliers submit bids/quotations.
7. Admin compares quotations and selects the best supplier.
8. Purchase order is generated.
9. Supplier delivers the goods/services.
10. Admin verifies delivery and closes the order.
11. Supplier is rated/reviewed for future procurement.

---

## 3. Technology Stack

### Backend
- **PHP**: handles authentication, form processing, business logic, role control, and database operations.

### Database
- **MySQL**: stores users, products, RFQs, bids, purchase orders, reviews, and logs.

### Frontend
- **HTML**: page structure.
- **CSS**: custom styling where needed.
- **JavaScript**: interactivity, validation, filtering, modal handling, and dynamic actions.
- **Tailwind CSS**: responsive UI, clean layout, cards, tables, buttons, dashboards, and form styling.

---

## 4. Major Modules

### 4.1 Authentication
- supplier registration
- login/logout
- session handling
- role-based redirects
- password hashing
- access control

### 4.2 Supplier Management
- supplier approval/rejection
- supplier profile view
- status tracking
- search and filter

### 4.3 Product Portfolio
- add/edit/delete products
- upload product image/specification
- assign category
- manage stock or availability status

### 4.4 RFQ Management
- create RFQ
- set requirements, deadline, and category
- publish RFQ to suitable suppliers
- track RFQ status

### 4.5 Bidding System
- supplier bid submission
- deadline validation
- duplicate bid prevention
- quotation storage
- status updates

### 4.6 Bid Comparison
- compare supplier quotations
- sort by price, delivery time, and supplier rating
- highlight best option
- select winner

### 4.7 Purchase Order Management
- create PO from accepted bid
- update PO status
- print PO copy
- track acceptance and delivery

### 4.8 Goods Receiving and Review
- verify delivered quantity
- mark damaged/missing items
- close completed order
- review supplier performance

---

## 5. Suggested Database Tables

- `users`
- `categories`
- `products`
- `rfqs`
- `rfq_invites`
- `bids`
- `purchase_orders`
- `goods_receipts`
- `supplier_reviews`
- `audit_logs`

These tables should be normalized and linked using foreign keys where necessary.

---

## 6. Recommended Folder Structure

```text
srm-project/
├── admin/
├── user/
├── auth/
├── includes/
├── assets/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── uploads/
├── database/
├── pages/
└── index.php
```

### Purpose of Important Folders
- `admin/`: admin dashboard and management pages
- `user/`: supplier dashboard and supplier pages
- `auth/`: login, registration, logout
- `includes/`: database connection, helpers, shared layout parts
- `assets/`: styling, scripts, images, uploads
- `database/`: SQL scripts and seed data

---

## 7. System Design Principles

### Keep the system simple
Use a monolithic PHP application structure with clear separation of pages and logic.

### Use role-based access control
Only admin can manage RFQs, bids, purchase orders, and approvals. Users can only manage their own supplier-side data.

### Keep modules independent
Each module should work cleanly and be testable on its own:
- authentication
- supplier management
- product management
- RFQ handling
- bidding
- order tracking
- review system

### Use reusable components
Build reusable layout elements such as:
- sidebar
- navbar
- form components
- table components
- status badges
- alert messages

---

## 8. Step-by-Step Building Roadmap

### Phase 1: Project Setup
- create the project folder
- set up local Apache/MySQL environment
- create the MySQL database
- prepare basic folder structure
- configure database connection in PHP

### Phase 2: Authentication
- build registration page
- build login page
- hash passwords securely
- create session handling
- redirect users based on role
- restrict admin and user routes

### Phase 3: Admin Dashboard Foundation
- create admin layout
- add sidebar and top navbar
- build dashboard cards
- show summary counts and recent activity

### Phase 4: Supplier Portal Foundation
- create supplier dashboard layout
- add profile page
- add product management screens
- display RFQ notifications and order status

### Phase 5: Supplier Approval and Management
- build supplier list page for admin
- create approval/rejection actions
- add search and filter options
- store supplier status in database

### Phase 6: Product Portfolio Module
- allow users to add products
- validate uploaded data
- support category selection
- display product list in dashboard

### Phase 7: RFQ Module
- create RFQ form for admin
- assign category and deadline
- send RFQ to selected suppliers
- create RFQ list and detail page

### Phase 8: Bidding Module
- let suppliers view open RFQs
- create bid submission form
- prevent duplicate submissions
- block bids after deadline
- store quotation values in database

### Phase 9: Bid Comparison
- create quotation comparison table
- sort bids by amount and delivery time
- show supplier details and ratings
- allow admin to select winning bid

### Phase 10: Purchase Orders
- generate purchase order from accepted bid
- show order details
- update PO status
- print PO if needed

### Phase 11: Goods Receiving and Review
- record received quantity
- log damaged or missing items
- close completed order
- rate supplier performance

### Phase 12: Analytics and Polish
- add charts for RFQs, bids, and orders
- improve page responsiveness
- refine UI with Tailwind
- add alerts, badges, and modals

### Phase 13: Testing and Finalization
- test all workflows end-to-end
- check access control and edge cases
- fix UI and logic issues
- prepare documentation, screenshots, and presentation

---

## 9. Development Order Recommendation

The safest order to build the project is:

1. database design
2. authentication
3. admin and supplier layouts
4. supplier approval
5. product module
6. RFQ module
7. bidding module
8. bid comparison
9. purchase order generation
10. goods receiving
11. supplier review
12. analytics and final UI polish
13. testing and deployment

---

## 10. Key Logic Rules

- Only approved suppliers can submit bids.
- One supplier can submit only one bid per RFQ.
- Bids are locked after the deadline.
- Purchase orders are generated only from accepted bids.
- Goods receipt can close an order only after verification.
- Supplier review happens only after the order is completed.

---

## 11. Output Deliverables

By the end of the project, the system should include:

- login and registration system
- admin dashboard
- supplier dashboard
- product portfolio management
- RFQ creation and publishing
- supplier bidding system
- quotation comparison page
- purchase order module
- goods receiving module
- supplier review system
- analytics dashboard
- database schema and SQL scripts
- full source code and final documentation

---

## 12. Setup Instructions

### 12.1 Required Software

Install the following tools before starting development:

| Software | Purpose |
|---|---|
| XAMPP or Laragon | Apache + MySQL local server |
| VS Code | Code editor |
| Git | Version control |
| MySQL Workbench (Optional) | Database visualization |
| Chrome Browser | Testing and debugging |

---

## 12.2 Install XAMPP

### Download
Official Website:
- https://www.apachefriends.org/

### During Installation
Enable:
- Apache
- MySQL
- PHP
- phpMyAdmin

After installation:

1. Open XAMPP Control Panel
2. Start:
   - Apache
   - MySQL

Verify:

```text
http://localhost
```

---

## 12.3 Create Project Folder

Navigate to:

```text
xampp/htdocs/
```

Create:

```text
srm-project/
```

Final path:

```text
xampp/htdocs/srm-project/
```

---

## 12.4 Open Project in VS Code

### Method
1. Open VS Code
2. Click:

```text
File → Open Folder
```

3. Select:

```text
srm-project
```

---

## 12.5 Initialize Git Repository

Open terminal inside VS Code:

```bash
git init
```

Create `.gitignore`:

```text
/vendor
/node_modules
/uploads
.env
```

---

## 12.6 Recommended VS Code Extensions

Install:

| Extension | Purpose |
|---|---|
| PHP Intelephense | PHP autocomplete |
| Tailwind CSS IntelliSense | Tailwind support |
| Prettier | Code formatting |
| Live Server | Frontend preview |
| GitLens | Git support |
| MySQL | Database management |

---

## 12.7 Create Database

Open:

```text
http://localhost/phpmyadmin
```

Create database:

```sql
CREATE DATABASE srm_system;
```

---

## 12.8 Configure Database Connection

Create:

```text
includes/db.php
```

Example:

```php
<?php
$host = "localhost";
$dbname = "srm_system";
$username = "root";
$password = "";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname",
        $username,
        $password
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch(PDOException $e) {
    die("Connection Failed: " . $e->getMessage());
}
?>
```

---

## 12.9 Verify PHP Setup

Create:

```text
test.php
```

Add:

```php
<?php
phpinfo();
?>
```

Open:

```text
http://localhost/srm-project/test.php
```

If PHP info page opens successfully, setup is working.

---

## 12.10 Tailwind CSS Setup (CDN Method)

Since the project stack is strictly:

- MySQL
- PHP
- HTML/CSS
- JavaScript
- Tailwind CSS

there is no need to install Node.js, npm, or build tools.

Use Tailwind through the CDN version.

---

## 12.11 Include Tailwind in Pages

Inside HTML/PHP pages:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

Example:

```php
<!DOCTYPE html>
<html>
<head>
    <title>SRM Portal</title>

    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">

<div class="p-10 text-3xl font-bold text-blue-600">
    SRM Portal
</div>

</body>
</html>
```

This setup is sufficient for a college-level SRM system and keeps the stack lightweight and simple.

---

Inside HTML/PHP pages:

```html
<link rel="stylesheet" href="assets/css/style.css">
```

---

## 12.12 Create Base Folder Structure

```text
srm-project/
├── admin/
├── user/
├── auth/
├── includes/
├── database/
├── assets/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── uploads/
├── pages/
└── index.php
```

---

## 12.13 Create Base Layout Files

Recommended shared files:

```text
includes/
├── db.php
├── auth.php
├── header.php
├── footer.php
├── navbar.php
└── sidebar.php
```

---

## 12.14 Create Initial Test Page

Example:

```php
<!DOCTYPE html>
<html>
<head>
    <title>SRM Portal</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="bg-gray-100">

<div class="p-10 text-3xl font-bold">
    SRM Portal Setup Successful
</div>

</body>
</html>
```

Open:

```text
http://localhost/srm-project
```

---

## 12.15 Recommended Development Workflow

### Daily Workflow

1. Pull latest changes
2. Create feature branch
3. Develop module
4. Test locally
5. Commit changes
6. Push to GitHub
7. Merge after review

---

## 12.16 Recommended Git Branches

```text
main
develop
feature/auth
feature/rfq
feature/bidding
feature/orders
feature/ui
```

---

## 12.17 Recommended Coding Practices

### Backend
- use PDO prepared statements
- avoid duplicate logic
- separate business logic from UI

### Frontend
- reuse Tailwind components
- keep forms responsive
- maintain consistent spacing/colors

### Database
- use foreign keys
- use indexes for large tables
- use proper naming conventions

---

## 12.18 Final Setup Checklist

Before starting development verify:

- Apache running
- MySQL running
- PHP working
- database created
- Tailwind compiling
- Git initialized
- VS Code configured
- folder structure ready
- DB connection successful

---

## 13. Final Goal

The final goal is to build a clean, role-based, procurement-style SRM portal that demonstrates:

- real business workflow
- database design
- backend logic
- responsive frontend development
- modular software engineering
- practical deployment readiness

This makes the project suitable for academic submission, portfolio display, and real-world system design practice.

