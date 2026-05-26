# SRM Portal — User Workflow & Business Process Guide
## Understanding the Enterprise Sourcing & Billing Lifecycle

Welcome to the Supplier Relationship Management (SRM) Portal! This document explains how **Administrators** (Procurement and Finance Teams) and **Suppliers** interact to manage the automated **Procurement Lifecycle**. 

---

## What is an SRM System?

An SRM system acts as a digital ledger and operational workbench to automate how companies purchase materials, evaluate supplier performance, and manage financial payouts. 

Without an SRM, enterprise procurement is plagued by slow email threads, lost invoices, data discrepancies, and fraud risks. The SRM portal centralizes and automates this chain using **Client-Side PDF Parsing** to extract metadata from business documents instantly, eliminating hours of manual typing.

> [!TIP]
> **Independent Tab Sessions (sessionStorage):**
> By utilizing browser `sessionStorage`, each open tab runs its user session completely independently. You can open separate tabs to represent distinct suppliers or an admin, making testing highly efficient without different tabs overriding each other.

---

## Portal Real-Life Simulating Map

The SRM Portal simulates the workflows of a real-world corporate setting:

| Real Corporate Department | SRM Portal Feature | Key Action |
| :--- | :--- | :--- |
| **Procurement Team** | RFQ Sourcing | Creates requests for pricing from suppliers |
| **Sourcing Team** | Bid Evaluation | Compares bids in a side-by-side matrix |
| **Purchasing Team** | Purchase Orders (PO) | Confirms orders with legally binding agreements |
| **Warehouse Operations** | Goods Receipt Note (GRN) | Logs incoming deliveries and checks for damages |
| **Supplier Billing** | Invoice Submission | Requests payment for accepted deliveries |
| **Finance Team** | Invoice Approval | Verifies a 3-way match and triggers payout wires |
| **Compliance Team** | Certificate Upload | Audits quality standards (ISO) and W-9 tax forms |
| **Governance Team** | Audit Trail | Records chronological activity logs |

---

## The Procurement Lifecycle: Step-by-Step

### 1. Sourcing Demand & RFQ Creation
* **Role**: Admin (Procurement Manager)
* **What happens**: The company needs supplies. The Admin drafts a **Request for Quotation (RFQ)** specifying quantities, categories, deadlines, and estimated budgets.
* **Automation**: Instead of filling forms manually, the manager uploads a **Procurement Spec PDF**. The parser automatically extracts the title, category, deadline, and target budget.
* **Side-by-Side Verification**: The upload modal resizes to `xxl` (1280px) to display the original PDF next to editable input fields, allowing the user to review and correct values before saving to the database.

### 2. Supplier Bidding
* **Role**: Supplier (Commercial Lead)
* **What happens**: Suppliers see the RFQ in their inbox and submit a **Bid Quotation**.
* **Automation**: The supplier uploads their commercial proposal PDF. The system extracts the bid package reference, quoted price, delivery timeline, and warranty.
* **Bids Submission Confirmation Screen**: Once the supplier submits a proposal, they see a dynamic success animation panel inside the modal highlighting the exact parameters of their proposal (Target RFQ, Quoted Price, Delivery Time, and Warranty).
* **Parsing Safety**: The parser searches specifically for the `Total Bid Price:` prefix using word boundary tags (`\btotal\b`). This prevents the system from matching individual unit prices (such as a ball bearing unit cost of `$18.50`) instead of the grand total bid (e.g., `$125,000`).

### 3. Bid Evaluation & Contract Award
* **Role**: Admin (Sourcing Team)
* **What happens**: The Admin reviews competing bids in the **Bid Comparison Matrix**, scoring them on price, speed, and warranty, then awards a contract to generate a **Purchase Order (PO)**.
* **Dynamic RFQ Comparison Selector**: Admins can toggle between different RFQs using the dropdown selector in the header to instantly filter bids in the matrix table.

### 4. Goods Receiving & Inspection
* **Role**: Admin (Warehouse Supervisor)
* **What happens**: Physical goods are delivered. The warehouse logs a **Goods Receipt Note (GRN)** to verify quantities and check for damaged components.
* **Automation**: Uploading the logistics delivery receipt auto-fills a **Line-Items Grid Editor**. The multi-item parser extracts all items dynamically from the PDF.
* **Interactive Grid**: Administrators can edit descriptions, delivered counts, and accepted counts inline, or append and delete rows prior to saving.

### 5. Billing & Invoice Approval (3-Way Matching)
* **Role**: Supplier (Billing) & Admin (Finance)
* **What happens**: 
  1. The supplier uploads their billing **Commercial Invoice PDF**. The parser extracts the invoice ID, PO link, and invoice amount (using strict word boundaries to avoid matching the `Subtotal` line).
  2. The Admin reviews the invoice in the **Invoice Approval Workbench**. They match the invoice against the original PO and the recorded GRN delivery counts (known as a **3-way match**).
  3. The Admin approves the invoice and records the payout once wire transfer finishes, updating status to `Paid`.

### 6. Compliance & Audits
* **Role**: Supplier & Admin
* **What happens**: Suppliers keep their compliance status active by uploading **ISO Certificates** or W-9 tax forms, which are parsed for expiry dates. Every transaction is logged inside the **Audit Logs** to preserve auditability.
* **Supplier Profile Dynamics**: Supplier settings are bound to the active user session. When they click **Save profile**, a smooth button animation (`Saving...` -> `Saved!`) and a slide-down banner indicate success without using browser JS alerts.
