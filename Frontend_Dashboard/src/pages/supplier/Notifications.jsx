import { Bell, FileText, ShoppingCart, Star, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useState } from 'react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';

const allNotifications = [
  {
    id: 1,
    category: 'sourcing',
    icon: FileText,
    iconColor: 'text-violet-600 bg-violet-50',
    title: 'New RFQ invitation: Precision CNC Aluminum Housings',
    body: 'You have been invited to submit a bid. Deadline: Jun 10, 2026.',
    time: '12 min ago',
    read: false,
    type: 'Business',
  },
  {
    id: 2,
    category: 'orders',
    icon: ShoppingCart,
    iconColor: 'text-blue-600 bg-blue-50',
    title: 'PO-88021 shipment document requested',
    body: 'Apex Industrial Components requires your shipping documentation by Jun 3.',
    time: '1 hr ago',
    read: false,
    type: 'Action Required',
  },
  {
    id: 3,
    category: 'orders',
    icon: AlertTriangle,
    iconColor: 'text-rose-600 bg-rose-50',
    title: 'PO-88018 delivery overdue',
    body: 'Expected delivery date was May 20, 2026. Please update your shipment status immediately.',
    time: '3 hr ago',
    read: false,
    type: 'Alert',
  },
  {
    id: 4,
    category: 'performance',
    icon: Star,
    iconColor: 'text-amber-600 bg-amber-50',
    title: 'Quarterly scorecard available for review',
    body: 'Your Q1 2026 performance scorecard has been published. Review your scores and feedback.',
    time: '5 hr ago',
    read: false,
    type: 'Business',
  },
  {
    id: 5,
    category: 'sourcing',
    icon: CheckCircle,
    iconColor: 'text-emerald-600 bg-emerald-50',
    title: 'Bid accepted — RFQ-24049',
    body: 'Congratulations! Your bid for Industrial Fasteners has been accepted. A purchase order will follow shortly.',
    time: 'Yesterday',
    read: true,
    type: 'Business',
  },
  {
    id: 6,
    category: 'system',
    icon: Info,
    iconColor: 'text-slate-600 bg-slate-100',
    title: 'System maintenance scheduled',
    body: 'The SRM portal will be under maintenance on Jun 1, 2026 from 2–4 AM IST.',
    time: '2 days ago',
    read: true,
    type: 'System',
  },
  {
    id: 7,
    category: 'orders',
    icon: CheckCircle,
    iconColor: 'text-emerald-600 bg-emerald-50',
    title: 'PO-88015 marked as delivered',
    body: 'Vector Packaging Co. has confirmed receipt of your delivery for PO-88015.',
    time: '3 days ago',
    read: true,
    type: 'Business',
  },
];

const categories = ['All', 'Sourcing', 'Orders', 'Performance', 'System'];
const typeColors = {
  'Action Required': 'bg-rose-50 text-rose-700 ring-rose-600/20',
  'Alert': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'Business': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'System': 'bg-slate-100 text-slate-700 ring-slate-600/20',
};

export function Notifications() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [notifications, setNotifications] = useState(allNotifications);

  const filtered = notifications.filter(
    (n) => activeCategory === 'All' || n.category === activeCategory.toLowerCase()
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <>
      <PageHeader title="Notifications" description="System alerts, business updates, and action items from your procurement network." />

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </span>
          }
          subtitle="Stay updated on RFQs, orders, performance, and system events"
          action={
            unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition"
              >
                Mark all as read
              </button>
            )
          }
        />

        {/* Category filter */}
        <div className="flex gap-1 border-b border-slate-100 px-5 py-3 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">No notifications in this category</p>
            </div>
          )}
          {filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markRead(notif.id)}
              className={`flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50/60 ${
                !notif.read ? 'bg-blue-50/30' : ''
              }`}
            >
              <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${notif.iconColor}`}>
                <notif.icon className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <p className={`text-sm ${notif.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                    {notif.title}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${typeColors[notif.type]}`}>
                      {notif.type}
                    </span>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{notif.body}</p>
                <p className="mt-1.5 text-xs text-slate-400">{notif.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
