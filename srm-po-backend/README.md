# SRM Purchase Order Backend
### Tata Motors — Supplier Relationship Management System
**DFD Process 2.4 | Purchase Order Manager**

---

## Project Structure

```
srm-po-backend/
├── config/
│   └── db.php                  ← Database connection
├── api/
│   ├── rfq.php                 ← RFQ creation & management
│   ├── proposals.php           ← Supplier bid submission
│   ├── bid_matrix.php          ← Bid Comparison Matrix (parser cell)
│   ├── award_contract.php      ← Award contract + auto-generate PO
│   ├── purchase_orders.php     ← PO Manager (list, view, update status)
│   └── generate_pdf.php        ← Download PO as PDF
├── lib/
│   └── fpdf.php                ← Download from http://www.fpdf.org
├── schema.sql                  ← Run this to set up the database
└── README.md
```

---

## Setup Instructions

### 1. Database
```sql
-- In phpMyAdmin or MySQL CLI:
source schema.sql;
```

### 2. FPDF Library
- Download from http://www.fpdf.org
- Place `fpdf.php` inside the `/lib/` folder

### 3. Configure DB credentials
Edit `config/db.php`:
```php
$host = 'localhost';
$db   = 'srm_db';
$user = 'root';
$pass = 'your_password';
```

### 4. Run on localhost
Place the folder in your XAMPP/WAMP `htdocs` directory and access via:
`http://localhost/srm-po-backend/api/`

---

## API Reference

### RFQ
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/rfq.php` | List all RFQs |
| GET    | `/api/rfq.php?id=1` | Get single RFQ with items |
| POST   | `/api/rfq.php` | Create new RFQ |

**POST /api/rfq.php**
```json
{
  "title": "Steel Components Q3",
  "description": "Required for production line B",
  "deadline": "2026-06-15",
  "created_by": 1,
  "items": [
    { "item_name": "Steel Sheets", "quantity": 100, "unit": "kg" },
    { "item_name": "Bolts M10",    "quantity": 500, "unit": "pcs" }
  ]
}
```

---

### Proposals (Supplier Bids)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/proposals.php?rfq_id=1` | All bids for an RFQ |
| POST   | `/api/proposals.php` | Supplier submits bid |

**POST /api/proposals.php**
```json
{
  "rfq_id": 1,
  "supplier_id": 3,
  "delivery_days": 30,
  "validity_days": 45,
  "notes": "Can offer bulk discount",
  "items": [
    { "rfq_item_id": 1, "item_name": "Steel Sheets", "quantity": 100, "unit_price": 450.00 },
    { "rfq_item_id": 2, "item_name": "Bolts M10",    "quantity": 500, "unit_price": 12.50 }
  ]
}
```

---

### Bid Comparison Matrix (Parser Cell)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/bid_matrix.php?rfq_id=1` | Compare all supplier bids |

Returns a matrix with each line item vs each supplier's price.
Automatically tags the **lowest bid** per item and **overall lowest total**.

---

### Award Contract → Auto-Generate PO
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/award_contract.php` | Award contract, generate PO |

**POST /api/award_contract.php**
```json
{
  "proposal_id": 7,
  "awarded_by": 1
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Contract awarded. Legally binding PO generated with status ISSUED.",
  "po_id": 1,
  "po_number": "PO-2026-0001",
  "po_status": "issued",
  "supplier_name": "ABC Steels Pvt Ltd",
  "total_amount": "57250.00",
  "order_date": "2026-05-29",
  "delivery_date": "2026-06-28",
  "items_parsed": 2,
  "issued_to_supplier": true,
  "final_terms_locked": true
}
```

---

### Purchase Orders Manager
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/purchase_orders.php` | List all POs |
| GET    | `/api/purchase_orders.php?status=issued` | Filter by status |
| GET    | `/api/purchase_orders.php?supplier_id=3` | Filter by supplier |
| GET    | `/api/purchase_orders.php?id=1` | Single PO with items |
| PATCH  | `/api/purchase_orders.php` | Update PO status |

**PATCH /api/purchase_orders.php**
```json
{
  "id": 1,
  "status": "fulfilled"
}
```

---

### Generate PO PDF
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/generate_pdf.php?id=1` | Download PO as PDF |

---

## How PO Auto-Generation Works

When Admin clicks **Award Contract**, a single POST to `award_contract.php` with
`proposal_id` and `awarded_by` triggers this chain automatically:

```
proposal_id → fetch proposal
           → fetch supplier
           → parse proposal_items
           → generate PO number (PO-YYYY-NNNN)
           → compute delivery_date (today + delivery_days)
           → inject legal terms template
           → INSERT purchase_orders (status = issued)
           → INSERT po_items (copied from proposal_items)
           → UPDATE proposals (winner = awarded, others = rejected)
           → UPDATE rfq (status = awarded)
           → SET issued_to_supplier = 1
```

All steps run inside a **database transaction** — if anything fails,
the entire operation rolls back cleanly.

---

## PO Status Flow

```
issued → fulfilled   (goods received)
issued → cancelled   (admin cancels)
issued → pending     (on hold, pending clarification)
```

---

*Built for Tata Motors SRM Internship Project*
