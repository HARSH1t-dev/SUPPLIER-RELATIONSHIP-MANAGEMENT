import { Link } from 'react-router-dom';
import { BarChart3, Bell, Gauge, Inbox, ShoppingBag, Truck, UserRound } from 'lucide-react';

const supplierSections = [
  {
    title: 'Dashboard',
    icon: Gauge,
    tone: 'text-emerald-600 bg-emerald-50',
    items: ['Overview of KPIs, open items and recent activity.'],
  },
  {
    title: 'Sourcing',
    icon: Inbox,
    tone: 'text-violet-600 bg-violet-50',
    items: [
      'RFQ Sourcing Inbox - View invited & open RFQs',
      'My Bids - Submit & manage bid quotations',
      'Bid History - Track all submitted bids & status',
    ],
  },
  {
    title: 'Orders',
    icon: Truck,
    tone: 'text-emerald-600 bg-emerald-50',
    items: [
      'Active Orders - View & track ongoing POs',
      'Order History - View completed/cancelled orders',
      'Invoices - Submit & track invoices',
    ],
  },
  {
    title: 'Performance',
    icon: BarChart3,
    tone: 'text-amber-600 bg-amber-50',
    items: [
      'KPI & Performance - View performance metrics',
      'Reviews & Ratings - View reviews & ratings',
    ],
  },
  {
    title: 'Workspace',
    icon: Bell,
    tone: 'text-rose-600 bg-rose-50',
    items: [
      'Workspace Feed - Activity & collaboration feed',
      'Notifications - System & business notifications',
    ],
  },
  {
    title: 'Profile',
    icon: UserRound,
    tone: 'text-emerald-600 bg-emerald-50',
    items: ['Manage profile, preferences and logout'],
  },
];

export function SupplierDashboard() {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 border-b border-slate-200 bg-emerald-50/50 p-6 sm:flex-row sm:items-center">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_18px_40px_rgba(5,150,105,0.24)]">
            <Truck className="h-8 w-8" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Supplier Dashboard</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">Sourcing and fulfillment workspace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Access sourcing opportunities, orders, performance and collaboration tools from a supplier-only workspace.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-200 p-5">
          {supplierSections.map((section) => {
            const Icon = section.icon;

            return (
              <article key={section.title} className="grid gap-5 py-5 first:pt-0 last:pb-0 sm:grid-cols-[4.5rem_1fr]">
                <span className={`flex h-14 w-14 items-center justify-center rounded-xl ${section.tone}`}>
                  <Icon className="h-7 w-7" />
                </span>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-900">{section.title}</h2>
                  <ul className="mt-3 space-y-1.5 text-sm leading-6 text-slate-700">
                    {section.items.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:grid-cols-3">
        <Link to="/supplier/rfqs" className="rounded-lg bg-violet-50 px-4 py-3 text-sm font-bold text-violet-800 transition hover:bg-violet-100">
          Open RFQs
        </Link>
        <Link to="/supplier/orders" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100">
          Active orders
        </Link>
        <Link to="/supplier/reviews" className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100">
          Performance
        </Link>
      </div>
    </div>
  );
}
