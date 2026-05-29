# SRM Portal — Step-by-Step User Testing Guide
## Automated Procurement Lifecycle Simulator

Welcome to the Supplier Relationship Management (SRM) Portal! What you are testing is a digital version of how enterprise companies (such as Tata Motors, Amazon, Infosys, and Samsung) manage their **Procurement Lifecycle** in real life. 

Instead of exchanging fragmented emails, manually typing in data, and losing track of billing invoices, this portal automates the entire supply chain. Our **Client-Side PDF Parsing** simulates how modern ERP systems (like SAP Ariba, Coupa, or Oracle Procurement) automate manual data entry.

> [!TIP]
> **Isolated Multi-Account Testing (Tab Independence):**
> The active user session is stored in `sessionStorage`, which is isolated per browser tab. This enables you to open the supplier portal in Tab A as one supplier, and log in to a second supplier account in Tab B, allowing you to test independent supplier behaviors simultaneously in the same browser window without session conflicts.

---

## Real-Life Department Mapping

This portal simulates the interactions between several corporate departments and external entities:

| Real Corporate Department / Actor | Portal Module / Feature | DFD Process | Database Store |
| :--- | :--- | :--- | :--- |
| **Procurement / Sourcing Team** | RFQ Management (Admin Console) | 2.2 RFQ Management | `rfqs` (D3) |
| **Supplier (External Entity)** | RFQ Inbox & Bid Submission | 3.2 / 3.3 Bidding System | `bids` (D4) |
| **Supplier Sales Team** | Product Catalog | 3.4 Product Catalog | `srm_products` (localStorage) |
| **Sourcing / Purchasing Team** | Bid Comparison & PO Issuing | 2.3 / 2.4 PO Manager | `purchase_orders` (D5) |
| **Warehouse / Logistics Team** | Goods Receipt Note (GRN) | 2.6 Goods Receiving | `goods_receipts` (D7) |
| **Supplier Billing Department** | Invoice Submission | 3.4 Orders & Fulfillment | `invoices` (D8) |
| **Finance / Accounts Payable** | Invoice Approval & Payout | 2.7 Audit & Governance | `invoices` (D8) |
| **Compliance / Legal Team** | Certificate Upload & Profile | 3.5 Compliance Management | `compliance_documents` (D9) |
| **Internal Governance / Audit** | Audit Logs | 2.7 / 2.8 Governance | `audit_logs` (D11) |

---

## The 12-Step End-to-End Testing Flow

Follow these steps sequentially to test the full Procurement Lifecycle.

---

### STEP 0 — Supplier Registers Product Catalog (Master SKU Data)
* **Business Context**: Before bidding on sourcing requests, suppliers manage their unique SKU catalogs of offerings to showcase their capabilities and price guidelines to the procurement team.
* **Actions**:
  1. Open the portal, click **Login**, select **Supplier Portal**, and log in (e.g., using default supplier session showing company **Apex Industrial Components**).
  2. Navigate to **Product Catalog** in the sidebar.
  3. Verify the default items (Apex should see mechanical parts like *Hydraulic Valve Assembly*).
  4. Click **Add offering** at the top right, fill in a new offering (e.g. SKU: `PRD-4409`, Offering: "Titanium Valve", Category: "Mechanical", Capacity: `500`, Price: `85000` INR), and save it.
  5. Open the Supplier Portal representing a different company (e.g. **Vector Packaging Co.**) in another tab and verify they see their own catalog (packaging film, etc.) and do *not* see Apex's "Titanium Valve".
  6. Switch to the **Admin Console** and navigate to **Product Management** under *Procurement* in the sidebar.
  7. **UI Verification**: Use the **Supplier Dropdown** selector at the top right:
     * Select **Apex Industrial Components**: Confirm the Admin sees the newly added `PRD-4409` "Titanium Valve".
     * Select **Vector Packaging Co.**: Confirm the Admin sees only Vector's packaging catalog.
  8. Go back to the **Supplier Portal** for Apex, click the red trash icon to soft-delete the item, and verify it disappears from the Admin's list for Apex in real-time.

---

### STEP 1 — Sourcing Need Identified
* **Business Context**: A company department identifies a sourcing requirement (e.g., "We need precision components and logistics logistics coverage for distribution").
* **Action**: Sourcing Manager prepares to draft a request.

---

