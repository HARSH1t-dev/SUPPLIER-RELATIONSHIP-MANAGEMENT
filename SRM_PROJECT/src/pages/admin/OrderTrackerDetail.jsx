import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Truck } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { OrderProgressBar, OrderTimeline } from '../../components/OrderTimeline.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { currency } from '../../utils/formatters.js';
import { getApiBaseUrl } from '../../utils/apiBase.js';
import { trackingStatusLabel } from '../../utils/orderTracking.js';

export function OrderTrackerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${apiBaseUrl}/order-tracking.php?po_id=${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json);
      })
      .catch((err) => console.error('Failed to load order timeline:', err))
      .finally(() => setLoading(false));
  }, [apiBaseUrl, id]);

  const order = data?.order;

  return (
    <div className="space-y-6">
      <PageHeader
        title={order ? `PO ${order.po_number}` : 'Order timeline'}
        description="Order information, supplier details, progress, and fulfillment history."
        action={
          <Link to="/admin/order-tracker">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back to tracker
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : !order ? (
        <Card className="p-6 text-sm text-rose-600">Order not found.</Card>
      ) : (
        <>
          <Card className="p-5">
            <OrderProgressBar
              percent={order.progress_percent}
              label={`${trackingStatusLabel(order.tracking_status)} — ${order.progress_percent}% complete`}
            />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Order info" subtitle="Purchase order summary" />
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {[
                  ['PO Number', order.po_number],
                  ['Status', trackingStatusLabel(order.tracking_status)],
                  ['Amount', currency(order.total_amount)],
                  ['Order date', order.order_date?.split(' ')[0] || '—'],
                  ['Expected delivery', order.delivery_date || '—'],
                  ['Tracking #', order.tracking_number || '—'],
                  ['RFQ', order.rfq_title || order.rfq_number || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">
                    <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {label === 'Status' ? <StatusBadge status={order.tracking_status} /> : value}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Supplier info" subtitle="Fulfillment partner" />
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                    <Truck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{order.supplier_name}</p>
                    <p className="text-xs text-slate-500">{order.supplier_email}</p>
                  </div>
                </div>
                {order.supplier_phone && (
                  <p className="text-sm text-slate-600">Phone: {order.supplier_phone}</p>
                )}
                <p className="text-sm text-slate-600">{order.latest_checkpoint}</p>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Fulfillment timeline" subtitle="Generated from order tracking events" />
            <div className="p-5">
              <OrderTimeline timeline={data.timeline || []} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Tracking history" subtitle="Chronological event log" />
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(data.events || []).map((event) => (
                <div key={event.id ?? `${event.status}-${event.created_at}`} className="flex gap-4 p-4">
                  <StatusBadge status={event.status} />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{event.description}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {event.created_at}
                      {event.updated_by_name ? ` · ${event.updated_by_name}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
