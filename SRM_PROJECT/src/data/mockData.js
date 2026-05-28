export const adminStats = [
  { label: 'Managed Spend', value: '₹24.8M', change: '+12.4%', trend: 'up' },
  { label: 'Active Suppliers', value: '1,284', change: '+8.1%', trend: 'up' },
  { label: 'Open RFQs', value: '76', change: '-4.2%', trend: 'down' },
  { label: 'On-time Delivery', value: '94.6%', change: '+2.8%', trend: 'up' },
];

export const supplierStats = [
  { label: 'Open RFQs', value: '18', change: '+5 new', trend: 'up' },
  { label: 'Active Orders', value: '42', change: '₹840K', trend: 'up' },
  { label: 'Submitted Bids', value: '31', change: '64% win rate', trend: 'up' },
  { label: 'Rating', value: '4.8', change: '+0.2', trend: 'up' },
];

export const procurementSpend = [
  { month: 'Jan', direct: 2.4, indirect: 1.4, services: 0.8 },
  { month: 'Feb', direct: 2.9, indirect: 1.7, services: 1.0 },
  { month: 'Mar', direct: 3.1, indirect: 1.6, services: 1.2 },
  { month: 'Apr', direct: 3.6, indirect: 1.8, services: 1.4 },
  { month: 'May', direct: 3.8, indirect: 2.0, services: 1.5 },
  { month: 'Jun', direct: 4.2, indirect: 2.2, services: 1.8 },
];

export const rfqActivity = [
  { name: 'Draft', value: 18 },
  { name: 'Open', value: 34 },
  { name: 'Evaluating', value: 14 },
  { name: 'Awarded', value: 22 },
];

export const orderSummary = [
  { week: 'W1', created: 42, fulfilled: 31 },
  { week: 'W2', created: 48, fulfilled: 43 },
  { week: 'W3', created: 51, fulfilled: 46 },
  { week: 'W4', created: 57, fulfilled: 52 },
];

export const suppliers = [
  {
    id: 'SUP-1001',
    name: 'Apex Industrial Components',
    category: 'Mechanical Parts',
    region: 'North America',
    rating: 4.8,
    risk: 'Low',
    status: 'Approved',
    spend: 2450000,
    contact: 'Maya Chen',
  },
  {
    id: 'SUP-1002',
    name: 'Vector Packaging Co.',
    category: 'Packaging',
    region: 'Europe',
    rating: 4.4,
    risk: 'Medium',
    status: 'Onboarding',
    spend: 1180000,
    contact: 'Elias Romero',
  },
  {
    id: 'SUP-1003',
    name: 'Northstar Logistics',
    category: 'Logistics',
    region: 'APAC',
    rating: 4.6,
    risk: 'Low',
    status: 'Approved',
    spend: 3890000,
    contact: 'Priya Nair',
  },
    {
      id: 'SUP-1004',
      name: 'Helio Energy Systems',
      category: 'Energy',
      region: 'Middle East',
    rating: 4.1,
    risk: 'High',
    status: 'Review',
      spend: 970000,
      contact: 'Jonas Weber',
    },
    {
      id: 'SUP-1005',
      name: 'Summit Precision Tools',
      category: 'Tooling',
      region: 'North America',
      rating: 4.7,
      risk: 'Low',
      status: 'Approved',
      spend: 1640000,
      contact: 'Olivia Grant',
    },
    {
      id: 'SUP-1006',
      name: 'BlueRiver Electronics',
      category: 'Electrical',
      region: 'APAC',
      rating: 4.3,
      risk: 'Medium',
      status: 'Approved',
      spend: 2210000,
      contact: 'Kenji Sato',
    },
    {
      id: 'SUP-1007',
      name: 'Greenline Facility Services',
      category: 'Facilities',
      region: 'Europe',
      rating: 4.2,
      risk: 'Medium',
      status: 'Review',
      spend: 760000,
      contact: 'Nora Klein',
    },
    {
      id: 'SUP-1008',
      name: 'Metro Freight Partners',
      category: 'Logistics',
      region: 'North America',
      rating: 4.5,
      risk: 'Low',
      status: 'Approved',
      spend: 3120000,
      contact: 'Diego Alvarez',
    },
    {
      id: 'SUP-1009',
      name: 'Prime Polymer Works',
      category: 'Raw Materials',
      region: 'APAC',
      rating: 4.0,
      risk: 'High',
      status: 'Onboarding',
      spend: 890000,
      contact: 'Anika Rao',
    },
    {
      id: 'SUP-1010',
      name: 'Cobalt Safety Systems',
      category: 'Safety',
      region: 'Europe',
      rating: 4.6,
      risk: 'Low',
      status: 'Approved',
      spend: 1340000,
      contact: 'Marc Dubois',
    },
    {
      id: 'SUP-1011',
      name: 'Orion Maintenance Group',
      category: 'Services',
      region: 'Middle East',
      rating: 4.1,
      risk: 'Medium',
      status: 'Review',
      spend: 540000,
      contact: 'Samir Haddad',
    },
    {
      id: 'SUP-1012',
      name: 'Silverline Packaging',
      category: 'Packaging',
      region: 'APAC',
      rating: 4.5,
      risk: 'Low',
      status: 'Approved',
      spend: 1510000,
      contact: 'Mei Lin',
    },
    {
      id: 'SUP-1013',
      name: 'Atlas Industrial Pumps',
      category: 'Mechanical Parts',
      region: 'North America',
      rating: 4.2,
      risk: 'Medium',
      status: 'Onboarding',
      spend: 1990000,
      contact: 'Harper Cole',
    },
    {
      id: 'SUP-1014',
      name: 'Nova Cleanroom Supply',
      category: 'Facilities',
      region: 'Europe',
      rating: 4.7,
      risk: 'Low',
      status: 'Approved',
      spend: 820000,
      contact: 'Elena Rossi',
    },
    {
      id: 'SUP-1015',
      name: 'RapidRoute Carriers',
      category: 'Logistics',
      region: 'APAC',
      rating: 4.3,
      risk: 'Medium',
      status: 'Approved',
      spend: 2760000,
      contact: 'Arjun Menon',
    },
    {
      id: 'SUP-1016',
      name: 'Vertex Energy Controls',
      category: 'Energy',
      region: 'Middle East',
      rating: 4.4,
      risk: 'Low',
      status: 'Approved',
      spend: 1880000,
      contact: 'Leah Stone',
    },
  ];

