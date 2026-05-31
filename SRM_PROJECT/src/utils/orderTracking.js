export const TIMELINE_STEPS = [
  'PO_CREATED',
  'SUPPLIER_ACCEPTED',
  'PRODUCTION_STARTED',
  'PACKED',
  'DISPATCHED',
  'IN_TRANSIT',
  'DELIVERED',
  'GRN_GENERATED',
  'INVOICE_SUBMITTED',
  'PAYMENT_COMPLETED',
];

const PROGRESS_MAP = {
  PO_CREATED: 10,
  SUPPLIER_ACCEPTED: 20,
  PRODUCTION_STARTED: 35,
  PACKED: 45,
  DISPATCHED: 60,
  IN_TRANSIT: 75,
  DELIVERED: 90,
  GRN_GENERATED: 92,
  INVOICE_SUBMITTED: 96,
  PAYMENT_COMPLETED: 100,
};

const SUPPLIER_FLOW = [
  { from: 'PO_CREATED', action: 'accept', label: 'Accept PO', next: 'SUPPLIER_ACCEPTED' },
  { from: 'SUPPLIER_ACCEPTED', action: 'start_production', label: 'Start Production', next: 'PRODUCTION_STARTED' },
  { from: 'PRODUCTION_STARTED', action: 'mark_packed', label: 'Mark Packed', next: 'PACKED' },
  { from: 'PACKED', action: 'mark_dispatched', label: 'Mark Dispatched', next: 'DISPATCHED' },
  { from: 'DISPATCHED', action: 'mark_in_transit', label: 'Mark In Transit', next: 'IN_TRANSIT' },
  { from: 'IN_TRANSIT', action: 'mark_delivered', label: 'Mark Delivered', next: 'DELIVERED' },
];

export function trackingStatusLabel(status) {
  if (!status) return 'Unknown';
  return status
    .toString()
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function progressForStatus(status) {
  return PROGRESS_MAP[status] ?? 10;
}

export function nextSupplierAction(trackingStatus) {
  const step = SUPPLIER_FLOW.find((s) => s.from === trackingStatus);
  return step ? { action: step.action, label: step.label, status: step.next } : null;
}
