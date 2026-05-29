import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def create_pdf(filename, title, content_flowable_list):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    doc.build(content_flowable_list)
    print(f"Created: {filename}")

def build_rfq_spec():
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=10
    )
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#64748B')
    )
    meta_value_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#0F172A')
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=15,
        spaceAfter=5
    )
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#334155'),
        leading=14
    )
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white
    )
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#334155')
    )

    story = []
    
    # Header
    story.append(Paragraph("REQUEST FOR QUOTATION", title_style))
    story.append(Paragraph("Global Procurement System Spec Sheet", ParagraphStyle('Sub', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#94A3B8'))))
    story.append(Spacer(1, 15))
    
    # Metadata Block
    meta_data = [
        [Paragraph("RFQ ID:", meta_label_style), Paragraph("RFQ-24061", meta_value_style), Paragraph("Category:", meta_label_style), Paragraph("Mechanical", meta_value_style)],
        [Paragraph("Estimated Value:", meta_label_style), Paragraph("$120,000", meta_value_style), Paragraph("Deadline:", meta_label_style), Paragraph("2026-06-30", meta_value_style)],
        [Paragraph("Status:", meta_label_style), Paragraph("Open", meta_value_style), Paragraph("", meta_label_style), Paragraph("", meta_value_style)]
    ]
    t_meta = Table(meta_data, colWidths=[100, 160, 100, 160])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINEBELOW', (0,-1), (-1,-1), 1, colors.HexColor('#E2E8F0')),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 15))
    
    # Scope
    story.append(Paragraph("1. Scope of Procurement", heading_style))
    story.append(Paragraph(
        "The Purchaser invites sealed quotations for the provision of industrial mechanical parts detailed below. "
        "All bidding suppliers must quote itemized unit prices, tax percentages, and delivery schedules.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Sourcing Schedule
    story.append(Paragraph("2. Sourcing Schedule & Technical Specs", heading_style))
    
    # Items Table
    headers = [Paragraph("Item", table_header_style), Paragraph("Description & Specification", table_header_style), Paragraph("Qty", table_header_style), Paragraph("Unit", table_header_style), Paragraph("Est. Value", table_header_style)]
    row1 = [Paragraph("1", table_cell_style), Paragraph("Steel Bearings SB-100 Grade A Double Sealed", table_cell_style), Paragraph("1000", table_cell_style), Paragraph("pcs", table_cell_style), Paragraph("$88,500", table_cell_style)]
    row2 = [Paragraph("2", table_cell_style), Paragraph("Brass Bushings BB-50 Heavy Duty Sleeve", table_cell_style), Paragraph("500", table_cell_style), Paragraph("pcs", table_cell_style), Paragraph("$25,960", table_cell_style)]
    
    t_items = Table([headers, row1, row2], colWidths=[40, 260, 60, 60, 100])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    story.append(t_items)
    
    create_pdf("rfq_spec_mechanical.pdf", "RFQ-24061 Spec", story)

def build_bid_quote(filename, bid_id, supplier_name, price_str, delivery_str, warranty_str, item_prices):
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#0284C7'),
        spaceAfter=10
    )
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#64748B')
    )
    meta_value_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#0F172A')
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=15,
        spaceAfter=5
    )
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white
    )
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#334155')
    )

    story = []
    
    # Header
    story.append(Paragraph("SUPPLIER COMMERCIAL PROPOSAL", title_style))
    story.append(Paragraph(f"Proposal ID: {bid_id} | Issued by {supplier_name}", ParagraphStyle('Sub', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#94A3B8'))))
    story.append(Spacer(1, 15))
    
    # Metadata Block
    meta_data = [
        [Paragraph("Target RFQ Package:", meta_label_style), Paragraph("RFQ-24061", meta_value_style), Paragraph("Total Bid Price:", meta_label_style), Paragraph(price_str, meta_value_style)],
        [Paragraph("Delivery Lead Time:", meta_label_style), Paragraph(delivery_str, meta_value_style), Paragraph("Warranty Period:", meta_label_style), Paragraph(warranty_str, meta_value_style)],
        [Paragraph("Supplier Name:", meta_label_style), Paragraph(supplier_name, meta_value_style), Paragraph("Currency:", meta_label_style), Paragraph("USD ($)", meta_value_style)]
    ]
    t_meta = Table(meta_data, colWidths=[130, 130, 130, 130])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F0F9FF')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,-1), (-1,-1), 1, colors.HexColor('#BAE6FD')),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 15))
    
    # Pricing Breakdown
    story.append(Paragraph("Quotation Line Items Breakdown", heading_style))
    
    headers = [
        Paragraph("Item", table_header_style), 
        Paragraph("Description", table_header_style), 
        Paragraph("Qty", table_header_style), 
        Paragraph("Unit Price", table_header_style), 
        Paragraph("Tax (%)", table_header_style), 
        Paragraph("Line Total", table_header_style)
    ]
    
    rows = [headers]
    for idx, item in enumerate(item_prices):
        rows.append([
            Paragraph(str(idx + 1), table_cell_style),
            Paragraph(item['name'], table_cell_style),
            Paragraph(str(item['qty']), table_cell_style),
            Paragraph(f"${item['price']:.2f}", table_cell_style),
            Paragraph(f"{item['tax']}%", table_cell_style),
            Paragraph(f"${item['total']:.2f}", table_cell_style)
        ])
        
    t_items = Table(rows, colWidths=[35, 205, 50, 75, 55, 100])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0284C7')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#BAE6FD')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F0F9FF')])
    ]))
    story.append(t_items)
    
    create_pdf(filename, f"Bid {bid_id}", story)