export const products = [
  { sku: 'PRD-4401', name: 'Hydraulic Valve Assembly', category: 'Mechanical', inventory: 420, price: 285, status: 'Active' },
  { sku: 'PRD-4402', name: 'Sterile Packaging Film', category: 'Packaging', inventory: 12800, price: 8, status: 'Active' },
  { sku: 'PRD-4403', name: 'Lithium Backup Module', category: 'Electrical', inventory: 240, price: 940, status: 'Review' },
  { sku: 'PRD-4404', name: 'Freight Consolidation Lane', category: 'Logistics', inventory: 72, price: 1650, status: 'Active' },
];

export const rfqs = [
  { id: 'RFQ-24061', title: 'Precision CNC Aluminum Housings', category: 'Manufacturing', deadline: '2026-06-05', bids: 9, status: 'Open', value: 740000 },
  { id: 'RFQ-24062', title: 'Multi-region Freight Forwarding', category: 'Logistics', deadline: '2026-06-12', bids: 6, status: 'Evaluating', value: 1280000 },
  { id: 'RFQ-24063', title: 'Cleanroom Consumables Supply', category: 'Facilities', deadline: '2026-06-18', bids: 3, status: 'Draft', value: 420000 },
  { id: 'RFQ-24064', title: 'Solar Inverter Maintenance', category: 'Services', deadline: '2026-05-30', bids: 11, status: 'Open', value: 360000 },
];

export const bids = [
  { supplier: 'Apex Industrial Components', price: 718000, delivery: '21 days', rating: 4.8, warranty: '24 months', score: 96, best: true },
  { supplier: 'Vector Packaging Co.', price: 742500, delivery: '24 days', rating: 4.4, warranty: '18 months', score: 88, best: false },
  { supplier: 'Northstar Logistics', price: 726800, delivery: '28 days', rating: 4.6, warranty: '24 months', score: 91, best: false },
  { supplier: 'Helio Energy Systems', price: 755000, delivery: '20 days', rating: 4.1, warranty: '12 months', score: 84, best: false },
];

export const purchaseOrders = [
  { id: 'PO-88021', supplier: 'Apex Industrial Components', amount: 218000, status: 'In Transit', due: '2026-05-28' },
  { id: 'PO-88022', supplier: 'Northstar Logistics', amount: 650000, status: 'Delivered', due: '2026-05-22' },
  { id: 'PO-88023', supplier: 'Vector Packaging Co.', amount: 92000, status: 'Pending', due: '2026-06-01' },
  { id: 'PO-88024', supplier: 'Helio Energy Systems', amount: 148000, status: 'Exception', due: '2026-05-25' },
];

export const receiving = [
  { receipt: 'GR-3141', po: 'PO-88021', item: 'Hydraulic Valve Assembly', received: 120, accepted: 118, status: 'Inspection' },
  { receipt: 'GR-3142', po: 'PO-88022', item: 'Freight Lane Service', received: 1, accepted: 1, status: 'Accepted' },
  { receipt: 'GR-3143', po: 'PO-88023', item: 'Sterile Packaging Film', received: 5400, accepted: 5320, status: 'Variance' },
];

export const reviews = [
  { supplier: 'Apex Industrial Components', quality: 98, delivery: 96, service: 94, status: 'Excellent' },
  { supplier: 'Northstar Logistics', quality: 91, delivery: 95, service: 89, status: 'Strong' },
  { supplier: 'Vector Packaging Co.', quality: 88, delivery: 84, service: 90, status: 'Monitor' },
];

export const activity = [
  { event: 'RFQ-24061 received 3 new bids', owner: 'Sourcing Team', time: '12 min ago', status: 'Open' },
  { event: 'PO-88024 flagged for late shipment', owner: 'Operations', time: '48 min ago', status: 'Exception' },
  { event: 'Apex supplier scorecard approved', owner: 'Compliance', time: '2 hr ago', status: 'Approved' },
  { event: 'Cleanroom consumables RFQ moved to draft', owner: 'Facilities', time: '4 hr ago', status: 'Draft' },
];

export const notifications = [
  'New RFQ invitation: Precision CNC Aluminum Housings',
  'PO-88021 shipment document requested',
  'Quarterly scorecard available for review',
];
