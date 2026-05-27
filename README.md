# 🌐 Supplier Relationship Management (SRM) Portal

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net/)

Welcome to the **Supplier Relationship Management (SRM) Portal**, a state-of-the-art enterprise procurement and supplier collaboration platform. Built with a focus on rich aesthetics, sleek glassmorphism, responsive role-based access, and fluid micro-animations, this web application connects **Suppliers** and **Administrators** seamlessly through a unified interface.

The portal digitizes how enterprise companies manage their **Procurement Lifecycle** in real life (similar to SAP Ariba, Coupa, or Oracle Procurement) by automating document processing, supplier selection, contract issuing, and invoice payouts.

---

## 🎨 Immersive User Interface

The portal utilizes a cutting-edge **split-pane glassmorphism design system** featuring vibrant, high-fidelity HSL gradients, organic light-fog glow effects, and complex SVG/motion-driven visualizations.

### Let's Get Started Landing Page
Here is the high-fidelity role-based landing page, allowing users to choose their appropriate portal:

![SRM Portal Role Selection Landing Page](SRM_PROJECT/public/images/role-selection.png)
![SRM Portal Role Selection Login Page](SRM_PROJECT/public/images/login.png)
![SRM Supplier Page](SRM_PROJECT/public/images/supplier.png)
![SRM Admin Page](SRM_PROJECT/public/images/admin.png)

---

## 📊 Dashboard Data Flow Diagram (DFD)

The diagram below represents the functional Level-1 Data Flow Diagram (DFD) of the SRM Portal dashboards, showcasing how information moves between the roles (Admin, Supplier), dashboard engine processes, and the database stores:

```mermaid
graph TD
    %% Styling
    classDef actor fill:#f9fafb,stroke:#475569,stroke-width:2px;
    classDef process fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,rx:10px,ry:10px;
    classDef db fill:#fef9c3,stroke:#ca8a04,stroke-width:2px;

    %% Actors
    Admin[👤 Admin]:::actor
    Supplier[🚚 Supplier]:::actor

    %% Processes
    subgraph Dashboards [SRM Portal Dashboards]
        subgraph AdminDash [Admin Dashboard Processes]
            P2_1[2.1 Spend Analytics Engine]:::process
            P2_2[2.2 RFQ Pipeline Monitor]:::process
            P2_3[2.3 Order Tracker]:::process
            P2_4[2.4 Log Auditor]:::process
        end

        subgraph SupplierDash [Supplier Dashboard Processes]
            P3_1[3.1 KPI Statistics Engine]:::process
            P3_2[3.2 RFQ Sourcing Inbox]:::process
            P3_3[3.3 Active Order Tracker]:::process
            P3_4[3.4 Workspace Feed]:::process
        end
    end

    %% Data Stores
    subgraph Stores [MySQL Datastore]
        DB_Users[(Users & Roles)]:::db
        DB_RFQs[(RFQs & Bids)]:::db
        DB_POs[(Purchase Orders)]:::db
        DB_Reviews[(Receipts & Reviews)]:::db
        DB_Logs[(Audit Logs)]:::db
    end

    %% Flows - Admin Dashboard
    DB_POs -->|PO Details & Spend Data| P2_1
    DB_RFQs -->|RFQ pipeline data| P2_2
    DB_POs -->|PO status data| P2_3
    DB_Logs -->|Operational logs| P2_4

    P2_1 -->|Spend Trend Charts| Admin
    P2_2 -->|Sourcing Slices Pie Chart| Admin
    P2_3 -->|Fulfilled vs Unfulfilled Bar Chart| Admin
    P2_4 -->|Recent Activity Feed Table| Admin

    %% Flows - Supplier Dashboard
    DB_RFQs -->|Bid performance stats| P3_1
    DB_Reviews -->|Delivery & Rating stats| P3_1
    DB_RFQs -->|Invited / Open RFQs| P3_2
    DB_POs -->|Supplier PO execution data| P3_3
    DB_Logs -->|Workspace event history| P3_4

    P3_1 -->|Performance KPI Metrics Cards| Supplier
    P3_2 -->|Open RFQs Table & Bid Submission| Supplier
    P3_3 -->|Ongoing Orders Table| Supplier
    P3_4 -->|Supplier-specific Activity Feed| Supplier

    %% Sourcing & Lifecycle Flow Updates
    Admin -->|Create RFQ / Broadcast| DB_RFQs
    Supplier -->|Submit Bid Quotation| DB_RFQs
    Admin -->|Compare Bids & Award PO| DB_POs
    Supplier -->|Deliver Goods & Invoice| DB_Reviews
    Admin -->|Accept Delivery & Rate Supplier| DB_Reviews
    DB_Reviews -->|Log events| DB_Logs
```