def build_grn_spec():
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#16A34A'),
        spaceAfter=10
    )
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#64748B')
    )
    meta_value_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#0F172A')
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=15,
        spaceAfter=5
    )
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white
    )
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#334155')
    )

    story = []
    
    # Header
    story.append(Paragraph("GOODS RECEIPT NOTE (GRN)", title_style))
    story.append(Paragraph("Receiving & Inspection Report", ParagraphStyle('Sub', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#94A3B8'))))
    story.append(Spacer(1, 15))
    
    # Metadata Block
    meta_data = [
        [Paragraph("Receipt ID:", meta_label_style), Paragraph("REC-9081", meta_value_style), Paragraph("PO Reference:", meta_label_style), Paragraph("PO-88021", meta_value_style)],
        [Paragraph("Received At:", meta_label_style), Paragraph("2026-05-20", meta_value_style), Paragraph("Carrier:", meta_label_style), Paragraph("Metro Freight", meta_value_style)],
        [Paragraph("Inspector:", meta_label_style), Paragraph("John Doe", meta_value_style), Paragraph("Status:", meta_label_style), Paragraph("Approved", meta_value_style)]
    ]
    t_meta = Table(meta_data, colWidths=[100, 160, 100, 160])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F0FDF4')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,-1), (-1,-1), 1, colors.HexColor('#BBF7D0')),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 15))
    
    # Item Table (Matching rowRegex)
    # regex matches: item_num item_name ordered received accepted status
    story.append(Paragraph("Received Material Verification Log", heading_style))
    
    headers = [
        Paragraph("Line", table_header_style),
        Paragraph("Item Description", table_header_style),
        Paragraph("Ordered", table_header_style),
        Paragraph("Received", table_header_style),
        Paragraph("Accepted", table_header_style),
        Paragraph("Status", table_header_style)
    ]
    
    row1 = [
        Paragraph("1", table_cell_style),
        Paragraph("Industrial Bearings", table_cell_style),
        Paragraph("2500", table_cell_style),
        Paragraph("2500", table_cell_style),
        Paragraph("2490", table_cell_style),
        Paragraph("Approved", table_cell_style)
    ]
    
    row2 = [
        Paragraph("2", table_cell_style),
        Paragraph("Brass Bushings", table_cell_style),
        Paragraph("500", table_cell_style),
        Paragraph("500", table_cell_style),
        Paragraph("500", table_cell_style),
        Paragraph("Approved", table_cell_style)
    ]
    
    t_items = Table([headers, row1, row2], colWidths=[40, 200, 65, 65, 65, 85])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#16A34A')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#BBF7D0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F0FDF4')])
    ]))
    story.append(t_items)
    
    create_pdf("goods_receipt_rec9081.pdf", "GRN REC-9081", story)

def generate_all():
    # Make sure we generate in the current script directory
    orig_dir = os.getcwd()
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    try:
        build_rfq_spec()
        
        # Supplier A Proposal (Apex)
        build_bid_quote(
            "bid_apex_quote.pdf",
            "BID-1",
            "Apex Industrial Components",
            "$115,000",
            "10 Days",
            "3 Years",
            [
                {'name': 'Steel Bearings SB-100 Grade A Double Sealed', 'qty': 1000, 'price': 75.00, 'tax': 18.0, 'total': 88500.00},
                {'name': 'Brass Bushings BB-50 Heavy Duty Sleeve', 'qty': 500, 'price': 44.00, 'tax': 18.0, 'total': 25960.00}
            ]
        )
        
        # Supplier B Proposal (Vector)
        build_bid_quote(
            "bid_vector_quote.pdf",
            "BID-2",
            "Vector Packaging Co.",
            "$125,000",
            "15 Days",
            "2 Years",
            [
                {'name': 'Steel Bearings SB-100 Grade A Double Sealed', 'qty': 1000, 'price': 80.00, 'tax': 18.0, 'total': 94400.00},
                {'name': 'Brass Bushings BB-50 Heavy Duty Sleeve', 'qty': 500, 'price': 50.00, 'tax': 18.0, 'total': 29500.00}
            ]
        )
        
        build_grn_spec()
        print("All mock PDFs generated successfully in mock_pdf_tests directory.")
    finally:
        os.chdir(orig_dir)

if __name__ == "__main__":
    generate_all()
