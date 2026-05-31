const styles = {
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Excellent: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Open: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'In Transit': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Evaluating: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  Onboarding: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  Draft: 'bg-slate-100 text-slate-700 ring-slate-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Review: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Inspection: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Strong: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Monitor: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Exception: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Variance: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Low: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  High: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  // New Proposal & Negotiation statuses
  Submitted: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  submitted: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'Under Review': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  under_review: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Awarded: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  awarded: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  shortlisted: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  Shortlisted: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  approved_for_bidding: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Approved For Bidding': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Compliant: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Non-Compliant': 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Partial: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Unknown: 'bg-slate-100 text-slate-700 ring-slate-600/20',
  'Under Negotiation': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  under_negotiation: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Countered: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  countered: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Finalized: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  finalized: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PO_CREATED: 'bg-slate-100 text-slate-700 ring-slate-600/20',
  SUPPLIER_ACCEPTED: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  PRODUCTION_STARTED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  PACKED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  DISPATCHED: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  IN_TRANSIT: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  GRN_GENERATED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  INVOICE_SUBMITTED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  PAYMENT_COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  issued: 'bg-slate-100 text-slate-700 ring-slate-600/20',
  shipped: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  fulfilled: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  'PO generated': 'bg-slate-100 text-slate-700 ring-slate-600/20',
  'Order confirmed': 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  Processing: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Packed: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  Shipped: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  'In transit': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Goods received': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Invoice submitted': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

function formatStatusLabel(status) {
  if (!status) return 'Unknown';
  if (String(status).includes('_')) {
    return String(status)
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return status;
}

export function StatusBadge({ status }) {
  const label = formatStatusLabel(status);
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status] || styles.Draft}`}>
      {label}
    </span>
  );
}