---

## 🚀 Key Modules & Features

### 1. 🔐 Role-Based Authentication System
*   **Dual Entry Gateways**: Fully styled custom entry portals for **Suppliers** and **Admins**.
*   **Iridescent Globe Visualization**: An elegant, dynamic SVG globe animating interactive nodes and connection pulse lines on the presentation pane.
*   **Transition Magic**: Powered by **Framer Motion** for springy role switches, interactive hover states, card lifting, and floating transitions.
*   **Guided Registration**: A 3-step create-account flow that collects account details, business/department details, and verification in sequence.
*   **Tab Independence**: Uses `sessionStorage` to isolate user sessions per browser tab. You can test admin workflows in Tab A and supplier workflows in Tab B simultaneously without session conflicts.

### 2. 🛡️ Admin Portal (Procurement Control Center)
Provides administrators with complete control and visibility over the supply chain:
*   **Admin Dashboard**: Real-time analytical breakdown of total supplier participation, purchase commitments, and average RFQ cycle times.
*   **RFQ Sourcing**: Dynamic forms to author and broadcast RFQs instantly. Auto-fills fields by parsing uploaded PDF specs side-by-side.
*   **Advanced Bid Comparison**: Interactive charts (Recharts) comparing multiple supplier bids per RFQ side-by-side to determine the best price and quality metrics.
*   **Purchase Orders (PO)**: Manage PO pipelines, track order status, and issue agreements.
*   **Receipts & Reviews (GRN)**: Record Goods Receipt Notes (GRN) to check quantities and inspect deliveries. Integrates a multi-item grid parsed from delivery receipts.
*   **Invoice Approval workbench**: Review invoices, check a 3-way match (PO vs GRN vs Invoice), and record payouts.
*   **Governance & Audit Trail**: Monitor system logs to inspect chronological action trails for security.

### 3. 🚚 Supplier Portal (Partner Workspace)
Empowers suppliers to manage quotations, products, and fulfillment:
*   **Supplier Dashboard**: View active bids, delivery rates, and performance statistics.
*   **RFQ Sourcing Inbox**: Search, filter, and bid directly on open Requests for Quotations (RFQs).
*   **Product Catalog Management**: Easily list, edit, and keep track of supplier items.
*   **Order & Delivery Tracker**: Live statuses of ongoing purchase orders, shipments, and invoice histories.
*   **KPI & Performance Metrics**: Real-time ratings and scorecards evaluating delivery, pricing, and quality.
*   **Compliance Uploads**: Keep credentials active by uploading ISO Certificates or W-9 tax forms, automatically parsed for expiry dates.

---

## ⚡ Client-Side PDF Parsing Engine

The portal eliminates manual data entry by extracting metadata from business documents entirely within the user's browser. 

```
[PDF Uploaded] ──> [Dynamic CDN Loader (pdf.js)] ──> [Text Extraction] ──> [Regex Parsers] ──> [Form Auto-Fill]
```

### Module Parsing Details
1.  **RFQ Specification PDF** (`parseRfqPdf`): Extracts title, category (Logistics, Facilities, Services, Manufacturing), deadline, and estimated budget.
2.  **Bid Quotation PDF** (`parseBidPdf`): Extracts bid package reference, warranty, delivery time, and total price. Uses strict word boundaries (`\btotal\b`) to avoid extracting individual line-item unit prices (e.g. `$18.50`) instead of the grand total bid (e.g. `$125,000`).
3.  **Delivery Receipt PDF** (`parseGrnPdf`): Multi-item table-row parser extracts and sums individual quantities (Delivered/Accepted) from parsed columns.
4.  **Commercial Invoice PDF** (`parseInvoicePdf`): Extracts invoice ID, PO number, and invoice amount using strict boundary matches.
5.  **Compliance Document PDF** (`parseCompliancePdf`): Extracts certification ID, expiry date, issuer, and document type.

