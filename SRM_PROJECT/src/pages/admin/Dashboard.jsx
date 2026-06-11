import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, CheckCircle2, FileText, GitCompare, ShieldCheck, ShoppingCart, Sparkles, Truck, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { OrdersChart, RfqPieChart, SpendChart } from '../../components/Charts.jsx';
import { activity, orderSummary, procurementSpend, rfqActivity, rfqs as seedRfqs, suppliers } from '../../data/mockData.js';
import { getNotifications, NOTIFICATION_EVENT } from '../../utils/notificationStore.js';
import { getStoredRfqs, mergeRfqLists, RFQ_EVENT, saveStoredRfqs } from '../../utils/rfqStore.js';

const statIcons = [BarChart3, Users, FileText, Truck];
const quickActions = [
  { label: 'Launch RFQ', detail: 'Create sourcing event', to: '/admin/rfqs', icon: FileText, tone: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' },
  { label: 'Compare Bids', detail: 'Award with confidence', to: '/admin/bids', icon: GitCompare, tone: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300' },
  { label: 'Review Orders', detail: 'Track fulfillment', to: '/admin/orders', icon: ShoppingCart, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' },
  { label: 'Governance', detail: 'Audit system activity', to: '/admin/audit-logs', icon: ShieldCheck, tone: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 16 } },
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

const moneyCompact = (value) =>
  new Intl.NumberFormat('en-IN', {
    currency: 'INR',
    maximumFractionDigits: 1,
    notation: 'compact',
    style: 'currency',
  }).format(value || 0);

const statusText = (status = '') => String(status).toLowerCase();

function buildRfqStatusData(rfqList) {
  const counts = rfqList.reduce((acc, rfq) => {
    const status = rfq.status || 'Draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
  return data.length ? data : rfqActivity;
}

function buildOrderTrendData(purchaseOrders) {
  if (!purchaseOrders.length) return orderSummary;

  return purchaseOrders.slice(0, 4).map((po, index) => ({
    week: `W${index + 1}`,
    created: 1,
    fulfilled: ['delivered', 'fulfilled'].includes(statusText(po.status)) ? 1 : 0,
  }));
}

function buildSpendData(rfqList, purchaseOrders) {
  const source = rfqList.length ? rfqList : seedRfqs;
  const grouped = source.slice(0, 6).map((rfq, index) => {
    const value = Number(rfq.value || 0) / 100000;
    return {
      month: rfq.deadline ? new Date(rfq.deadline).toLocaleString('en-US', { month: 'short' }) : `P${index + 1}`,
      direct: Number((value * 0.52).toFixed(1)),
      indirect: Number((value * 0.28).toFixed(1)),
      services: Number((value * 0.2).toFixed(1)),
    };
  });

  if (grouped.length) return grouped;

  if (purchaseOrders.length) {
    return purchaseOrders.slice(0, 6).map((po, index) => {
      const value = Number(po.total_amount || po.amount || 0) / 100000;
      return {
        month: po.order_date ? new Date(po.order_date).toLocaleString('en-US', { month: 'short' }) : `P${index + 1}`,
        direct: Number((value * 0.6).toFixed(1)),
        indirect: Number((value * 0.25).toFixed(1)),
        services: Number((value * 0.15).toFixed(1)),
      };
    });
  }

  return procurementSpend;
}

export function AdminDashboard() {
  const [rfqs, setRfqs] = useState(() => getStoredRfqs());
  const [bids, setBids] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [notifications, setNotifications] = useState(() => getNotifications());

  useEffect(() => {
    const refreshNotifications = () => setNotifications(getNotifications());
    const refreshRfqs = () => setRfqs(getStoredRfqs());
    window.addEventListener(NOTIFICATION_EVENT, refreshNotifications);
    window.addEventListener(RFQ_EVENT, refreshRfqs);
    window.addEventListener('storage', refreshNotifications);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, refreshNotifications);
      window.removeEventListener(RFQ_EVENT, refreshRfqs);
      window.removeEventListener('storage', refreshNotifications);
    };
  }, []);

  useEffect(() => {
    setRfqs(getStoredRfqs());

    fetch(`${apiBaseUrl}/rfqs.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.rfqs)) {
          const mergedRfqs = mergeRfqLists(data.rfqs);
          setRfqs(mergedRfqs);
          saveStoredRfqs(mergedRfqs);
        }
      })
      .catch(() => setRfqs(getStoredRfqs()));

    fetch(`${apiBaseUrl}/bids.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.bids)) setBids(data.bids);
      })
      .catch(() => {
        try {
          setBids(JSON.parse(localStorage.getItem('srm_bids') || '[]'));
        } catch {
          setBids([]);
        }
      });

    fetch(`${apiBaseUrl}/purchase_orders.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.purchase_orders)) setPurchaseOrders(data.purchase_orders);
      })
      .catch(() => setPurchaseOrders([]));
  }, []);

  const dashboardStats = useMemo(() => {
    const rfqValue = rfqs.reduce((sum, rfq) => sum + Number(rfq.value || 0), 0);
    const poValue = purchaseOrders.reduce((sum, po) => sum + Number(po.total_amount || po.amount || 0), 0);
    const uniqueSuppliers = new Set([
      ...suppliers.map((supplier) => supplier.name),
      ...bids.map((bid) => bid.supplierName || bid.supplier || bid.supplier_name).filter(Boolean),
      ...purchaseOrders.map((po) => po.supplier_name || po.supplier).filter(Boolean),
    ]);
    const openRfqs = rfqs.filter((rfq) => !['draft', 'awarded', 'closed'].includes(statusText(rfq.status))).length;
    const completedOrders = purchaseOrders.filter((po) => ['delivered', 'fulfilled'].includes(statusText(po.status))).length;
    const onTime = purchaseOrders.length ? Math.round((completedOrders / purchaseOrders.length) * 100) : 95;

    return [
      { label: 'Managed Spend', value: moneyCompact(rfqValue + poValue || 24800000), change: `${rfqs.length} RFQs`, trend: 'up' },
      { label: 'Active Suppliers', value: String(uniqueSuppliers.size || suppliers.length), change: `${bids.length} bids`, trend: 'up' },
      { label: 'Open RFQs', value: String(openRfqs), change: `${rfqs.length} total`, trend: openRfqs ? 'up' : 'down' },
      { label: 'On-time Delivery', value: `${onTime}%`, change: `${completedOrders}/${purchaseOrders.length || completedOrders} complete`, trend: 'up' },
    ];
  }, [bids, purchaseOrders, rfqs]);

  const dashboardWorkflow = useMemo(() => {
    const totalRfqs = Math.max(rfqs.length, 1);
    const evaluating = rfqs.filter((rfq) => statusText(rfq.status).includes('evaluat')).length;
    const awarded = rfqs.filter((rfq) => ['awarded', 'closed'].includes(statusText(rfq.status))).length;
    const completedOrders = purchaseOrders.filter((po) => ['delivered', 'fulfilled'].includes(statusText(po.status))).length;

    return [
      { label: 'RFQ intake', value: Math.min(100, Math.round((rfqs.length / Math.max(seedRfqs.length, 1)) * 100)), color: 'bg-blue-500' },
      { label: 'Bid evaluation', value: Math.round((evaluating / totalRfqs) * 100) || Math.min(100, bids.length * 12), color: 'bg-violet-500' },
      { label: 'PO conversion', value: Math.round((awarded / totalRfqs) * 100) || Math.min(100, purchaseOrders.length * 14), color: 'bg-emerald-500' },
      { label: 'Compliance review', value: purchaseOrders.length ? Math.round((completedOrders / purchaseOrders.length) * 100) : 91, color: 'bg-amber-500' },
    ];
  }, [bids.length, purchaseOrders, rfqs]);

  const spendData = useMemo(() => buildSpendData(rfqs, purchaseOrders), [purchaseOrders, rfqs]);
  const rfqStatusData = useMemo(() => buildRfqStatusData(rfqs), [rfqs]);
  const orderTrendData = useMemo(() => buildOrderTrendData(purchaseOrders), [purchaseOrders]);
  const activityFeed = useMemo(() => {
    const notificationEvents = notifications.slice(0, 5).map((notification) => ({
      event: notification.title,
      owner: notification.type,
      status: notification.category,
      time: notification.time,
    }));

    return notificationEvents.length ? notificationEvents : activity;
  }, [notifications]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.section
        variants={item}
        className="relative overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-slate-100 via-indigo-50 to-blue-50 text-slate-900 shadow-[0_20px_50px_rgba(99,102,241,0.08)] dark:border-slate-800 dark:bg-none dark:bg-slate-950 dark:text-white dark:shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
      >
        {/* Light mode dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#c7d2fe_1px,transparent_1px)] [background-size:18px_18px] opacity-60 dark:hidden pointer-events-none" />
        {/* Dark mode ambient glow */}
        <div className="absolute inset-0 hidden dark:block bg-[linear-gradient(120deg,rgba(37,99,235,0.28),transparent_38%,rgba(20,184,166,0.2)_72%,transparent)]" />
        {/* Light mode bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent dark:via-cyan-300/70" />
        <div className="relative grid gap-6 p-6 lg:grid-cols-[1.35fr_0.65fr] lg:p-7">
          <div>
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-100/70 px-3 py-1 text-xs font-bold text-indigo-700 dark:border-white/10 dark:bg-white/10 dark:text-cyan-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Live procurement command center
            </motion.span>
            <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-slate-900 sm:text-4xl dark:text-white">
              Full visibility across sourcing, spend, and supplier performance.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
              Monitor high-value sourcing events, unblock purchase orders, and keep governance activity visible from a single animated workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/admin/rfqs"
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-500/20 transition hover:bg-indigo-700 dark:bg-white dark:text-slate-950 dark:shadow-none dark:hover:bg-cyan-50"
              >
                Create RFQ <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('main-scroll');
                  if (el) el.scrollBy({ top: el.clientHeight * 0.75, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white/70 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-white dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
              >
                View analytics
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {dashboardWorkflow.map((step, index) => (
              <motion.div
                key={step.label}
                variants={item}
                whileHover={{ x: 4 }}
                className="rounded-lg border border-indigo-100 bg-white/60 p-4 backdrop-blur shadow-sm dark:border-white/10 dark:bg-white/10 dark:shadow-none"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700 dark:text-slate-100">{step.label}</span>
                  <span className="font-black text-indigo-600 dark:text-cyan-100">{step.value}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${step.value}%` }}
                    transition={{ duration: 0.8, delay: 0.25 + index * 0.08, ease: 'easeOut' }}
                    className={`h-full rounded-full ${step.color}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.div variants={container} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat, index) => {
          const Icon = statIcons[index] || BarChart3;
          return (
            <motion.div key={stat.label} variants={item} whileHover={{ y: -5, scale: 1.01 }}>
              <Card className="relative overflow-hidden p-5">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-slate-100 dark:bg-slate-800/70" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{stat.value}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className={`relative mt-4 text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {stat.change} from last cycle
                </p>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div variants={item}>
          <Card>
            <CardHeader title="Spend Pulse" subtitle="Category spend trend across the current half-year" />
            <div className="p-4">
              <SpendChart data={spendData} />
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <CardHeader title="RFQ Flow" subtitle="Live sourcing stages" />
            <div className="p-4">
              <RfqPieChart data={rfqStatusData} />
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <motion.div variants={item}>
          <Card>
            <CardHeader title="Quick Actions" subtitle="Jump into the work that moves procurement forward" />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <motion.div key={action.label} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
                    <Link to={action.to} className="group flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${action.tone}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-slate-950 dark:text-white">{action.label}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">{action.detail}</span>
                      </span>
                      <ArrowRight className="ml-auto h-4 w-4 text-slate-400 transition group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader title="Order Throughput" subtitle="Created versus fulfilled purchase orders" />
            <div className="p-4">
              <OrdersChart data={orderTrendData} />
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader title="Recent Activity" subtitle="Latest operational signals" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activityFeed.map((event) => (
              <motion.div key={event.event} whileHover={{ backgroundColor: 'rgba(248,250,252,0.8)' }} className="flex items-center gap-3 px-5 py-4 dark:hover:bg-slate-800/50">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{event.event}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{event.owner} - {event.time}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{event.status}</span>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
