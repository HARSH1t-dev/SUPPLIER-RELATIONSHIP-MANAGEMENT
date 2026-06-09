import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Inbox, Truck, ReceiptText, Star, Clock, 
  TrendingUp, ArrowRight, ShieldCheck, AlertCircle, FileCheck
} from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { currency } from '../../utils/formatters.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';

export function SupplierDashboard() {
  const [stats, setStats] = useState({
    openRfqs: 2,
    activeOrders: 3,
    pendingPayments: 310000,
    performanceScore: 96,
    ordersReadyForInvoicing: 2
  });

  const [orders, setOrders] = useState([
    { id: '1', po_number: 'PO-88021', status: 'delivered', total_amount: 218000 },
    { id: '2', po_number: 'PO-88022', status: 'shipped', total_amount: 650000 },
    { id: '3', po_number: 'PO-88023', status: 'issued', total_amount: 92000 }
  ]);

  const [invoices, setInvoices] = useState([
    { id: 'INV-5401', po: 'PO-88021', amount: 218000, status: 'Submitted' },
    { id: 'INV-5402', po: 'PO-88022', amount: 650000, status: 'Approved' },
    { id: 'INV-5398', po: 'PO-87991', amount: 184000, status: 'Paid' }
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Bid accepted for Sourcing Solder Fasteners RFQ-24049', time: '1 hr ago' },
    { id: 2, text: 'Purchase Order PO-2026-0011 issued to your account', time: '3 hrs ago' },
    { id: 3, text: 'Invoice INV-5402 approved for payment clearance', time: '1 day ago' },
    { id: 4, text: 'Outbound payment completed for INV-5398 (Net 30 terms)', time: '2 days ago' }
  ]);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  useEffect(() => {
    // Attempt dynamic data retrieval
    Promise.all([
      fetch(`${apiBaseUrl}/rfqs.php`).then(res => res.json()).catch(() => null),
      fetch(`${apiBaseUrl}/purchase_orders.php`).then(res => res.json()).catch(() => null),
      fetch(`${apiBaseUrl}/invoices.php`).then(res => res.json()).catch(() => null),
      fetch(`${apiBaseUrl}/ratings.php?supplier_id=1`).then(res => res.json()).catch(() => null),
      fetch(`${apiBaseUrl}/receipts.php`).then(res => res.json()).catch(() => null)
    ]).then(([rfqsData, posData, invsData, ratData, recsData]) => {
      let updated = { ...stats };

      let receiptsList = [];
      if (recsData && Array.isArray(recsData.receipts)) {
        receiptsList = recsData.receipts;
      } else {
        const saved = localStorage.getItem('srm_receipts');
        if (saved) receiptsList = JSON.parse(saved);
      }

      let invoicesList = [];
      if (invsData && Array.isArray(invsData.invoices)) {
        invoicesList = invsData.invoices;
      } else {
        const saved = localStorage.getItem('srm_invoices');
        if (saved) invoicesList = JSON.parse(saved);
      }

      if (rfqsData && Array.isArray(rfqsData.rfqs)) {
        updated.openRfqs = rfqsData.rfqs.filter(r => r.status === 'Active').length;
      }
      if (posData && Array.isArray(posData.purchase_orders)) {
        setOrders(posData.purchase_orders.slice(0, 3));
        updated.activeOrders = posData.purchase_orders.filter(o => o.status !== 'cancelled' && o.status !== 'fulfilled').length;
        
        // Count orders ready for invoicing
        const blockingStatuses = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Payment Processing', 'Paid'];
        updated.ordersReadyForInvoicing = posData.purchase_orders.filter(po => {
          const isEligibleStatus = po.status === 'grn_recorded' || po.status === 'delivered';
          const hasGRN = receiptsList.some(r => r.po === po.po_number);
          const hasInvoice = invoicesList.some(inv => inv.po === po.po_number && blockingStatuses.includes(inv.status));
          return isEligibleStatus && hasGRN && !hasInvoice;
        }).length;
      }
      if (invsData && Array.isArray(invsData.invoices)) {
        setInvoices(invsData.invoices.slice(0, 3));
        const outstanding = invsData.invoices
          .filter(i => i.status === 'Submitted' || i.status === 'Under Review' || i.status === 'Approved')
          .reduce((sum, x) => sum + x.amount, 0);
        updated.pendingPayments = outstanding;
      }
      if (ratData && ratData.supplier) {
        updated.performanceScore = ratData.supplier.feasibility_score || 96;
      }
      setStats(updated);
    }).catch(err => console.warn('Offline mode for supplier dashboard:', err));
  }, [apiBaseUrl]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Supplier Partner Console" 
        description="Monitor active contract bids, ship cargo orders, submit commercial billing invoices, and inspect performance scorecards."
      />

      {/* KPI Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        
        {/* Open RFQs */}
        <Card className="p-5 flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/20 text-violet-600">
            <Inbox className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-medium">Open RFQs</p>
            <p className="text-2xl font-bold text-slate-950 dark:text-white mt-0.5">{stats.openRfqs}</p>
          </div>
        </Card>

        {/* Active Orders */}
        <Card className="p-5 flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
            <Truck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Orders</p>
            <p className="text-2xl font-bold text-slate-950 dark:text-white mt-0.5">{stats.activeOrders}</p>
          </div>
        </Card>

        {/* Orders Ready for Invoicing Card */}
        <Link 
          to="/supplier/orders"
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-500/50 dark:hover:border-brand-500/50 transition duration-150 flex items-center gap-4 cursor-pointer group"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 group-hover:scale-110 transition-transform">
            <FileCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium">Ready for Invoicing</p>
            <p className="text-2xl font-bold text-slate-950 dark:text-white mt-0.5">{stats.ordersReadyForInvoicing}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>

        {/* Pending Payments */}
        <Card className="p-5 flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600">
            <ReceiptText className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-medium">Outstanding Billing</p>
            <p className="text-xl font-bold text-slate-950 dark:text-white mt-0.5">{currency(stats.pendingPayments)}</p>
          </div>
        </Card>

        {/* Performance Index */}
        <Card className="p-5 flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600">
            <Star className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-medium">Performance Score</p>
            <p className="text-2xl font-bold text-slate-950 dark:text-white mt-0.5">{stats.performanceScore} / 100</p>
          </div>
        </Card>

      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Order History Tracker */}
        <Card className="md:col-span-2">
          <CardHeader title="Fulfillment Pipeline" subtitle="Recent purchase orders issued for delivery confirmation" />
          <div className="p-5 pt-0 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:bg-slate-950/40 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-2.5">PO Number</th>
                  <th className="p-2.5">Value (₹)</th>
                  <th className="p-2.5">Workflow Status</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                    <td className="p-2.5 font-bold font-mono text-slate-800 dark:text-slate-200">{po.po_number}</td>
                    <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">{currency(po.total_amount)}</td>
                    <td className="p-2.5">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="p-2.5 text-right">
                      <Link to="/supplier/orders" className="text-brand-600 hover:text-brand-500 font-bold flex items-center justify-end gap-1">
                        Inspect <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Invoice Status widget */}
        <Card>
          <CardHeader title="Recent Invoices" subtitle="Billing submissions and status tracking" />
          <div className="p-5 pt-0 space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{inv.id}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PO: {inv.po}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{currency(inv.amount)}</p>
                  <div className="mt-1"><StatusBadge status={inv.status} /></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

      <div className="grid gap-6 md:grid-cols-3">

        {/* Revenue billing trend card */}
        <Card className="md:col-span-2">
          <CardHeader title="Revenue & Dispatch Index" subtitle="Aggregate billing volumes logged per sourcing cycle" />
          <div className="p-5 pt-0 flex flex-col justify-center h-44">
            <div className="flex gap-1.5 items-end justify-between h-28 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex flex-col items-center gap-1 w-1/4">
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t h-8"></div>
                <span className="text-[10px] text-slate-400 font-semibold">Q1 2026</span>
              </div>
              <div className="flex flex-col items-center gap-1 w-1/4">
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t h-16"></div>
                <span className="text-[10px] text-slate-400 font-semibold">Q2 2026</span>
              </div>
              <div className="flex flex-col items-center gap-1 w-1/4">
                <div className="w-full bg-brand-500 rounded-t h-20"></div>
                <span className="text-[10px] text-slate-400 font-semibold">Q3 2026</span>
              </div>
              <div className="flex flex-col items-center gap-1 w-1/4">
                <div className="w-full bg-emerald-500 rounded-t h-24"></div>
                <span className="text-[10px] text-slate-400 font-semibold">Q4 2026 (Proj)</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-3">
              <TrendingUp className="h-4 w-4" />
              <span>Billing volume increased by 15.4% compared to previous contract rounds.</span>
            </div>
          </div>
        </Card>

        {/* Recent Notifications Widget */}
        <Card>
          <CardHeader title="Workspace Alerts" subtitle="Recent collaboration and alert updates" />
          <div className="p-5 pt-0 space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className="text-xs space-y-1">
                <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{notif.text}</p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {notif.time}
                </p>
                <div className="border-b border-slate-50 dark:border-slate-800 pt-1.5"></div>
              </div>
            ))}
            <Link to="/supplier/notifications" className="text-xs font-bold text-brand-600 hover:text-brand-500 flex items-center gap-1 pt-1">
              View All Alerts <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

      </div>
    </div>
  );
}
