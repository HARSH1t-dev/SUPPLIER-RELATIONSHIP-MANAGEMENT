import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, PackageCheck, Truck } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

export function OrderTracker() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  useEffect(() => {
    fetch(`${apiBaseUrl}/purchase_orders.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.purchase_orders)) {
          setPurchaseOrders(data.purchase_orders);
        }
      })
      .catch((err) => console.error('Failed to fetch POs for tracker:', err))
      .finally(() => setLoading(false));
  }, []);

  const trackedOrders = useMemo(() => {
    return purchaseOrders.map((po) => {
      let progress = 20;
      let checkpoint = 'PO Released & Issued';
      let risk = 'Low';
      let carrier = 'Tata Motors Logistics';

      // Carrier based on supplier name
      if (po.supplier_name.includes('Apex')) {
        carrier = 'DHL Freight';
      } else if (po.supplier_name.includes('Vector')) {
        carrier = 'FedEx Supply Chain';
      } else if (po.supplier_name.includes('Northstar')) {
        carrier = 'Northstar Fleet';
      }

      switch (po.status) {
        case 'issued':
          progress = 20;
          checkpoint = 'Awaiting carrier dispatch';
          risk = 'Low';
          break;
        case 'pending':
          progress = 20;
          checkpoint = 'Awaiting administrative clearance';
          risk = 'High';
          break;
        case 'shipped':
          progress = 60;
          checkpoint = 'In Transit - departed regional hub';
          risk = 'Low';
          break;
        case 'delivered':
          progress = 85;
          checkpoint = 'Delivered to gate, pending inspection';
          risk = 'Low';
          break;
        case 'fulfilled':
          progress = 100;
          checkpoint = 'Goods received & approved';
          risk = 'Low';
          break;
        case 'cancelled':
          progress = 0;
          checkpoint = 'Order cancelled';
          risk = 'High';
          break;
      }

      return {
        id: po.po_number,
        supplier: po.supplier_name,
        stage: po.status.toUpperCase(),
        progress,
        eta: po.delivery_date || 'N/A',
        carrier,
        checkpoint,
        risk: risk === 'High' ? 'High' : 'Low',
      };
    });
  }, [purchaseOrders]);

  const trackerStats = useMemo(() => {
    const inTransit = purchaseOrders.filter(po => po.status === 'shipped').length;
    const delayed = purchaseOrders.filter(po => po.status === 'pending').length;
    const totalCount = purchaseOrders.length;
    
    // Percentage on schedule (not pending/delayed)
    const onSchedulePct = totalCount > 0 
      ? Math.round(((totalCount - delayed) / totalCount) * 100) 
      : 100;

    return [
      { label: 'In Transit', value: String(inTransit), change: 'Active freight', trend: 'up', icon: Truck },
      { label: 'On Schedule', value: `${onSchedulePct}%`, change: 'POs on time', trend: 'up', icon: CheckCircle2 },
      { label: 'Delayed / Hold', value: String(delayed), change: 'Requires resolution', trend: 'down', icon: AlertTriangle },
      { label: 'Active Pipeline', value: String(totalCount), change: 'Total tracked orders', trend: 'up', icon: Clock3 },
    ];
  }, [purchaseOrders]);

  const milestones = useMemo(() => {
    const total = purchaseOrders.length || 1;
    const released = purchaseOrders.filter(po => ['issued', 'pending', 'shipped', 'delivered', 'fulfilled'].includes(po.status)).length;
    const confirmed = purchaseOrders.filter(po => ['shipped', 'delivered', 'fulfilled'].includes(po.status)).length;
    const transit = purchaseOrders.filter(po => ['shipped', 'delivered', 'fulfilled'].includes(po.status)).length;
    const received = purchaseOrders.filter(po => ['delivered', 'fulfilled'].includes(po.status)).length;
    const approved = purchaseOrders.filter(po => po.status === 'fulfilled').length;

    return [
      { label: 'PO Released', value: Math.round((released / total) * 100) },
      { label: 'Supplier Confirmed', value: Math.round((confirmed / total) * 100) },
      { label: 'In Transit', value: Math.round((transit / total) * 100) },
      { label: 'Received', value: Math.round((received / total) * 100) },
      { label: 'Fulfilled', value: Math.round((approved / total) * 100) },
    ];
  }, [purchaseOrders]);

  const exceptions = useMemo(() => {
    return purchaseOrders.filter(po => po.status === 'pending' || po.status === 'cancelled');
  }, [purchaseOrders]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Tracker"
        description="Track live PO fulfillment progress, logistics carriers, shipment status, and active bottlenecks."
      />

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
            data={trackedOrders}
            columns={[
              { key: 'id', header: 'PO Number', render: (row) => <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{row.id}</span> },
              { key: 'supplier', header: 'Supplier' },
              { key: 'stage', header: 'Stage', render: (row) => <StatusBadge status={row.stage.toLowerCase()} /> },
              {
                key: 'progress',
                header: 'Progress',
                render: (row) => (
                  <div className="w-44">
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${row.progress}%` }} />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{row.progress}% complete</p>
                  </div>
                ),
              },
              { key: 'eta', header: 'ETA' },
              { key: 'carrier', header: 'Carrier' },
              { key: 'checkpoint', header: 'Latest Checkpoint' },
              { key: 'risk', header: 'Risk', render: (row) => <StatusBadge status={row.risk} /> },
            ]}
          />
        )}
      </Card>

      <Card>
        <CardHeader title="Stage Summary" subtitle="How far current orders have moved through the fulfillment process" />
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          {milestones.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 animate-in fade-in duration-200">
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
                key={po.id} 
                className={`rounded-lg border p-4 ${po.status === 'cancelled' ? 'border-rose-100 bg-rose-50/50 dark:border-rose-950/20 dark:bg-rose-950/10' : 'border-amber-100 bg-amber-50/50 dark:border-amber-950/20 dark:bg-amber-950/10'}`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${po.status === 'cancelled' ? 'text-rose-600' : 'text-amber-600'}`} />
                  <span className={`text-sm font-bold ${po.status === 'cancelled' ? 'text-rose-900 dark:text-rose-400' : 'text-amber-900 dark:text-amber-400'}`}>{po.po_number} - {po.status.toUpperCase()}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                  {po.status === 'cancelled' 
                    ? `This Purchase Order with ${po.supplier_name} was formally cancelled and is legally void.` 
                    : `This PO is currently on hold. Contact sourcing or supplier manager to resolve the administrative bottleneck.`
                  }
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-3 rounded-lg border border-emerald-100 bg-emerald-50/50 dark:border-emerald-950/20 dark:bg-emerald-950/10 p-4 flex items-center gap-3">
              <PackageCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">0 orders currently delayed</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">All purchase order pipelines are running smoothly.</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
