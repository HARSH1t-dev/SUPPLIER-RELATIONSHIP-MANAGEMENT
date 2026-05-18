# Supplier Relationship Management

A web-based Supplier Relationship Management (SRM) portal designed to digitize the procurement workflow between an organization and its suppliers. The system simulates a real procurement lifecycle from supplier registration to final goods receipt and review.

---

## 🔑 Key Roles

* **Admin:** Manages suppliers, creates Requests for Quotation (RFQs), compares bids, generates purchase orders, verifies delivery, and reviews supplier performance.
* **User (Supplier/Vendor):** Registers on the platform, manages product portfolios, receives RFQs, submits quotations, and tracks order statuses.

---

## 🛠️ Technology Stack

* **Backend:** PHP (PDO for database interactions)
* **Database:** MySQL
* **Frontend:** HTML, JavaScript, Custom CSS, Tailwind CSS (via CDN)
* **Environment:** XAMPP / Laragon (Apache + MySQL)

---

## 🚀 Core Features

* **Role-Based Access Control:** Secure authentication routing for Admins and Suppliers.
* **Supplier & Product Management:** Admins approve vendors; vendors manage their specific product catalogs.
* **RFQ & Bidding System:** Admins publish RFQs; eligible suppliers submit standardized bids before deadlines.
* **Bid Comparison:** Automated sorting of bids by price, delivery time, and supplier rating to help Admins select the winning quotation.
* **Purchase Orders (PO) & Receiving:** Generate POs from winning bids, track deliveries, and log damaged/missing goods.
* **Analytics & Reviews:** End-of-cycle supplier rating system and dashboard metrics for tracking procurement efficiency.

---

