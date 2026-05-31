import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock3, Eye, PackageCheck, Truck } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { OrderProgressBar } from '../../components/OrderTimeline.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { getApiBaseUrl } from '../../utils/apiBase.js';
import { trackingStatusLabel } from '../../utils/orderTracking.js';

export function OrderTracker() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    fetch(`${apiBaseUrl}/order-tracking.php?list=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
          setDemoMode(Boolean(data.demo_mode));
        }
      })
      .catch((err) => console.error('Failed to fetch order tracking:', err))
      .finally(() => setLoading(false));
  }, [apiBaseUrl]);

  const trackerStats = useMemo(() => {
    const inTransit = orders.filter((o) => o.tracking_status === 'IN_TRANSIT' || o.status === 'shipped').length;
    const delayed = orders.filter((o) => ['PO_CREATED', 'pending', 'issued'].includes(o.tracking_status || o.status)).length;
    const totalCount = orders.length;
    const onSchedulePct = totalCount > 0 ? Math.round(((totalCount - delayed) / totalCount) * 100) : 100;

    return [
      { label: 'In Transit', value: String(inTransit), change: 'Active freight', trend: 'up', icon: Truck },
      { label: 'On Schedule', value: `${onSchedulePct}%`, change: 'POs on time', trend: 'up', icon: CheckCircle2 },
      { label: 'Awaiting Action', value: String(delayed), change: 'Early stage POs', trend: 'down', icon: AlertTriangle },
      { label: 'Active Pipeline', value: String(totalCount), change: 'Total tracked orders', trend: 'up', icon: Clock3 },
    ];
  }, [orders]);

  const milestones = useMemo(() => {
    const total = orders.length || 1;
    const pct = (filterFn) => Math.round((orders.filter(filterFn).length / total) * 100);
    return [
      { label: 'PO Released', value: pct((o) => o.progress_percent >= 10) },
      { label: 'Supplier Confirmed', value: pct((o) => o.progress_percent >= 20) },
      { label: 'In Transit', value: pct((o) => o.progress_percent >= 75) },
      { label: 'Received', value: pct((o) => o.progress_percent >= 90) },
      { label: 'Fulfilled', value: pct((o) => o.progress_percent >= 100) },
    ];
  }, [orders]);

  const exceptions = useMemo(
    () => orders.filter((o) => o.status === 'cancelled' || (o.progress_percent ?? 0) <= 20),
    [orders],
  );

  const tableRows = useMemo(
    () =>
      orders.map((o) => ({
        id: o.po_id ?? o.id,
        po_number: o.po_number,
        supplier: o.supplier_name || 'Unknown Supplier',
        stage: trackingStatusLabel(o.tracking_status) || o.status,
        tracking_status: o.tracking_status,
        progress: o.progress_percent ?? 10,
        eta: o.delivery_date || 'N/A',
        tracking_number: o.tracking_number || '—',
        checkpoint: o.latest_checkpoint || '—',
        risk: (o.progress_percent ?? 0) <= 20 ? 'High' : 'Low',
      })),
    [orders],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Tracker"
        description="Track live PO fulfillment progress, logistics carriers, shipment status, and active bottlenecks."
      />

      {demoMode && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Demo tracking data.</strong> Showing seeded purchase orders with live timeline updates via{' '}
          <code className="rounded bg-amber-100 px-1">order-tracking.php</code>.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {trackerStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader title="Fulfillment Tracker" subtitle="Live purchase order movement and delivery checkpoints" />
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : (
          <DataTable
            data={tableRows}
            columns={[
              {
                key: 'po_number',
                header: 'PO Number',
                render: (row) => (
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{row.po_number}</span>
                ),
              },
              { key: 'supplier', header: 'Supplier' },
              {
                key: 'stage',
                header: 'Current Status',
                render: (row) => <StatusBadge status={row.tracking_status || row.stage} />,
              },
              {
                key: 'progress',
                header: 'Progress',
                render: (row) => (
                  <div className="w-44">
                    <OrderProgressBar percent={row.progress} />
                  </div>
                ),
              },
              { key: 'eta', header: 'Expected Delivery' },
              { key: 'tracking_number', header: 'Tracking Number' },
              { key: 'checkpoint', header: 'Latest Checkpoint' },
              { key: 'risk', header: 'Risk', render: (row) => <StatusBadge status={row.risk} /> },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <Link to={`/admin/order-tracker/${row.id}`}>
                    <Button variant="secondary" className="h-8 px-2 text-xs">
                      <Eye className="h-3.5 w-3.5" />
                      View Timeline
                    </Button>
                  </Link>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Card>
        <CardHeader title="Stage Summary" subtitle="How far current orders have moved through the fulfillment process" />
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          {milestones.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                <span className="text-sm font-bold text-slate-950 dark:text-slate-50">{item.value}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-white dark:bg-slate-800">
                <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Exception Queue" subtitle="Orders requiring sourcing follow-up" />
        <div className="grid gap-4 p-5 md:grid-cols-3">
          {exceptions.length > 0 ? (
            exceptions.map((po) => (
              <div
                key={po.po_id ?? po.id}
                className={`rounded-lg border p-4 ${
                  po.status === 'cancelled'
                    ? 'border-rose-100 bg-rose-50/50'
                    : 'border-amber-100 bg-amber-50/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${po.status === 'cancelled' ? 'text-rose-600' : 'text-amber-600'}`} />
                  <span className="text-sm font-bold text-slate-900">
                    {po.po_number} — {trackingStatusLabel(po.tracking_status)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{po.latest_checkpoint}</p>
                <Link
                  to={`/admin/order-tracker/${po.po_id ?? po.id}`}
                  className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
                >
                  View timeline
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-3 flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
              <PackageCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-900">0 orders currently delayed</p>
                <p className="text-xs text-slate-600">All purchase order pipelines are running smoothly.</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
