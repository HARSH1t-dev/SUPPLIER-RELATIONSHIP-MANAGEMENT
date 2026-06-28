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
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status] || styles.Draft}`}>
      {status}
    </span>
  );
}
