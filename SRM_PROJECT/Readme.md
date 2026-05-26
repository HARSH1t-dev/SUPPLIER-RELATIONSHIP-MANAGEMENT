# 🌐 Supplier Relationship Management (SRM) Portal

Welcome to the **Supplier Relationship Management (SRM) Portal**, a state-of-the-art enterprise procurement and supplier collaboration platform. This web application connects **Suppliers** and **Administrators** seamlessly through a unified, high-fidelity, and feature-rich workspace.

---

## 🔗 Quick Portal Access Links

### ⚡ Vite Development Server (During `npm run dev`)
* **Portal Login Page**: [http://127.0.0.1:5173/#/login](http://127.0.0.1:5173/#/login)
* **Admin Dashboard Console**: [http://127.0.0.1:5173/#/admin](http://127.0.0.1:5173/#/admin)
* **Supplier Partner Workspace**: [http://127.0.0.1:5173/#/supplier](http://127.0.0.1:5173/#/supplier)

### 📦 XAMPP Local Apache Server (Production build under `dist/`)
* **Portal Login Page**: [http://localhost/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/dist/#/login](http://localhost/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/dist/#/login)
* **Admin Dashboard Console**: [http://localhost/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/dist/#/admin](http://localhost/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/dist/#/admin)
* **Supplier Partner Workspace**: [http://localhost/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/dist/#/supplier](http://localhost/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/dist/#/supplier)

---

## 🎨 Immersive User Interface & User Experience
The portal features a modern interface, fluid micro-animations, and complete responsiveness. It is designed to act as a central hub for all procurement operations:
* **Premium Auth Pane**: Multi-step registration flow and an interactive, animated presentation panel.
* **Theme Support**: Fully integrated theme toggle capability for customized user preferences.
* **Interactive Data Visualizations**: Real-time analytical graphs powered by Recharts (Spend Analytics, KPI statistics, Bid comparisons).

---

## 🚀 Key Modules & Features

### 1. 🔐 Role-Based Authentication System (User Version)
* **Preserved Custom Auth Pages**: Features an immersive login and multi-step registration flow.
* **Animated Globe Visualization**: Pulse lines and node animations inside the graphic presentation panel.
* **Theme Control**: Persistent dark-mode support and custom-designed form elements.

### 2. 🛡️ Admin Portal (Procurement Control Center)
Provides administrators with complete control and visibility over the supply chain:
* **Admin Dashboard**: Real-time analytical cards and charts showing supplier activity, RFQ cycles, and purchase commitments.
* **RFQ Management**: Create and track Requests for Quotations (RFQs) and view sub-details.
* **Advanced Bid Comparison**: Interactive charts to compare multiple supplier proposals side-by-side.
* **Purchase Orders & Tracking**: Manage PO pipelines and track order fulfillment statuses.
* **Governance Tools**: Monitor activity through the **Audit Logs** panel and control access via **User & Role Management**.
* **System Settings & Profile**: Manage system configurations and profile details.

### 3. 🚚 Supplier Portal (Partner Workspace)
Empowers suppliers to manage quotations, products, and fulfillment:
* **Supplier Dashboard**: View bidding summary, performance statistics, and ongoing orders.
* **RFQ Sourcing Inbox**: View and bid on open sourcing requests.
* **Product Catalog**: Upload, list, and modify product offerings.
* **Order & Delivery History**: Track active purchase orders, shipment tracking, and invoice history.
* **KPI & Performance Metrics**: Real-time ratings and scorecards evaluating delivery, pricing, and quality.
* **Workspace Feed & Notifications**: Interactive activity logs and notifications feed.

---

## 🧪 Testing Routes (Bypass Login)
For evaluation and testing purposes, you can bypass the authentication gates using direct hash-routing links in your browser:

* **Admin Dashboard Home**: [http://127.0.0.1:5173/#/admin](http://127.0.0.1:5173/#/admin)
* **Spend Analytics (Admin)**: [http://127.0.0.1:5173/#/admin/analytics](http://127.0.0.1:5173/#/admin/analytics)
* **Audit Logs (Admin)**: [http://127.0.0.1:5173/#/admin/audit-logs](http://127.0.0.1:5173/#/admin/audit-logs)
* **Supplier Dashboard Home**: [http://127.0.0.1:5173/#/supplier](http://127.0.0.1:5173/#/supplier)
* **RFQ Sourcing Inbox (Supplier)**: [http://127.0.0.1:5173/#/supplier/rfqs](http://127.0.0.1:5173/#/supplier/rfqs)
* **KPI & Performance (Supplier)**: [http://127.0.0.1:5173/#/supplier/performance](http://127.0.0.1:5173/#/supplier/performance)

---

## 🛠️ Technology Stack
* **Library**: [React.js](https://react.dev/) (v18+)
* **Build System**: [Vite](https://vite.dev/) (with HMR)
* **CSS Framework**: [Tailwind CSS](https://tailwindcss.com/) (with custom color and shadow tokens)
* **Animation**: [Framer Motion](https://www.framer.com/motion/)
* **Charts**: [Recharts](https://recharts.org/)
* **Icons**: [Lucide React](https://lucide.dev/)

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
│   ├── components/       # Reusable blocks (Navbar, Sidebar, Button, Card, Modal, StatCard, ui/)
│   │   └── ui/           # GridBackground, HoverBorderGradient, BackgroundBeams, Meteors
│   ├── layouts/          # Layout structures (AdminLayout, SupplierLayout, PublicLayout, DashboardLayout)
│   ├── pages/
│   │   ├── auth/         # LoginPage, RegisterPage, ForgotPassword, AnimatedAuthSVGs
│   │   ├── admin/        # Dashboard, RFQManagement, RFQDetail, BidComparison, SupplierManagement, Analytics, Reports, AuditLogs, RoleManagement, Settings
│   │   └── supplier/     # Dashboard, RFQs, MyBids, Orders, OrderHistory, Invoices, KpiPerformance, Reviews, WorkspaceFeed, Notifications, Profile
│   ├── routes/           # Declarative app routing configurations (appRoutes.jsx)
│   ├── utils/            # Data formatting, storage helpers, and pdfParser.js
│   ├── main.jsx          # Entry script utilizing HashRouter
│   └── styles.css        # Custom styles, transitions, and Tailwind utilities
├── backend/              # PHP REST API backend
│   ├── api/              # Endpoint handlers (login, register, delete-account, bids, rfqs, etc.)
│   ├── config/           # Database configurations
│   └── database/         # schema.sql and migrate.php scripts
├── Theme.jsx             # Original theme toggler
├── tailwind.config.js    # Tailwind config with darkMode support
├── vite.config.js        # Vite config with base path & server configurations
└── package.json          # Node dependencies
```

---

## ⚙️ Setup and Installation

### 1. Install Dependencies
Navigate to the project folder and run:
```bash
npm install
```

### 2. Start Dev Server
Launch Vite development server:
```bash
npm run dev
```
Open **`http://127.0.0.1:5173`** in your browser.