### UI Layout Sizing & Verification Window Behavior
The modals resize dynamically depending on whether a PDF preview is active to display a clean, side-by-side verification screen:
*   **Standard View (No PDF)**: Modals open centered at standard width (`lg` - 768px or `xl` - 1024px).
*   **Split-Screen View (With PDF)**: Modals automatically expand to `xxl` (`max-w-7xl` / 1280px). The left pane renders editable input fields populated by the parser, while the right pane renders an interactive PDF preview `iframe`, enabling quick verification prior to saving.

---

## 🛡️ Security & Vulnerability Auditing

The portal is audited and patched against common enterprise vulnerabilities:

*   **SQL Injection (SQLi) Prevention**: All dynamic database interactions in the PHP REST APIs use MySQLi prepared statements. Input parameters are bound strictly as literals, making SQL injection impossible.
*   **Password Security**: User passwords are securely stored on the local database using standard **bcrypt** hashing (`password_hash($password, PASSWORD_DEFAULT)`).
*   **In-Browser Document Privacy**: PDF text extraction and parsing occur entirely in-memory within the client's browser. No document binary or parsed text is transmitted to external server APIs, ensuring compliance with data privacy policies.
*   **Critical Parameter Binding Patches**:
    *   `bids.php`: Remediated a parameter count mismatch where 14 type specifiers were declared for 13 bound variables.
    *   `receipts.php`: Resolved scrambled type mappings (`'sssiiisssii'`) which bound string fields to integer parameters, preventing database write corruptions.
    *   `invoices.php`: Corrected date parameter double-casting where date string fields were bound as doubles (`d`), causing dates to truncate to `2026-00-00`. They are now safely bound as string literals (`s`).

---

## 📁 Repository Structure

```directory
SRM_PROJECT/
├── docs/                 # Consolidated project documentation
│   ├── testing-guide.md         # 11-step end-to-end user testing guide
│   ├── portal-workflow.md       # Business workflow & procurement lifecycle guide
│   ├── pdf-parsing-logic.md     # Client-side PDF extraction & regex parsing details
│   └── security-audit-report.md # SQLi prevention & parameter binding audit
├── src/
│   ├── components/       # Reusable UI Blocks (Alert, Button, Modal, Sidebar, Navbar, StatCards)
│   │   └── ui/           # Visual UI primitives (GridBackground, backgroundbeams, meteors, etc.)
│   ├── layouts/          # Layout wrappers (AdminLayout, SupplierLayout, PublicLayout)
│   ├── pages/
│   │   ├── auth/         # LoginPage, RegisterPage, ForgotPassword, AnimatedAuthSVGs
│   │   ├── admin/        # Dashboard, RFQManagement, BidComparison, SupplierManagement, Analytics, AuditLogs, RoleManagement, Settings
│   │   └── supplier/     # Dashboard, MyBids, Profile, Products, RFQs, Reviews, Invoices, WorkspaceFeed, KpiPerformance
│   ├── routes/           # Declarative React Router configurations (appRoutes.jsx)
│   ├── utils/            # Data formatting, storage helpers, and pdfParser.js
│   ├── main.jsx          # App entry point using HashRouter
│   └── styles.css        # Tailwind config, glassmorphism tokens, and custom animation definitions
├── backend/              # PHP REST API backend
│   ├── api/              # API Endpoint handlers (login.php, register.php, bids.php, rfqs.php, etc.)
│   ├── config/           # Database configurations (db.php)
│   └── database/         # MySQL schema.sql and migrate.php scripts
├── public/
│   ├── images/           # High-resolution illustrations & screenshots
│   └── samples/          # Test PDF specimens (rfq-procurement-spec.pdf, bid-quotation.pdf, etc.)
├── Theme.jsx             # Original theme toggler
├── tailwind.config.js    # Tailwind configuration with dark-mode overrides
├── vite.config.js        # Vite build & proxy settings
└── package.json          # Frontend packages & build scripts
```

---

## 🛠️ Setup and Installation

### 1. Database Setup (MySQL)
1.  Open phpMyAdmin or MySQL CLI.
2.  Import `SRM_PROJECT/backend/database/schema.sql` to create the database (`srm_portal`) and seed initial testing records.
3.  If you have an existing database, navigate to `SRM_PROJECT/backend/database` and run migrations to ensure database tables are up-to-date:
    ```bash
    php migrate.php
    ```