### STEP 2 — Admin Creates the RFQ (Request for Quotation)
* **DFD Process**: 2.2 RFQ Management | **Actor**: Admin (Sourcing Manager)
* **Actions**:
  1. Open the portal, click **Login**, and select the **Admin Console**.
  2. Navigate to **RFQs** under Sourcing in the sidebar.
  3. Click **New RFQ** at the top right.
  4. Download the sample spec by clicking **Download Sample RFQ Procurement Spec**.
  5. In the **Auto-fill from Document** card, click **Choose PDF File** and select `rfq-procurement-spec.pdf`.
  6. **UI Verification**: Confirm the modal expands to `xxl` (1280px wide) split-screen showing the PDF viewer on the right and form fields on the left.
  7. **Parser Verification**: Verify the parser extracts:
     * *Title*: `Rfq procurement spec` (derived from filename)
     * *Category*: `Logistics` (matched via text keywords)
     * *Deadline*: `2026-08-30` (matched via date regex)
     * *Target value*: `450000` (matched via estimated budget regex)
     * *Line Items*: Verify the line items editor table is pre-populated (e.g. with default items "Steel Rod" and "Copper Wire").
  8. **Line Items Grid Editor**: Click **+ Add Item** to append custom line items, or edit the existing names, specifications, quantities, and units.
  9. Click **Save RFQ** to write the record and its associated line items to the database with status `Active`.

---

### STEP 3 — Suppliers Receive RFQ Invitation
* **DFD Process**: 3.2 RFQ Inbox | **Actor**: Supplier
* **Actions**:
  1. Toggle role in the top header or log in as **Supplier**.
  2. Navigate to **RFQ Inbox** in the sidebar.
  3. Verify that the published RFQ is visible.
  4. **Click the "Bid" Action Button** next to the RFQ:
     * Verify that it automatically routes you to the **My Bids** page and opens the quotation modal with the RFQ reference pre-filled.

---

### STEP 4 — Supplier Submits Bid Proposal
* **DFD Process**: 3.3 Bidding System | **Actor**: Supplier (Commercial Lead)
* **Actions**:
  1. With the pre-filled modal already open from Step 3:
  2. **Relational Items Loading**: Verify that the **Quotation Sheet** table dynamically loads the line items requested in the buyer's RFQ.
  3. For each line item, enter the **Unit Price** (e.g. `50` for Steel Rod, `200` for Copper Wire) and adjust the **Tax (%)** (defaults to `18.0%`).
  4. Verify that the **Line Total** for each item auto-calculates dynamically (e.g., Qty 100 * ₹50 * 1.18 = ₹5,900).
  5. Enter the **Freight (₹)** charge in the summary panel (e.g., `200`).
  6. **Auto-Calculations Verification**: Confirm that the sheet summary panel automatically displays:
     * *Subtotal*: Sum of item quantities * unit prices (e.g., ₹9,000)
     * *Taxes*: Sum of item taxes (e.g., ₹1,620)
     * *Grand Total Quoted Price*: Subtotal + Taxes + Freight (e.g., ₹10,820)
  7. Fill in **Delivery Lead Time** (e.g., `10 Days`) and **Warranty Period** (e.g., `3 Years`).
  8. Click **Submit Proposal** to save the quote headers and line-item details. The modal will close instantly.

---

### STEP 5 — Admin Evaluates and Compares Bids
* **DFD Process**: 2.3 Bid Comparison & Evaluation Engine | **Actor**: Admin
* **Actions**:
  1. Switch back to the **Admin Console**.
  2. Navigate to **Bid Management** in the sidebar.
  3. **Live Scope Selector**: Use the **RFQ Scope** dropdown selector at the top right to select the RFQ.
  4. **Line-Item Comparison Verification**: Confirm that the comparison table displays a dynamic matrix showing:
     * **Per-Item Unit Prices**: Unit price and total line cost of each supplier compared side-by-side for each specific RFQ item.
     * **Quotation Summary**: Mapped columns showing Subtotal, Tax Total, Freight, and Grand Total side-by-side.
     * **Scores & Ratings**: Performance ratings and weighted evaluation scores.

---

### STEP 6 — Admin Issues a Purchase Order (PO)
* **DFD Process**: 2.4 Purchase Order Manager | **Actor**: Admin (Sourcing Manager)
* **Actions**:
  1. Under the Bid Comparison screen, select the winning supplier bid and click **Award Contract**.
  2. Navigate to **Purchase Orders** in the sidebar.
  3. Verify the official legally binding PO has been generated with status `Issued`, recording the agreed final terms.

