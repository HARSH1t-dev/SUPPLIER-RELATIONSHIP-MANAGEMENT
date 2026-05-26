import { TrendingUp, Award, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

const kpiMetrics = [
  { label: 'On-Time Delivery Rate', value: '94.2%', target: '95%', trend: '+1.3%', status: 'Monitor', icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
  { label: 'Order Fulfillment Rate', value: '98.7%', target: '97%', trend: '+0.5%', status: 'Excellent', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Quality Acceptance Rate', value: '96.1%', target: '95%', trend: '+2.1%', status: 'Excellent', icon: Award, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Invoice Accuracy', value: '91.4%', target: '95%', trend: '-0.8%', status: 'Monitor', icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
];

const monthlyTrend = [
  { month: 'Jan', delivery: 92, quality: 94, service: 91 },
  { month: 'Feb', delivery: 91, quality: 95, service: 93 },
  { month: 'Mar', delivery: 93, quality: 96, service: 90 },
  { month: 'Apr', delivery: 94, quality: 96, service: 94 },
  { month: 'May', delivery: 94, quality: 96, service: 95 },
];

const openActions = [
  { id: 'CA-001', issue: 'Delayed shipment on PO-88024', due: 'Jun 5, 2026', priority: 'High' },
  { id: 'CA-002', issue: 'Invoice mismatch on PO-88019', due: 'Jun 10, 2026', priority: 'Medium' },
  { id: 'CA-003', issue: 'Packaging non-conformance – Lot #4412', due: 'Jun 15, 2026', priority: 'Low' },
];

export function SupplierKpiPerformance() {
  return (
    <>
      <PageHeader title="KPI & Performance" description="Track your performance metrics, targets, and improvement actions." />

      {/* KPI metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {kpiMetrics.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 truncate">{kpi.label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{kpi.value}</p>
                <p className="mt-1 text-xs text-slate-400">Target: {kpi.target}</p>
              </div>
              <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">vs last month: <span className="text-slate-700">{kpi.trend}</span></span>
              <StatusBadge status={kpi.status} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2 mb-6">
        {/* Monthly trend table */}
        <Card>
          <CardHeader title="Monthly Performance Trend" subtitle="Your scores across key dimensions" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Month', 'Delivery %', 'Quality %', 'Service %'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map((row, i) => (
                  <tr key={row.month} className={`border-b border-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">{row.month}</td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-600">{row.delivery}%</td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-600">{row.quality}%</td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-600">{row.service}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Corrective actions */}
        <Card>
          <CardHeader title="Open Corrective Actions" subtitle="Items requiring your attention" />
          <div className="divide-y divide-slate-50">
            {openActions.map((action) => (
              <div key={action.id} className="flex items-start gap-4 px-5 py-4">
                <span className="mt-0.5 flex-shrink-0 font-mono text-xs font-bold text-slate-400">{action.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{action.issue}</p>
                  <p className="mt-0.5 text-xs text-slate-400">Due: {action.due}</p>
                </div>
                <StatusBadge status={action.priority} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
