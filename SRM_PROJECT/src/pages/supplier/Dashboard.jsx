import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Bell, CheckCircle2, ClipboardList, Gauge, Inbox, PackageCheck, ReceiptText, Send, Sparkles, Star, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { OrdersChart, RfqPieChart, SpendChart } from '../../components/Charts.jsx';
import { orderSummary, procurementSpend, rfqActivity, rfqs as seedRfqs } from '../../data/mockData.js';
import { getNotifications, NOTIFICATION_EVENT } from '../../utils/notificationStore.js';
import { getStoredRfqs, mergeRfqLists, RFQ_EVENT, saveStoredRfqs } from '../../utils/rfqStore.js';

const statIcons = [Inbox, Truck, Send, Star];
const quickActions = [
  { label: 'Open RFQs', detail: 'Review new invitations', to: '/supplier/rfqs', icon: Inbox, tone: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300' },
  { label: 'Submit Bid', detail: 'Quote active packages', to: '/supplier/bids', icon: ReceiptText, tone: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' },
  { label: 'Track Orders', detail: 'Follow delivery status', to: '/supplier/orders', icon: Truck, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' },
  { label: 'Notifications', detail: 'Check action items', to: '/supplier/notifications', icon: Bell, tone: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' },
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
    const status = rfq.status || 'Open';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
  return data.length ? data : rfqActivity;
}

function buildOrderTrendData(orders) {
  if (!orders.length) return orderSummary;

  return orders.slice(0, 4).map((order, index) => ({
    week: `W${index + 1}`,
    created: 1,
    fulfilled: ['delivered', 'fulfilled'].includes(statusText(order.status)) ? 1 : 0,
  }));
}

function buildSpendData(bids) {
  if (!bids.length) return procurementSpend;

  return bids.slice(0, 6).map((bid, index) => {
    const value = Number(bid.price || bid.grandTotal || 0) / 100000;
    return {
      month: `B${index + 1}`,
      direct: Number((value * 0.58).toFixed(1)),
      indirect: Number((value * 0.24).toFixed(1)),
      services: Number((value * 0.18).toFixed(1)),
    };
  });
}

export function SupplierDashboard() {
  const currentUser = useMemo(() => {
    return JSON.parse(sessionStorage.getItem('srm_user') || '{"id":2,"fullName":"Supplier User","email":"supplier@srm.local","role":"supplier","companyName":"Apex Industrial Components"}');
  }, []);
  const [rfqs, setRfqs] = useState(() => getStoredRfqs());
  const [bids, setBids] = useState([]);
  const [orders, setOrders] = useState([]);
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
        if (data.success && Array.isArray(data.bids)) {
          setBids(data.bids.filter((bid) => bid.user_id === currentUser.id || bid.userId === currentUser.id));
        }
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
        if (data.success && Array.isArray(data.purchase_orders)) setOrders(data.purchase_orders);
      })
      .catch(() => setOrders([]));
  }, [currentUser.id]);

  const openRfqs = useMemo(() => rfqs.filter((rfq) => !['draft', 'closed', 'awarded'].includes(statusText(rfq.status))), [rfqs]);
  const activeOrders = useMemo(() => orders.filter((order) => !['cancelled', 'fulfilled', 'delivered'].includes(statusText(order.status))), [orders]);
  const bidValue = useMemo(() => bids.reduce((sum, bid) => sum + Number(bid.price || bid.grandTotal || 0), 0), [bids]);

  const dashboardStats = useMemo(() => [
    { label: 'Open RFQs', value: String(openRfqs.length), change: `${rfqs.length} total`, trend: 'up' },
    { label: 'Active Orders', value: String(activeOrders.length), change: moneyCompact(bidValue), trend: 'up' },
    { label: 'Submitted Bids', value: String(bids.length), change: `${Math.min(99, Math.max(0, bids.length * 12))}% win signal`, trend: 'up' },
    { label: 'Rating', value: '4.8', change: `${notifications.filter((n) => !n.read).length} unread`, trend: 'up' },
  ], [activeOrders.length, bidValue, bids.length, notifications, openRfqs.length, rfqs.length]);

  const dashboardStages = useMemo(() => {
    const totalRfqs = Math.max(rfqs.length, 1);
    const shipped = orders.filter((order) => ['shipped', 'delivered', 'fulfilled'].includes(statusText(order.status))).length;
    const complete = orders.filter((order) => ['delivered', 'fulfilled'].includes(statusText(order.status))).length;

    return [
      { label: 'RFQ responses', value: Math.round((bids.length / totalRfqs) * 100) || 35, color: 'bg-violet-500' },
      { label: 'Orders in motion', value: Math.min(100, activeOrders.length * 18) || 25, color: 'bg-blue-500' },
      { label: 'Dispatch readiness', value: orders.length ? Math.round((shipped / orders.length) * 100) : 84, color: 'bg-emerald-500' },
      { label: 'Invoice clearance', value: orders.length ? Math.round((complete / orders.length) * 100) : 69, color: 'bg-amber-500' },
    ];
  }, [activeOrders.length, bids.length, orders, rfqs.length]);

  const priorityTasks = useMemo(() => {
    const notificationTasks = notifications
      .filter((notification) => !notification.read)
      .slice(0, 3)
      .map((notification) => ({
        title: notification.title,
        detail: notification.body,
        tag: notification.category,
      }));

    if (notificationTasks.length) return notificationTasks;

    return openRfqs.slice(0, 3).map((rfq) => ({
      title: `${rfq.id} response due`,
      detail: rfq.title,
      tag: 'Sourcing',
    }));
  }, [notifications, openRfqs]);

  const rfqStatusData = useMemo(() => buildRfqStatusData(rfqs.length ? rfqs : seedRfqs), [rfqs]);
  const orderTrendData = useMemo(() => buildOrderTrendData(orders), [orders]);
  const spendData = useMemo(() => buildSpendData(bids), [bids]);
  const readyToShip = orders.filter((order) => ['issued', 'shipped'].includes(statusText(order.status))).length;
  const documentsAccepted = orders.length ? Math.round((orders.filter((order) => ['delivered', 'fulfilled'].includes(statusText(order.status))).length / orders.length) * 100) : 94;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.section
        variants={item}
        className="relative overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-slate-100 via-emerald-50 to-teal-50 text-slate-900 shadow-[0_20px_50px_rgba(16,185,129,0.08)] dark:border-slate-800 dark:bg-none dark:bg-slate-950 dark:text-white dark:shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
      >
        {/* Light mode dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:18px_18px] opacity-60 dark:hidden pointer-events-none" />
        {/* Dark mode ambient glow */}
        <div className="absolute inset-0 hidden dark:block bg-[linear-gradient(120deg,rgba(16,185,129,0.28),transparent_38%,rgba(124,58,237,0.22)_72%,transparent)]" />
        {/* Bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent dark:via-emerald-300/70" />

        <div className="relative grid gap-6 p-6 lg:grid-cols-[1.35fr_0.65fr] lg:p-7">
          <div>
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/70 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-white/10 dark:bg-white/10 dark:text-emerald-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Partner fulfillment cockpit
            </motion.span>
            <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-slate-900 sm:text-4xl dark:text-white">
              Stay ahead of RFQs, orders, invoices, and performance signals.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
              Your supplier workspace now highlights the work that needs attention first, with live-feeling motion and fast jumps into daily workflows.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/supplier/rfqs"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-700 dark:bg-white dark:text-slate-950 dark:shadow-none dark:hover:bg-emerald-50"
              >
                Review RFQs <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('main-scroll');
                  if (el) el.scrollBy({ top: el.clientHeight * 0.75, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white/70 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-white dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
              >
                Track orders
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {dashboardStages.map((stage, index) => (
              <motion.div
                key={stage.label}
                variants={item}
                whileHover={{ x: 4 }}
                className="rounded-lg border border-emerald-100 bg-white/60 p-4 backdrop-blur shadow-sm dark:border-white/10 dark:bg-white/10 dark:shadow-none"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700 dark:text-slate-100">{stage.label}</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-100">{stage.value}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.value}%` }}
                    transition={{ duration: 0.8, delay: 0.25 + index * 0.08, ease: 'easeOut' }}
                    className={`h-full rounded-full ${stage.color}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.div variants={container} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat, index) => {
          const Icon = statIcons[index] || Gauge;
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
                  {stat.change} current cycle
                </p>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <motion.div variants={item}>
          <Card>
            <CardHeader title="Priority Queue" subtitle="Action items that need supplier attention" />
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {priorityTasks.map((task) => (
                <motion.div key={task.title} whileHover={{ backgroundColor: 'rgba(248,250,252,0.8)' }} className="flex items-center gap-3 px-5 py-4 dark:hover:bg-slate-800/50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{task.detail}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{task.tag}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader title="Fulfillment Throughput" subtitle="Created versus fulfilled order flow" />
            <div className="p-4">
              <OrdersChart data={orderTrendData} />
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div variants={item}>
          <Card>
            <CardHeader title="Spend Pulse" subtitle="Direct, indirect, and services trend" />
            <div className="p-4">
              <SpendChart data={spendData} />
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <CardHeader title="RFQ Status Mix" subtitle="Pipeline state across sourcing events" />
            <div className="p-4">
              <RfqPieChart data={rfqStatusData} />
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader title="Workspace Shortcuts" subtitle="Fast paths into your supplier operations" />
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.div key={action.label} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
                  <Link to={action.to} className="group flex h-full items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70">
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

      <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Orders ready to ship', value: String(readyToShip), icon: PackageCheck },
          { label: 'Documents accepted', value: `${documentsAccepted}%`, icon: CheckCircle2 },
          { label: 'Average response time', value: '4.2h', icon: Gauge },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-2xl font-black text-slate-950 dark:text-white">{metric.value}</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{metric.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
