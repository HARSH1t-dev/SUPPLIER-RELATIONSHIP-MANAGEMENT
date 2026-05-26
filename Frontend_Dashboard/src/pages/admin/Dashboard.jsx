import { Link } from 'react-router-dom';
import { BarChart3, FileText, LayoutDashboard, PackageOpen, ShieldCheck, ShoppingCart, UserRound } from 'lucide-react';

const adminSections = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    tone: 'text-blue-600 bg-blue-50',
    items: ['Overview of key metrics, charts and recent activity.'],
  },
  {
    title: 'Sourcing',
    icon: FileText,
    tone: 'text-violet-600 bg-violet-50',
    items: [
      'RFQs - Create, manage & track RFQ lifecycle',
      'Bid Management - Compare bids & award POs',
      'Suppliers - Manage supplier profiles & onboarding',
    ],
  },
  {
    title: 'Procurement',
    icon: ShoppingCart,
    tone: 'text-emerald-600 bg-emerald-50',
    items: [
      'Purchase Orders - Create & manage POs',
      'Order Tracker - Track PO fulfillment & status',
      'Receipts & Reviews - Accept deliveries & rate suppliers',
    ],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    tone: 'text-amber-600 bg-amber-50',
    items: [
      'Spend Analytics - Spend trends, category & supplier analytics',
      'Reports - Standard & custom procurement reports',
    ],
  },
  {
    title: 'Governance',
    icon: ShieldCheck,
    tone: 'text-rose-600 bg-rose-50',
    items: [
      'Audit Logs - View system & user activity logs',
      'User & Role Management - Manage users, roles & permissions',
      'System Settings - Configure business & system settings',
    ],
  },
  {
    title: 'Profile',
    icon: UserRound,
    tone: 'text-sky-600 bg-sky-50',
    items: ['Manage profile, preferences and logout'],
  },
];

export function AdminDashboard() {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 border-b border-slate-200 bg-blue-50/40 p-6 sm:flex-row sm:items-center">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)]">
            <UserRound className="h-8 w-8" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Admin Dashboard</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">Full visibility and control</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Control sourcing, procurement, supplier performance and system operations from one role-based workspace.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-200 p-5">
          {adminSections.map((section) => {
            const Icon = section.icon;

            return (
              <article key={section.title} className="grid gap-5 py-5 first:pt-0 last:pb-0 sm:grid-cols-[4.5rem_1fr]">
                <span className={`flex h-14 w-14 items-center justify-center rounded-xl ${section.tone}`}>
                  <Icon className="h-7 w-7" />
                </span>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-blue-900">{section.title}</h2>
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
        <Link to="/admin/rfqs" className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-100">
          Start with RFQs
        </Link>
        <Link to="/admin/orders" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100">
          Review orders
        </Link>
        <Link to="/admin/analytics" className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100">
          Open analytics
        </Link>
      </div>
    </div>
  );
}
