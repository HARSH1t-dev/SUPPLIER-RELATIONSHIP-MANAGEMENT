import { AlertTriangle, CheckCircle2, Clock3, PackageCheck, Truck } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

const trackerStats = [
  { label: 'In Transit', value: '12', change: '4 due this week', trend: 'up', icon: Truck },
  { label: 'On Schedule', value: '86%', change: '+6%', trend: 'up', icon: CheckCircle2 },
  { label: 'Delayed', value: '3', change: 'Needs action', trend: 'down', icon: AlertTriangle },
  { label: 'Avg Cycle Time', value: '8.4d', change: '-1.2d', trend: 'up', icon: Clock3 },
];

const trackedOrders = [
  {
    id: 'PO-88021',
    supplier: 'Apex Industrial Components',
    stage: 'In Transit',
    progress: 68,
    eta: '2026-05-28',
    carrier: 'DHL Freight',
    checkpoint: 'Departed regional hub',
    risk: 'Low',
  },
  {
    id: 'PO-88022',
    supplier: 'Northstar Logistics',
    stage: 'Delivered',
    progress: 100,
    eta: '2026-05-22',
    carrier: 'Northstar Fleet',
    checkpoint: 'Goods received',
    risk: 'Low',
  },
  {
    id: 'PO-88023',
    supplier: 'Vector Packaging Co.',
    stage: 'Pending Pickup',
    progress: 32,
    eta: '2026-06-01',
    carrier: 'FedEx Supply Chain',
    checkpoint: 'Awaiting dispatch confirmation',
    risk: 'Medium',
  },
  {
    id: 'PO-88024',
    supplier: 'Helio Energy Systems',
    stage: 'Exception',
    progress: 46,
    eta: '2026-05-25',
    carrier: 'BlueDart Express',
    checkpoint: 'Customs documentation mismatch',
    risk: 'High',
  },
];

const milestones = [
  { label: 'PO Released', value: 100 },
  { label: 'Supplier Confirmed', value: 92 },
  { label: 'Picked Up', value: 74 },
  { label: 'In Transit', value: 68 },
  { label: 'Received', value: 41 },
];

export function OrderTracker() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Tracker"
        description="Track PO fulfillment, shipment checkpoints, delivery risk, and exception status."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {trackerStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader title="Fulfillment Tracker" subtitle="Live purchase order movement and delivery checkpoints" />
        <DataTable
          data={trackedOrders}
          columns={[
            { key: 'id', header: 'PO Number' },
            { key: 'supplier', header: 'Supplier' },
            { key: 'stage', header: 'Stage', render: (row) => <StatusBadge status={row.stage} /> },
            {
              key: 'progress',
              header: 'Progress',
              render: (row) => (
                <div className="w-44">
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${row.progress}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{row.progress}% complete</p>
                </div>
              ),
            },
            { key: 'eta', header: 'ETA' },
            { key: 'checkpoint', header: 'Latest Checkpoint' },
            { key: 'risk', header: 'Risk', render: (row) => <StatusBadge status={row.risk} /> },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Stage Summary" subtitle="How far current orders have moved through the fulfillment process" />
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          {milestones.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                <span className="text-sm font-bold text-slate-950">{item.value}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-white">
                <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Exception Queue" subtitle="Orders requiring procurement follow-up" />
        <div className="grid gap-4 p-5 md:grid-cols-3">
          <div className="rounded-lg border border-rose-100 bg-rose-50 p-4">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <p className="mt-3 text-sm font-bold text-rose-900">PO-88024 documentation mismatch</p>
            <p className="mt-1 text-sm leading-6 text-rose-700">Carrier requires updated customs paperwork before delivery can resume.</p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <Clock3 className="h-5 w-5 text-amber-600" />
            <p className="mt-3 text-sm font-bold text-amber-900">PO-88023 pickup pending</p>
            <p className="mt-1 text-sm leading-6 text-amber-700">Supplier has not confirmed pickup slot. Follow up before ETA is affected.</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <PackageCheck className="h-5 w-5 text-emerald-600" />
            <p className="mt-3 text-sm font-bold text-emerald-900">12 orders on track</p>
            <p className="mt-1 text-sm leading-6 text-emerald-700">No action needed for orders with confirmed carrier checkpoints.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
