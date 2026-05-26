import { MessageSquare, FileText, ShoppingCart, Bell, CheckCircle, Clock } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

const feedItems = [
  {
    id: 1,
    type: 'rfq',
    icon: FileText,
    iconColor: 'text-violet-600 bg-violet-50',
    title: 'New RFQ invitation received',
    detail: 'Precision CNC Aluminum Housings — deadline Jun 10, 2026',
    time: '12 min ago',
    status: 'Open',
    action: 'View RFQ',
  },
  {
    id: 2,
    type: 'order',
    icon: ShoppingCart,
    iconColor: 'text-blue-600 bg-blue-50',
    title: 'PO-88021 shipment document requested',
    detail: 'Apex Industrial Components needs your shipping docs before Jun 3',
    time: '1 hr ago',
    status: 'Pending',
    action: 'Upload Docs',
  },
  {
    id: 3,
    type: 'review',
    icon: CheckCircle,
    iconColor: 'text-emerald-600 bg-emerald-50',
    title: 'Quarterly scorecard approved',
    detail: 'Your Q1 2026 performance scorecard has been reviewed and approved',
    time: '2 hr ago',
    status: 'Approved',
    action: 'View Scorecard',
  },
  {
    id: 4,
    type: 'bid',
    icon: FileText,
    iconColor: 'text-cyan-600 bg-cyan-50',
    title: 'Bid submitted — RFQ-24055',
    detail: 'Your bid for Industrial Fasteners Bulk Supply is under evaluation',
    time: '5 hr ago',
    status: 'Evaluating',
    action: 'Track Bid',
  },
  {
    id: 5,
    type: 'order',
    icon: Clock,
    iconColor: 'text-amber-600 bg-amber-50',
    title: 'PO-88018 delivery overdue',
    detail: 'Expected delivery was May 20 — please update shipment status',
    time: 'Yesterday',
    status: 'Exception',
    action: 'Update Status',
  },
  {
    id: 6,
    type: 'message',
    icon: MessageSquare,
    iconColor: 'text-slate-600 bg-slate-100',
    title: 'Message from Northstar Logistics',
    detail: 'Re: packaging specification clarification for Order #88024',
    time: 'Yesterday',
    status: 'Review',
    action: 'Reply',
  },
];

const quickStats = [
  { label: 'Unread activities', value: '4', color: 'text-violet-600' },
  { label: 'Pending actions', value: '2', color: 'text-amber-600' },
  { label: 'Open RFQs', value: '3', color: 'text-blue-600' },
];

export function WorkspaceFeed() {
  return (
    <>
      <PageHeader title="Workspace Feed" description="Your activity feed — recent events, actions, and collaboration updates." />

      <div className="mb-6 flex gap-4">
        {quickStats.map((s) => (
          <Card key={s.label} className="flex-1 p-4 flex items-center gap-3">
            <span className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</span>
            <span className="text-sm text-slate-500">{s.label}</span>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Recent Activity" subtitle="All events across your sourcing, orders, and performance workspace" />
        <div className="divide-y divide-slate-50">
          {feedItems.map((item) => (
            <div key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
              <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${item.iconColor}`}>
                <item.icon className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="mt-0.5 text-sm text-slate-500 leading-relaxed">{item.detail}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-xs text-slate-400">{item.time}</span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
              <button className="flex-shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                {item.action}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
