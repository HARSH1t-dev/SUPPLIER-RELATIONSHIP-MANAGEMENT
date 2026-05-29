import { useState } from 'react';
import { BarChart3, Star, Users, AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

const supplierScores = [
  { supplier: 'Apex Industrial Components', category: 'Electrical', quality: 98, delivery: 96, service: 94, compliance: 97, overall: 'Excellent', risk: 'Low' },
  { supplier: 'Northstar Logistics', category: 'Logistics', quality: 91, delivery: 95, service: 89, compliance: 93, overall: 'Strong', risk: 'Low' },
  { supplier: 'Vector Packaging Co.', category: 'Packaging', quality: 88, delivery: 84, service: 90, compliance: 85, overall: 'Monitor', risk: 'Medium' },
  { supplier: 'Delta Precision Parts', category: 'Mechanical', quality: 76, delivery: 78, service: 80, compliance: 74, overall: 'Exception', risk: 'High' },
];

const pendingReviews = [
  { id: 'REV-501', supplier: 'Apex Industrial Components', po: 'PO-88021', received: 'May 20, 2026', dueBy: 'Jun 3, 2026' },
  { id: 'REV-502', supplier: 'Vector Packaging Co.', po: 'PO-88024', received: 'May 22, 2026', dueBy: 'Jun 5, 2026' },
  { id: 'REV-503', supplier: 'Northstar Logistics', po: 'PO-88027', received: 'May 24, 2026', dueBy: 'Jun 7, 2026' },
];

const riskFlags = [
  { supplier: 'Delta Precision Parts', flag: 'Quality score below threshold (76)', severity: 'High', action: 'Initiate corrective action plan' },
  { supplier: 'Vector Packaging Co.', flag: 'Delivery rate dropped 6% this quarter', severity: 'Medium', action: 'Schedule supplier review meeting' },
];

const summaryStats = [
  { label: 'Suppliers Evaluated', value: '4', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { label: 'Avg. Quality Score', value: '88.3', icon: Star, color: 'text-amber-600 bg-amber-50' },
  { label: 'Pending Reviews', value: '3', icon: BarChart3, color: 'text-violet-600 bg-violet-50' },
  { label: 'At-Risk Suppliers', value: '2', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
];

export function Reviews() {
  const [activeTab, setActiveTab] = useState('scorecards');

  return (
    <>
      <PageHeader title="Supplier Reviews" description="Evaluate supplier performance, manage scorecards, and track compliance." />

      {/* Summary stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((s) => (
          <Card key={s.label} className="p-5 flex items-center gap-4">
            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold tabular-nums text-slate-950">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        {[['scorecards', 'Performance Scorecards'], ['pending', 'Pending Reviews'], ['risk', 'Risk Flags']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'scorecards' && (
        <Card>
          <CardHeader title="Performance Scorecards" subtitle="Quarterly review cycle — all strategic suppliers" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Supplier', 'Category', 'Quality', 'Delivery', 'Service', 'Compliance', 'Overall', 'Risk'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {supplierScores.map((row, i) => (
                  <tr key={row.supplier} className={`border-b border-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                    <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">{row.supplier}</td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{row.category}</td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-600">{row.quality}</td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-600">{row.delivery}</td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-600">{row.service}</td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-600">{row.compliance}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={row.overall} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={row.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'pending' && (
        <Card>
          <CardHeader title="Pending Reviews" subtitle="Deliveries awaiting your evaluation" />
          <div className="divide-y divide-slate-50">
            {pendingReviews.map((rev) => (
              <div key={rev.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{rev.supplier}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{rev.po} · Received {rev.received}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">Due by <span className="font-semibold text-slate-700">{rev.dueBy}</span></span>
                  <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700">
                    Submit Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'risk' && (
        <Card>
          <CardHeader title="Risk Flags" subtitle="Suppliers requiring immediate attention or corrective action" />
          <div className="divide-y divide-slate-50">
            {riskFlags.map((flag) => (
              <div key={flag.supplier} className="px-5 py-4 flex flex-wrap items-start gap-4 justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-slate-800">{flag.supplier}</p>
                    <StatusBadge status={flag.severity} />
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">{flag.flag}</p>
                  <p className="mt-1 text-xs text-slate-400">Recommended: {flag.action}</p>
                </div>
                <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                  Take Action
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