---

### STEP 7 — Supplier Delivers Goods
* **Business Context**: Supplier ships physical goods to the warehouse according to the issued PO guidelines.
* **Action**: Logistics carrier delivers the components along with a delivery receipt.

---

### STEP 8 — Warehouse Records Goods Receipt Note (GRN)
* **DFD Process**: 2.6 Goods Receiving & Inspection | **Actor**: Admin (Warehouse Supervisor)
* **Actions**:
  1. Go to the Admin Console and navigate to **Receipts & Reviews** in the sidebar.
  2. Click **Record Goods Receipt**.
  3. Click **Download Sample Delivery Receipt** to get the sample PDF.
  4. Click **Choose PDF File** in the upload card and upload `delivery-receipt.pdf`.
  5. **Multi-Item Grid Verification**:
     * Verify the modal expands to `xxl` split-screen.
     * Confirm the **Line Items Grid Table** is populated with all three items parsed from the PDF:
       1. *Hydraulic Valves HV-200* | Delivered: `500` | Accepted: `498`
       2. *Steel Brackets SB-44* | Delivered: `1000` | Accepted: `992`
       3. *Copper Cables CC-12AWG* | Delivered: `200` | Accepted: `200`
     * Verify the totals sum up: Delivered: **`1700`**, Accepted: **`1690`**.
  6. Click **Save Receipt** to write items to the `goods_receipts` table.

---

### STEP 9 — Supplier Submits Invoice (Bill for Payment)
* **DFD Process**: 3.4 Orders & Fulfillment | **Actor**: Supplier (Billing Department)
* **Actions**:
  1. Go to the **Supplier Console** and navigate to **Invoices** in the sidebar.
  2. Click **Submit Invoice** at the top right.
  3. Click **Download Sample Invoice** to get the sample PDF.
  4. Click **Choose PDF File** in the upload card and upload `supplier-invoice.pdf`.
  5. **Parser Verification**:
     * Verify the modal expands to `xxl` split-screen.
     * Confirm the parser successfully extracts:
       * *Invoice Number*: `INV-5401`
       * *PO Reference*: `PO-88021`
       * *Invoice Amount ($)*: `185000` (Verified: It correctly extracts the grand total **`$185,000`** and ignores both the subtotal line `$128,000.00` and unit prices via strict regex word boundaries).
  6. Click **Submit Invoice** to write to the `invoices` table.

---

### STEP 10 — Finance Reviews and Approves Payment (3-Way Matching)
* **DFD Process**: 2.7 Audit & Governance | **Actor**: Admin (Finance Controller)
* **Actions**:
  1. Log back to the **Admin Console** and navigate to **Invoices & Billing** in the sidebar.
  2. Locate `INV-5401` in the table under status `Submitted` (amount matches outstanding statistics cards).
  3. Click **Approve** (marks invoice status as `Approved` in MySQL database).
  4. Click **Record Payment** (once treasury transfer completes, status updates to `Paid`).
  5. Log back to the Supplier Console -> Invoices to verify the payment status has updated to `Paid` on the supplier tracker table.

---

### STEP 11 — Supplier Uploads Compliance Documents & Profile Setup
* **DFD Process**: 3.5 Compliance Management | **Actor**: Supplier (Compliance Officer)
* **Actions**:
  1. Navigate to the Supplier Console -> **Profile** page.
  2. **Dynamic Identity Verification**: Verify that the company name (e.g. `'Apex Industrial Components'`) and contact name (e.g. `'Supplier User'`) match the logged-in session.
  3. Scroll to the **Compliance Documents** card and click the download sample link.
  4. Click **Choose PDF File** and select `iso-compliance-certificate.pdf`.
  5. Confirm the parsed certificate ID (`CERT-8401185`), issuer, and ISO 9001 details.
  6. Click **Save Document** to commit to `compliance_documents` table.
  7. **Premium Profile Save Animation**: Click **Save profile** inside the Company Profile card. Verify that the button switches to a loading spinner (`Saving...`), then to a green checkmark success button (`Saved!`), and slides down a smooth, styled banner confirming synchronization with the procurement directory.

---

## Verification of System Audit Logs

All the steps above are recorded sequentially in the database logs. Navigate to Admin Console -> **Audit Logs** to review the chronological action logs, providing a complete audit trail for corporate security.
