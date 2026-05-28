<?php
// ============================================================
// api/generate_pdf.php — Generate Legally Binding PO as PDF
// Requires FPDF library in /lib/fpdf.php
// Download from: http://www.fpdf.org
// Usage: GET /api/generate_pdf.php?id=1
// ============================================================

require '../lib/fpdf.php';
require '../config/db.php';

if (empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["error" => "PO id is required"]);
    exit;
}

$po_id = $_GET['id'];

// ── Fetch PO with supplier and RFQ info ─────────────────────────────────────
$stmt = $pdo->prepare("
    SELECT
        po.*,
        s.name          AS supplier_name,
        s.contact_email AS supplier_email,
        s.phone         AS supplier_phone,
        s.address       AS supplier_address,
        r.rfq_number,
        r.title         AS rfq_title,
        u.name          AS awarded_by_name
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    JOIN rfq r       ON po.rfq_id = r.id
    JOIN users u     ON po.awarded_by = u.id
    WHERE po.id = ?
");
$stmt->execute([$po_id]);
$po = $stmt->fetch();

if (!$po) {
    http_response_code(404);
    echo json_encode(["error" => "Purchase Order not found"]);
    exit;
}

// ── Fetch PO line items ──────────────────────────────────────────────────────
$stmt2 = $pdo->prepare("SELECT * FROM po_items WHERE po_id = ?");
$stmt2->execute([$po_id]);
$items = $stmt2->fetchAll();

// ── Build PDF ────────────────────────────────────────────────────────────────
$pdf = new FPDF();
$pdf->AddPage();
$pdf->SetMargins(15, 15, 15);

// ── Header ───────────────────────────────────────────────────────────────────
$pdf->SetFont('Arial', 'B', 18);
$pdf->SetTextColor(30, 30, 30);
$pdf->Cell(0, 10, 'TATA MOTORS LTD', 0, 1, 'C');

$pdf->SetFont('Arial', 'B', 13);
$pdf->Cell(0, 7, 'PURCHASE ORDER', 0, 1, 'C');

$pdf->SetFont('Arial', 'I', 9);
$pdf->SetTextColor(100, 100, 100);
$pdf->Cell(0, 5, 'This is a legally binding Purchase Order issued electronically under the IT Act, 2000', 0, 1, 'C');
$pdf->Ln(4);

// ── Divider ──────────────────────────────────────────────────────────────────
$pdf->SetDrawColor(200, 200, 200);
$pdf->Line(15, $pdf->GetY(), 195, $pdf->GetY());
$pdf->Ln(4);

// ── PO Meta Details ──────────────────────────────────────────────────────────
$pdf->SetTextColor(30, 30, 30);
$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(90, 6, 'PO Number: ' . $po['po_number'], 0, 0);
$pdf->SetFont('Arial', '', 10);
$pdf->Cell(90, 6, 'RFQ Reference: ' . $po['rfq_number'], 0, 1);

$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(90, 6, 'Order Date: ' . $po['order_date'], 0, 0);
$pdf->Cell(90, 6, 'Delivery Date: ' . $po['delivery_date'], 0, 1);

$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(45, 6, 'Status: ', 0, 0);
$pdf->SetFont('Arial', 'B', 10);
$pdf->SetTextColor(0, 128, 0);
$pdf->Cell(45, 6, strtoupper($po['status']), 0, 1);
$pdf->SetTextColor(30, 30, 30);

$pdf->Ln(4);

// ── Two column: Buyer | Supplier ─────────────────────────────────────────────
$pdf->SetFont('Arial', 'B', 10);
$pdf->SetFillColor(240, 240, 240);
$pdf->Cell(90, 7, '  BUYER', 1, 0, 'L', true);
$pdf->Cell(90, 7, '  SUPPLIER', 1, 1, 'L', true);

$pdf->SetFont('Arial', '', 9);
$buyerLines    = ["Tata Motors Ltd.", "Jamshedpur, Jharkhand", "procurement@tatamotors.com"];
$supplierLines = [
    $po['supplier_name'],
    $po['supplier_address'] ?? '',
    $po['supplier_email'],
    $po['supplier_phone'] ?? ''
];
$maxLines = max(count($buyerLines), count($supplierLines));

for ($i = 0; $i < $maxLines; $i++) {
    $pdf->Cell(90, 6, '  ' . ($buyerLines[$i] ?? ''), 1, 0);
    $pdf->Cell(90, 6, '  ' . ($supplierLines[$i] ?? ''), 1, 1);
}

$pdf->Ln(6);

// ── Line Items Table ──────────────────────────────────────────────────────────
$pdf->SetFont('Arial', 'B', 10);
$pdf->SetFillColor(50, 50, 50);
$pdf->SetTextColor(255, 255, 255);
$pdf->Cell(8,  8, '#',           1, 0, 'C', true);
$pdf->Cell(82, 8, 'Item Description', 1, 0, 'L', true);
$pdf->Cell(20, 8, 'Qty',         1, 0, 'C', true);
$pdf->Cell(35, 8, 'Unit Price',  1, 0, 'R', true);
$pdf->Cell(35, 8, 'Total (INR)', 1, 1, 'R', true);

$pdf->SetFont('Arial', '', 10);
$pdf->SetTextColor(30, 30, 30);
$pdf->SetFillColor(255, 255, 255);

$i = 1;
foreach ($items as $item) {
    $fill = ($i % 2 == 0);
    $pdf->SetFillColor($fill ? 248 : 255, $fill ? 248 : 255, $fill ? 248 : 255);
    $pdf->Cell(8,  7, $i,                                          1, 0, 'C', true);
    $pdf->Cell(82, 7, $item['item_name'],                          1, 0, 'L', true);
    $pdf->Cell(20, 7, $item['quantity'],                           1, 0, 'C', true);
    $pdf->Cell(35, 7, number_format($item['unit_price'],  2),      1, 0, 'R', true);
    $pdf->Cell(35, 7, number_format($item['total_price'], 2),      1, 1, 'R', true);
    $i++;
}

// Total row
$pdf->SetFont('Arial', 'B', 11);
$pdf->SetFillColor(230, 230, 230);
$pdf->Cell(110, 8, 'TOTAL AMOUNT',                                    1, 0, 'R', true);
$pdf->Cell(20,  8, '',                                                 1, 0, 'C', true);
$pdf->Cell(50,  8, 'INR ' . number_format($po['total_amount'], 2),    1, 1, 'R', true);

$pdf->Ln(6);

// ── Legal Terms ───────────────────────────────────────────────────────────────
$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(0, 7, 'TERMS & CONDITIONS', 0, 1);
$pdf->SetFont('Arial', '', 8);
$pdf->SetTextColor(60, 60, 60);
$pdf->MultiCell(0, 4.5, $po['legal_terms']);

$pdf->Ln(6);

// ── Signature Block ───────────────────────────────────────────────────────────
$pdf->SetTextColor(30, 30, 30);
$pdf->SetFont('Arial', '', 10);
$pdf->Cell(90, 6, 'Authorized by (Tata Motors):', 0, 0);
$pdf->Cell(90, 6, 'Supplier Acknowledgement:', 0, 1);
$pdf->Ln(10);
$pdf->Cell(90, 6, '_______________________________', 0, 0);
$pdf->Cell(90, 6, '_______________________________', 0, 1);
$pdf->SetFont('Arial', '', 8);
$pdf->Cell(90, 5, $po['awarded_by_name'] . ' — Sourcing Manager', 0, 0);
$pdf->Cell(90, 5, $po['supplier_name'], 0, 1);

// ── Footer ────────────────────────────────────────────────────────────────────
$pdf->SetY(-20);
$pdf->SetFont('Arial', 'I', 7);
$pdf->SetTextColor(150, 150, 150);
$pdf->Cell(0, 5, 'Generated by Tata Motors SRM System | ' . date('d M Y H:i') . ' | ' . $po['po_number'], 0, 0, 'C');

// ── Output PDF as download ────────────────────────────────────────────────────
$pdf->Output('D', $po['po_number'] . '.pdf');
