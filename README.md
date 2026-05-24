# 🌐 Supplier Relationship Management (SRM) Portal

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)

Welcome to the **Supplier Relationship Management (SRM) Portal**, a state-of-the-art enterprise procurement and supplier collaboration platform. Built with a focus on rich aesthetics, sleek glassmorphism, responsive role-based access, and fluid micro-animations, this web application connects **Suppliers** and **Administrators** seamlessly through a unified interface.

---

## 🎨 Immersive User Interface

The portal utilizes a cutting-edge **split-pane glassmorphism design system** featuring vibrant, high-fidelity HSL gradients, organic light-fog glow effects, and complex SVG/motion-driven visualizations.

### Recent Auth UI Updates
The authentication experience now includes a cleaner registration flow and a more polished dark-mode treatment:
*   **Multi-step Create Account Flow**: Registration now advances from account details to business/department details and then verification.
*   **Custom Register Scrollbar**: The create-account panel uses a slim, branded scrollbar instead of the default browser style.
*   **Dark Mode Badge Fixes**: Checkmark badges in the auth cards now keep the correct contrast in dark mode.

### Let's Get Started Landing Page
Here is the high-fidelity role-based landing page, allowing users to choose their appropriate portal:

![SRM Portal Role Selection Landing Page](SRM_PROJECT/public/images/role-selection.png)
![SRM Portal Role Selection Login Page](SRM_PROJECT/public/images/login.png)
![SRM Supplier Page](SRM_PROJECT/public/images/supplier.png)
![SRM Admin Page](SRM_PROJECT/public/images/admin.png)

### Dashboard Data Flow Diagram (DFD)

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
*   **Security Built-in**: Enterprise-grade secure input styling, "Remember Me" sessions, and Forgot Password recovery flows.
*   **Guided Registration**: A step-by-step create-account flow that collects account details, business/department details, and verification in sequence.

### 2. 🚛 Supplier Portal
A dedicated dashboard that empowers suppliers with end-to-end management of their business:
*   **Performance Metrics Dashboard**: Key performance indicator cards for active bids, delivery rates, and revenue charts using Recharts.
*   **Interactive RFQs Panel**: Search, filter, and bid directly on open Requests for Quotations.
*   **Order & Delivery Tracker**: Live statuses of ongoing purchase orders and shipments.
*   **Product Catalog Management**: Easily upload, edit, and keep track of supplier items.

### 3. 🛡️ Admin Portal
A comprehensive control center for system administrators to oversee and optimize procurement:
*   **Global Overview**: Analytical breakdown of total supplier participation, purchase commitments, and average RFQ cycle times.
*   **Advanced Bid Comparison**: Interactive charts comparing multiple supplier bids per RFQ side-by-side to determine the best price and quality metrics.
*   **Supplier Directory**: Complete directory to evaluate supplier ratings, view historical reviews, and perform operational audits.
*   **RFQ Generation System**: Dynamic forms to author and broadcast RFQs instantly.

---

## 🛠️ Technology Stack

*   **Core Library**: [React.js](https://react.dev/) (v18+)
*   **Build Tool**: [Vite](https://vite.dev/) (ultra-fast compilation and HMR)
*   **CSS Engine**: [Tailwind CSS](https://tailwindcss.com/) (utility-first, augmented with customized HSL variables)
*   **Animation Engine**: [Framer Motion](https://www.framer.com/motion/) (complex orchestrations & exit/entrance layouts)
*   **Icons**: [Lucide React](https://lucide.dev/) (clean, responsive stroke icons)
*   **Visual Charts**: [Recharts](https://recharts.org/) (composed React charts built on SVG)

---

## 📁 Repository Structure

```directory
SRM_PROJECT/
├── src/
│   ├── components/       # Reusable UI Blocks (Alert, Button, Modal, Sidebar, Navbar, StatCards)
│   ├── layouts/          # Layout wrappers (AdminLayout, SupplierLayout, PublicLayout)
│   ├── pages/
│   │   ├── auth/         # LoginPage, RegisterPage, ForgotPassword, AnimatedAuthSVGs
│   │   ├── admin/        # Dashboard, RFQManagement, BidComparison, SupplierManagement
│   │   └── supplier/     # Dashboard, MyBids, Profile, Products, RFQs, Reviews
│   ├── routes/           # Declarative React Router configurations
│   ├── styles.css        # Tailwind config, glassmorphism tokens, and custom animation definitions
│   └── main.jsx          # App entry point
├── public/
│   └── images/           # High-resolution illustrative backgrounds & screenshots
└── package.json          # Project dependencies & build scripts
```

---

## ⚙️ Setup and Installation

Follow these steps to run the development server locally:

### 1. Prerequisite
Ensure you have [Node.js](https://nodejs.org/) (version 16 or higher) installed on your system.

### 2. Install Dependencies
Navigate into the project directory and install the necessary package dependencies:
```bash
cd SRM_PROJECT
npm install
```

### 3. Launch Development Server
Boot up the local dev server using Vite:
```bash
npm run dev
```
Open your browser and navigate to the port output in your terminal (typically **`http://localhost:5173`**).

---

## 📝 License
This project is proprietary study/internship source material. All rights reserved.
