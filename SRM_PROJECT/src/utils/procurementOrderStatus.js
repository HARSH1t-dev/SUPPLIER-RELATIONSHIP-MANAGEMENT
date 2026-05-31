import { progressForStatus, TIMELINE_STEPS, trackingStatusLabel } from './orderTracking.js';

/** Consumer-facing labels (Amazon-style order history wording) */
export const FULFILLMENT_LABELS = {
  PO_CREATED: 'PO generated',
  SUPPLIER_ACCEPTED: 'Order confirmed',
  PRODUCTION_STARTED: 'Processing',
  PACKED: 'Packed',
  DISPATCHED: 'Shipped',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
  GRN_GENERATED: 'Goods received',
  INVOICE_SUBMITTED: 'Invoice submitted',
  PAYMENT_COMPLETED: 'Completed',
};

export const STATUS_TABS = [
  { id: 'all', label: 'All orders' },
  { id: 'po_generated', label: 'PO generated' },
  { id: 'in_progress', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'completed', label: 'Completed' },
];

const TAB_STATUS_MAP = {
  po_generated: ['PO_CREATED'],
  in_progress: ['SUPPLIER_ACCEPTED', 'PRODUCTION_STARTED', 'PACKED'],
  shipped: ['DISPATCHED', 'IN_TRANSIT'],
  delivered: ['DELIVERED', 'GRN_GENERATED'],
  completed: ['INVOICE_SUBMITTED', 'PAYMENT_COMPLETED'],
};

export function fulfillmentLabel(trackingStatus) {
  return FULFILLMENT_LABELS[trackingStatus] || trackingStatusLabel(trackingStatus);
}

export function matchesStatusTab(trackingStatus, tabId) {
  if (!tabId || tabId === 'all') return true;
  const allowed = TAB_STATUS_MAP[tabId];
  return allowed ? allowed.includes(trackingStatus) : true;
}

export function buildMiniTimeline(trackingStatus) {
  const currentIdx = TIMELINE_STEPS.indexOf(trackingStatus);
  const idx = currentIdx >= 0 ? currentIdx : 0;

  return TIMELINE_STEPS.map((step, stepIdx) => {
    let state = 'pending';
    if (stepIdx < idx) state = 'completed';
    else if (stepIdx === idx) state = 'active';
    return {
      status: step,
      label: FULFILLMENT_LABELS[step] || trackingStatusLabel(step),
      state,
    };
  });
}

export function progressPercent(trackingStatus) {
  return progressForStatus(trackingStatus);
}
