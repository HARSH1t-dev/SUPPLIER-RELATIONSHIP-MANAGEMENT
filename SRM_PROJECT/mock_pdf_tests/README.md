# Mock PDF Sourcing Document Generator for Testing

This folder contains a Python script using the `reportlab` library to generate connected and structured mock procurement PDFs. 

These generated files can be uploaded directly into the SRM portal to test document scanning, regex pattern matching, and auto-fill API parsers.

---

## Generated Documents

The script generates four connected PDFs mapping a realistic procurement cycle:

1. **`rfq_spec_mechanical.pdf`** (Target RFQ: `RFQ-24061`)
   - Category: `Mechanical`
   - Estimated Value: `$120,000`
   - Sourcing schedule list of items (SB-100 Steel Bearings & BB-50 Brass Bushings).
   
2. **`bid_apex_quote.pdf`** (Supplier A Proposal)
   - Connected to `RFQ-24061`.
   - Total Bid Price: `$115,000`, Delivery: `10 Days`, Warranty: `3 Years`.
   - Complete item pricing breakdown matching Apex components.

3. **`bid_vector_quote.pdf`** (Supplier B Proposal)
   - Connected to `RFQ-24061`.
   - Total Bid Price: `$125,000`, Delivery: `15 Days`, Warranty: `2 Years`.
   - Item pricing breakdown matching Vector components.

4. **`goods_receipt_rec9081.pdf`** (Goods Receipt Note)
   - Receipt ID: `REC-9081`, PO Reference: `PO-88021`.
   - Detailed quantities received and accepted with `Approved` inspection statuses.

---

## How to Run

1. Open your terminal in this directory.
2. Execute the python script:
   ```bash
   python generator.py
   ```
3. The mock PDF files will be output directly in this folder.
