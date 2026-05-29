// Utility to load pdf.js from CDN dynamically
export const loadPdfJS = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Extract raw text from PDF file in client browser
export const extractTextFromPdf = async (file) => {
  try {
    const pdfjs = await loadPdfJS();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      const pageText = text.items.map(item => item.str).join(' ');
      textContent += pageText + '\n';
    }
    return textContent;
  } catch (error) {
    console.error('PDF extraction failed, using fallback metadata parser', error);
    return '';
  }
};

// 1. RFQ PDF Parser
export const parseRfqPdf = (text, fileName) => {
  const cleanText = text.toLowerCase();
  
  // Try to find target values
  const valueMatch = text.match(/(?:estimated\s+value|\bvalue\b)\s*:?\s*(\$[0-9,]+(\.[0-9]{2})?|\d+,\d{3})/i) ||
                     text.match(/\$[0-9,]+(\.[0-9]{2})?/) || 
                     text.match(/\d+,\d{3}/);
  let targetValue = '250000';
  if (valueMatch) {
    const matchedStr = valueMatch[1] || valueMatch[0];
    targetValue = matchedStr.replace(/[^0-9.]/g, '');
  }
  
  // Try to find deadlines (YYYY-MM-DD)
  const deadlineMatch = text.match(/(?:deadline|submit|due)\s*:?\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i);
  let deadline = '2026-08-30';
  if (deadlineMatch) {
    deadline = deadlineMatch[1];
  } else {
    const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/) || text.match(/\d{2}\/\d{2}\/\d{4}/);
    if (dateMatch) {
      deadline = dateMatch[0];
    }
  }
  
  // Determine category
  let category = 'Mechanical';
  if (cleanText.includes('logistics') || cleanText.includes('ship') || cleanText.includes('transport') || cleanText.includes('freight')) {
    category = 'Logistics';
  } else if (cleanText.includes('facility') || cleanText.includes('hvac') || cleanText.includes('building') || cleanText.includes('maintenance')) {
    category = 'Facilities & Maintenance';
  } else if (cleanText.includes('service') || cleanText.includes('consulting') || cleanText.includes('audit') || cleanText.includes('professional') || cleanText.includes('it')) {
    category = 'IT & Professional Services';
  } else if (cleanText.includes('electric') || cleanText.includes('board') || cleanText.includes('cable') || cleanText.includes('power')) {
    category = 'Electrical';
  } else if (cleanText.includes('package') || cleanText.includes('box') || cleanText.includes('carton') || cleanText.includes('film')) {
    category = 'Packaging';
  } else if (cleanText.includes('chemical') || cleanText.includes('raw') || cleanText.includes('material') || cleanText.includes('polymer') || cleanText.includes('steel') || cleanText.includes('metal')) {
    category = 'Chemical & Raw Materials';
  }
  
  // Title extraction
  let title = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
  title = title.charAt(0).toUpperCase() + title.slice(1);
  if (title.length < 5) title = 'RFQ Sourcing Contract';

  // Extract description/scope
  let description = '';
  const descMatch = text.match(/(?:scope\s+of\s+procurement|scope|description)\s*\n*([\s\S]+?)(?=\n*(?:\d+\.\s*)?(?:sourcing\s+schedule|schedule|items|specifications|\b\d\b))/i);
  if (descMatch) {
    description = descMatch[1].trim();
  }
  if (!description) {
    description = "The Purchaser invites sealed quotations for the provision of materials or services detailed in the item schedule below. All submissions must represent itemized unit rates, applicable tax percentages, and standard packaging freight charges.";
  }

  // Parse items
  const items = [];
  const itemRegex = /\b(\d+)\s+([A-Za-z0-9\s\(\)#\.&-]+?)\s+(\d{1,4})\s+([A-Za-z0-9/]+)\s+\$([0-9,]+)/gi;
  let match;
  while ((match = itemRegex.exec(text)) !== null) {
    const itemName = match[2].trim();
    const quantity = parseInt(match[3], 10);
    const unit = match[4].trim();
    const estValue = match[5].trim();
    
    if (itemName.toLowerCase() === 'description') continue;
    
    items.push({
      item_name: itemName,
      specification: `Est. Value: $${estValue}`,
      quantity: quantity,
      unit: unit
    });
  }

  if (items.length === 0) {
    if (cleanText.includes('logistics') || cleanText.includes('freight')) {
      items.push(
        { item_name: 'Domestic Ground Freight (FTL)', specification: 'Est. Value: $180,000', quantity: 240, unit: 'Loads/Yr' },
        { item_name: 'Temperature-Controlled Transport', specification: 'Est. Value: $120,000', quantity: 96, unit: 'Loads/Yr' },
        { item_name: 'Cross-Border Customs Brokerage', specification: 'Est. Value: $45,000', quantity: 48, unit: 'Shipments' },
        { item_name: 'Warehouse Storage & Handling', specification: 'Est. Value: $72,000', quantity: 12, unit: 'Months' },
        { item_name: 'Tracking Dashboard & Analytics', specification: 'Est. Value: $33,000', quantity: 1, unit: 'Platform' }
      );
    } else {
      items.push(
        { item_name: 'Steel Rod', specification: 'Grade A', quantity: 100, unit: 'pcs' },
        { item_name: 'Copper Wire', specification: '2mm', quantity: 20, unit: 'rolls' }
      );
    }
  }

  return { title, category, deadline, value: targetValue, description, items };
};

// 2. Bid PDF Parser
export const parseBidPdf = (text, fileName) => {
  const cleanText = text.toLowerCase();
  
  // Quoted Price
  const priceMatch = text.match(/(?:total\s+bid\s+price|total\s+bid|total\s+price|\btotal\b)\s*:?\s*(\$[0-9,]+(\.[0-9]{2})?|\d+,\d{3})/i) ||
                     text.match(/\$[0-9,]+/);
  const price = priceMatch ? Number((priceMatch[1] || priceMatch[0]).replace(/[^0-9.]/g, '')) : 120000;
  
  // Delivery/Lead times
  const deliveryMatch = text.match(/\d+\s*(days|weeks|months)/i);
  const delivery = deliveryMatch ? deliveryMatch[0] : '15 Days';
  
  // Warranty
  const warrantyMatch = text.match(/\d+\s*(year|yr)/i);
  const warranty = warrantyMatch ? warrantyMatch[0] + 's' : '2 Years';
  
  // Bid Package
  const rfqMatch = text.match(/rfq-\d+/i);
  const rfqPackage = rfqMatch ? rfqMatch[0].toUpperCase() : 'RFQ-24061';
  
  // Parse items
  const items = [];
  const itemRegex = /\b(\d+)\s+([A-Za-z0-9\s\(\)#\.-]+?)\s+(\d{1,4})\s+\$([0-9,]+\.[0-9]{2})\s+([0-9,.]+)\%\s+\$([0-9,]+\.[0-9]{2})\b/gi;
  let match;
  while ((match = itemRegex.exec(text)) !== null) {
    const itemName = match[2].trim();
    const quantity = parseInt(match[3], 10);
    const unitPrice = parseFloat(match[4].replace(/,/g, ''));
    const taxPercent = parseFloat(match[5]);
    const lineTotal = parseFloat(match[6].replace(/,/g, ''));
    
    if (itemName.toLowerCase() === 'description') continue;
    
    items.push({
      item_name: itemName,
      quantity: quantity,
      unit_price: unitPrice,
      tax_percent: taxPercent,
      line_total: lineTotal
    });
  }
  
  return { rfqPackage, price, delivery, warranty, items };
};

// 3. Goods Receipt PDF Parser
export const parseGrnPdf = (text, fileName) => {
  const cleanText = text.toLowerCase();
  
  // Receipt ID
  const receiptMatch = text.match(/rec-\d+/i) || text.match(/receipt\s*#?\s*\d+/i);
  const receipt = receiptMatch ? receiptMatch[0].toUpperCase().replace(/\s*#\s*/, '-') : 'REC-' + Math.floor(1000 + Math.random() * 9000);
  
  // PO Reference
  const poMatch = text.match(/po-\d+/i) || text.match(/po\s*#?\s*\d+/i);
  const po = poMatch ? poMatch[0].toUpperCase().replace(/\s*#\s*/, '-') : 'PO-88021';
  
  // Dynamic Table-Row extraction using a robust regex pattern
  const itemsList = [];
  const rowRegex = /\b(\d+)\s+([A-Za-z0-9\s\(\)#\.-]+?)\s+(\d{1,3}(?:,\d{3})*(?:m)?)\s+(\d{1,3}(?:,\d{3})*(?:m)?)\s+(\d{1,3}(?:,\d{3})*(?:m)?)\s+(Accepted|Rejected|Pending|Review\s+required|Approved|Evaluating)\b/gi;
  
  let match;
  while ((match = rowRegex.exec(text)) !== null) {
    const name = match[2].trim();
    const receivedVal = match[4].replace(/[^0-9]/g, '');
    const acceptedVal = match[5].replace(/[^0-9]/g, '');
    
    // Ignore lines that matched headers or metadata (like line #s that matched other items)
    if (name.toLowerCase() === 'item description' || name.toLowerCase() === 'description') {
      continue;
    }
    
    itemsList.push({
      name: name,
      received: parseInt(receivedVal, 10) || 0,
      accepted: parseInt(acceptedVal, 10) || 0
    });
  }

  // Fallback 1: Keyword-based lookup if regex table parser failed
  if (itemsList.length === 0) {
    const itemConfigs = [
      { key: 'Hydraulic Valves', keywords: ['hydraulic valves', 'valves'], defaultRec: 500, defaultAcc: 498 },
      { key: 'Steel Brackets', keywords: ['steel brackets', 'brackets'], defaultRec: 1000, defaultAcc: 992 },
      { key: 'Copper Cables', keywords: ['copper cables', 'cables'], defaultRec: 200, defaultAcc: 200 },
      { key: 'Industrial Bearings', keywords: ['industrial bearings', 'bearings'], defaultRec: 2500, defaultAcc: 2490 }
    ];

    itemConfigs.forEach(config => {
      const foundKw = config.keywords.find(kw => cleanText.includes(kw));
      if (foundKw) {
        let received = config.defaultRec;
        let accepted = config.defaultAcc;

        // Try to find numbers close to the item name in the text
        const index = cleanText.indexOf(foundKw);
        if (index !== -1) {
          const windowText = text.slice(index, index + 120);
          const numbers = windowText.match(/\b\d{1,3}(,\d{3})*(m)?\b/g);
          if (numbers && numbers.length >= 2) {
            const nums = numbers.map(n => parseInt(n.replace(/[^0-9]/g, ''), 10));
            if (nums.length >= 2) {
              accepted = nums[nums.length - 1];
              received = nums[nums.length - 2];
            }
          }
        }

        itemsList.push({
          name: config.key,
          received: received,
          accepted: accepted
        });
      }
    });
  }

  // Fallback 2: Hardcoded single item if all else fails
  if (itemsList.length === 0) {
    itemsList.push({ name: 'Industrial Bearings', received: 2500, accepted: 2490 });
  }

  // Calculate totals and joined strings
  const itemNames = itemsList.map(x => x.name).join(', ');
  const totalReceived = itemsList.reduce((sum, x) => sum + x.received, 0);
  const totalAccepted = itemsList.reduce((sum, x) => sum + x.accepted, 0);

  return { 
    receipt, 
    po, 
    item: itemNames, 
    received: totalReceived, 
    accepted: totalAccepted,
    items: itemsList
  };
};

// 4. Invoice PDF Parser
export const parseInvoicePdf = (text, fileName) => {
  const cleanText = text.toLowerCase();
  
  // Invoice ID
  const invMatch = text.match(/inv-\d+/i) || text.match(/invoice\s*#?\s*\d+/i);
  const id = invMatch ? invMatch[0].toUpperCase().replace(/\s*#\s*/, '-') : 'INV-' + Math.floor(5400 + Math.random() * 100);
  
  // PO Reference
  const poMatch = text.match(/po-\d+/i) || text.match(/po\s*#?\s*\d+/i);
  const po = poMatch ? poMatch[0].toUpperCase().replace(/\s*#\s*/, '-') : 'PO-88022';
  
  // Invoice Amount
  const amountMatch = text.match(/(?:total\s+due|total\s+amount|amount\s+due|\btotal\b)\s*:?\s*(\$[0-9,]+(\.[0-9]{2})?|\d+,\d{3})/i) ||
                      text.match(/\$[0-9,]+/);
  const amount = amountMatch ? Number((amountMatch[1] || amountMatch[0]).replace(/[^0-9.]/g, '')) : 185000;
  
  // Due Date (default to 14 days from now)
  const now = new Date();
  const submitted = now.toISOString().split('T')[0];
  now.setDate(now.getDate() + 14);
  const due = now.toISOString().split('T')[0];
  
  return { id, po, amount, submitted, due };
};

// 5. Compliance Document PDF Parser
export const parseCompliancePdf = (text, fileName) => {
  const cleanText = text.toLowerCase();
  
  // Certificate ID
  const certMatch = text.match(/cert-\d+/i) || text.match(/iso-\d+/i) || text.match(/\b\d{4,8}-\d{2}\b/);
  const id = certMatch ? certMatch[0].toUpperCase() : 'CERT-' + Math.floor(100000 + Math.random() * 900000);
  
  // Expiry Date (default to 1 year from now)
  const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/) || text.match(/expires\s*:\s*\d{2}\/\d{2}\/\d{4}/i);
  let expiry = '';
  if (dateMatch) {
    expiry = dateMatch[0];
  } else {
    const now = new Date();
    now.setFullYear(now.getFullYear() + 1);
    expiry = now.toISOString().split('T')[0];
  }
  
  // Issuer
  let issuer = 'Global Certification Corp';
  if (cleanText.includes('revenue') || cleanText.includes('tax') || cleanText.includes('irs')) {
    issuer = 'Internal Revenue Service';
  } else if (cleanText.includes('lloyd') || cleanText.includes('quality') || cleanText.includes('intertek')) {
    issuer = 'Intertek Testing Services';
  } else if (cleanText.includes('allianz') || cleanText.includes('insurance')) {
    issuer = 'Allianz Corporate';
  }
  
  // Compliance Type
  let type = 'ISO 9001';
  if (cleanText.includes('tax') || cleanText.includes('w9') || cleanText.includes('w-9')) {
    type = 'Tax Certification';
  } else if (cleanText.includes('insurance') || cleanText.includes('liability')) {
    type = 'Liability Insurance';
  } else if (cleanText.includes('environmental') || cleanText.includes('14001')) {
    type = 'ISO 14001';
  }
  
  return { id, expiry, issuer, type };
};
