<?php
// ============================================================
// api/generate_pdf.php — Generate Legally Binding PO as PDF
// Requires FPDF library in /lib/fpdf.php
// Usage: GET /backend/api/generate_pdf.php?id=1
// ============================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../lib/fpdf.php';
require_once __DIR__ . '/../config/db.php';

if (empty($_GET['id'])) {
    http_response_code(400);
    header("Content-Type: application/json");
    echo json_encode(["success" => false, "message" => "PO id is required"]);
    exit;
}

$po_id = (int)$_GET['id'];

$config = db_config();
try {
    $pdo = new PDO("mysql:host={$config['host']};dbname={$config['name']};charset=utf8mb4", $config['user'], $config['pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode(["success" => false, "message" => "DB connection failed: " . $e->getMessage()]);
    exit;
}

// ── Fetch PO with supplier and RFQ info ──
$stmt = $pdo->prepare("
    SELECT
        po.po_id AS id,
        po.po_number,
        po.supplier_quote_id,
        po.rfq_id,
        po.supplier_id,
        po.total_amount,
        po.issued_by,
        po.issued_date AS order_date,
        po.expected_delivery AS delivery_date,
        po.status,
        po.legal_terms,
        po.final_terms_agreed,
        po.issued_to_supplier,
        po.issued_date AS created_at,
        s.company_name  AS supplier_name,
        u.email         AS supplier_email,
        u.phone         AS supplier_phone,
        s.address       AS supplier_address,
        r.id            AS rfq_number,
        r.title         AS rfq_title,
        ui.full_name    AS awarded_by_name
    FROM purchase_orders po
    LEFT JOIN users u         ON po.supplier_id = u.id
    LEFT JOIN suppliers s     ON s.user_id = u.id
    LEFT JOIN rfqs r          ON po.rfq_id = r.id
    LEFT JOIN users ui        ON po.issued_by = ui.id
    WHERE po.po_id = ?
");
$stmt->execute([$po_id]);
$po = $stmt->fetch();

if (!$po) {
    http_response_code(404);
    header("Content-Type: application/json");
    echo json_encode(["success" => false, "message" => "Purchase Order not found"]);
    exit;
}

// ── Fetch PO line items ──
$stmt2 = $pdo->prepare("SELECT * FROM po_items WHERE po_id = ?");
$stmt2->execute([$po_id]);
$items = $stmt2->fetchAll();

// ── Build PDF ──
$pdf = new FPDF();
$pdf->AddPage();
$pdf->SetMargins(15, 15, 15);

// ── Header ──
$pdf->SetFont('Arial', 'B', 18);
$pdf->SetTextColor(30, 30, 30);
$pdf->Cell(0, 10, 'TATA MOTORS LTD', 0, 1, 'C');

$pdf->SetFont('Arial', 'B', 13);
$pdf->Cell(0, 7, 'PURCHASE ORDER', 0, 1, 'C');

$pdf->SetFont('Arial', 'I', 9);
$pdf->SetTextColor(100, 100, 100);
$pdf->Cell(0, 5, 'This is a legally binding Purchase Order issued electronically under the IT Act, 2000', 0, 1, 'C');
$pdf->Ln(4);

// ── Divider ──
$pdf->SetDrawColor(200, 200, 200);
$pdf->Line(15, $pdf->GetY(), 195, $pdf->GetY());
$pdf->Ln(4);

// ── PO Meta Details ──
$pdf->SetTextColor(30, 30, 30);
$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(90, 6, 'PO Number: ' . $po['po_number'], 0, 0);
$pdf->SetFont('Arial', '', 10);
$pdf->Cell(90, 6, 'RFQ Reference: ' . $po['rfq_number'], 0, 1);

$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(90, 6, 'Order Date: ' . date('Y-m-d', strtotime($po['order_date'])), 0, 0);
$pdf->Cell(90, 6, 'Delivery Date: ' . $po['delivery_date'], 0, 1);

$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(45, 6, 'Status: ', 0, 0);
$pdf->SetFont('Arial', 'B', 10);
$pdf->SetTextColor(0, 128, 0);
$pdf->Cell(45, 6, strtoupper($po['status']), 0, 1);
$pdf->SetTextColor(30, 30, 30);

$pdf->Ln(4);

// ── Two column: Buyer | Supplier ──
$pdf->SetFont('Arial', 'B', 10);
$pdf->SetFillColor(240, 240, 240);
$pdf->Cell(90, 7, '  BUYER', 1, 0, 'L', true);
$pdf->Cell(90, 7, '  SUPPLIER', 1, 1, 'L', true);

$pdf->SetFont('Arial', '', 9);
$buyerLines    = ["Tata Motors Ltd.", "Jamshedpur, Jharkhand", "procurement@tatamotors.com"];
$supplierLines = [
    $po['supplier_name'],
    $po['supplier_address'] ?? 'No Address Listed',
    $po['supplier_email'],
    $po['supplier_phone'] ?? 'No Phone Listed'
];
$maxLines = max(count($buyerLines), count($supplierLines));

for ($i = 0; $i < $maxLines; $i++) {
    $pdf->Cell(90, 6, '  ' . ($buyerLines[$i] ?? ''), 1, 0);
    $pdf->Cell(90, 6, '  ' . ($supplierLines[$i] ?? ''), 1, 1);
}

$pdf->Ln(6);

// ── Line Items Table ──
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
    $pdf->Cell(35, 7, number_format((float)$item['unit_price'],  2),      1, 0, 'R', true);
    $pdf->Cell(35, 7, number_format((float)$item['total_price'], 2),      1, 1, 'R', true);
    $i++;
}

// Total row
$pdf->SetFont('Arial', 'B', 11);
$pdf->SetFillColor(230, 230, 230);
$pdf->Cell(110, 8, 'TOTAL AMOUNT',                                    1, 0, 'R', true);
$pdf->Cell(20,  8, '',                                                 1, 0, 'C', true);
$pdf->Cell(50,  8, 'INR ' . number_format((float)$po['total_amount'], 2),    1, 1, 'R', true);

$pdf->Ln(6);

// ── Legal Terms ──
$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(0, 7, 'TERMS & CONDITIONS', 0, 1);
$pdf->SetFont('Arial', '', 8);
$pdf->SetTextColor(60, 60, 60);
$pdf->MultiCell(0, 4.5, $po['legal_terms']);

$pdf->Ln(6);

// ── Signature Block ──
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

// ── Footer ──
$pdf->SetY(-20);
$pdf->SetFont('Arial', 'I', 7);
$pdf->SetTextColor(150, 150, 150);
$pdf->Cell(0, 5, 'Generated by Tata Motors SRM System | ' . date('d M Y H:i') . ' | ' . $po['po_number'], 0, 0, 'C');

// ── Output PDF as download ──
$pdf->Output('D', $po['po_number'] . '.pdf');
?>