### 2. Configure Environment Files
*   **Backend Database Config**: `backend/config/db.php` reads connection variables from environment variables: `DB_HOST` (default: `127.0.0.1`), `DB_USER` (default: `root`), `DB_PASS` (default: empty), and `DB_NAME` (default: `srm_portal`).
*   **Frontend API Config**: Set the base API address inside `SRM_PROJECT/.env`:
    ```env
    VITE_API_BASE_URL=http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api
    ```

### 3. Frontend Setup
1.  Navigate into the `SRM_PROJECT` folder:
    ```bash
    cd SRM_PROJECT
    ```
2.  Install package dependencies:
    ```bash
    npm install
    ```
3.  Launch the Vite development server:
    ```bash
    npm run dev
    ```
4.  Open the URL shown in the terminal (typically **`http://localhost:5173`**).

---

## 🧪 Testing and Route Bypass Guides

### Default Test Accounts
Use these pre-seeded credentials to sign into the portal:
*   **Admin Console Role**:
    *   *Email*: `admin@srm.local`
    *   *Password*: `password123`
*   **Supplier Partner Workspace Role**:
    *   *Email*: `supplier@srm.local`
    *   *Password*: `password123`

### Development Hash-Routes (Bypassing Login)
For quick styling inspection and manual validation, you can bypass the authentication gates using direct hash routes:
*   **Admin Dashboard**: [http://127.0.0.1:5173/#/admin](http://127.0.0.1:5173/#/admin)
*   **Spend Analytics**: [http://127.0.0.1:5173/#/admin/analytics](http://127.0.0.1:5173/#/admin/analytics)
*   **Audit Logs**: [http://127.0.0.1:5173/#/admin/audit-logs](http://127.0.0.1:5173/#/admin/audit-logs)
*   **Supplier Dashboard**: [http://127.0.0.1:5173/#/supplier](http://127.0.0.1:5173/#/supplier)
*   **Sourcing RFQ Inbox**: [http://127.0.0.1:5173/#/supplier/rfqs](http://127.0.0.1:5173/#/supplier/rfqs)
*   **KPI & Performance Scores**: [http://127.0.0.1:5173/#/supplier/performance](http://127.0.0.1:5173/#/supplier/performance)

---

## 📝 11-Step End-to-End User Testing Flow

Follow these steps sequentially to test the full automated Procurement Lifecycle. For complete instructions, refer to the [Step-by-Step User Testing Guide](SRM_PROJECT/docs/testing-guide.md).

1.  **Sourcing Demand**: Identify a distribution need.
2.  **Create RFQ (Admin)**: Upload `rfq-procurement-spec.pdf` under Admin RFQs to auto-populate title, category, and deadline. Save RFQ.
3.  **Receive RFQ Invitation (Supplier)**: Log in as a supplier, open RFQ Sourcing Inbox, and select the newly created RFQ.
4.  **Submit Bid (Supplier)**: In the My Bids modal, upload `bid-quotation.pdf` to parse total bid price, warranty, and delivery speed. Verify the emerald success animation.
5.  **Evaluate Bids (Admin)**: Toggle to Admin Console -> Bid Management. Select the target RFQ in the dynamic scope dropdown to compare bids.
6.  **Issue PO (Admin)**: Award contract to the winning supplier bid to issue a Purchase Order.
7.  **Deliver Goods (Supplier)**: Simulates shipping physical goods to the corporate warehouse.
8.  **Goods Receipt GRN (Admin)**: Go to Receipts & Reviews -> Record Goods Receipt. Upload `delivery-receipt.pdf` to parse and auto-populate the line-item grid. Confirm delivered and accepted counts.
9.  **Submit Invoice (Supplier)**: In Supplier Workspace -> Invoices, upload `supplier-invoice.pdf` to parse Invoice ID, PO reference, and total amount.
10. **3-Way Match & Approval (Admin)**: Open Admin -> Invoices & Billing. Select the invoice, verify match details, and click Approve & Record Payment.
11. **Verify Compliance Documents**: Under Supplier Workspace -> Profile, upload `iso-compliance-certificate.pdf` to parse ISO details and expiry dates. Verify profile saving animation.

---

## 📝 License
This project is proprietary study/internship source material. All rights reserved.
