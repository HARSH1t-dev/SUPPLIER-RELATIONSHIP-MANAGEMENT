import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  FileText,
  GitCompare,
  Home,
  LayoutDashboard,
  LockKeyhole,
  Package,
  PackageOpen,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '../components/Button.jsx';

const publicFlows = [
  { label: 'Login Page', detail: 'Supplier and admin sign-in', to: '/login', icon: LockKeyhole },
  { label: 'Register Page', detail: 'Supplier sign-up and approval state', to: '/register', icon: UserPlus },
];

const adminModules = [
  { label: 'Overview', detail: 'Summary cards, approvals, recent activity', to: '/admin', icon: LayoutDashboard },
  { label: 'Supplier Mgmt', detail: 'Supplier list, search filters, detail actions', to: '/admin/suppliers', icon: Users },
  { label: 'RFQ Mgmt', detail: 'RFQ list, creation flow, invitation status', to: '/admin/rfqs', icon: FileText },
  { label: 'Bidding System', detail: 'Open bids, comparison table, award workflow', to: '/admin/bids', icon: GitCompare },
  { label: 'Orders', detail: 'PO list, order detail, printable PO view', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Receiving', detail: 'Pending deliveries, receipt form, supplier review', to: '/admin/receiving', icon: PackageOpen },
  { label: 'Reports', detail: 'Spend, fulfillment, supplier analytics', to: '/admin/analytics', icon: BarChart3 },
];

const supplierModules = [
  { label: 'Overview', detail: 'Active bids, pending orders, profile status', to: '/supplier', icon: LayoutDashboard },
  { label: 'Account Mgmt', detail: 'Company details, logo, average rating', to: '/supplier/profile', icon: Users },
  { label: 'Catalog', detail: 'Product portfolio and inventory overview', to: '/supplier/products', icon: Package },
  { label: 'Sales / RFQs', detail: 'Available RFQs, bid form, submission history', to: '/supplier/rfqs', icon: FileText },
  { label: 'Fulfillment', detail: 'Active orders, request quantities, shipment status', to: '/supplier/orders', icon: Truck },
];

function FlowPill({ item, tone }) {
  const Icon = item.icon;
  const tones = {
    public: 'border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-300 hover:bg-blue-100',
    admin: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100',
    supplier: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800 hover:border-fuchsia-300 hover:bg-fuchsia-100',
  };

  return (
    <Link
      to={item.to}
      className={`flex min-h-28 flex-col justify-between rounded-lg border p-4 transition ${tones[tone]}`}
    >
      <span className="flex items-center gap-2 text-sm font-bold">
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </span>
      <span className="mt-3 text-xs leading-5 text-slate-600">{item.detail}</span>
    </Link>
  );
}

function PortalBand({ title, subtitle, tone, children }) {
  const styles = {
    public: 'border-blue-200 bg-white',
    admin: 'border-emerald-200 bg-white',
    supplier: 'border-fuchsia-200 bg-white',
  };

  return (
    <section className={`rounded-lg border p-5 shadow-soft ${styles[tone]}`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <ArrowRight className="hidden h-5 w-5 text-slate-400 sm:block" />
      </div>
      {children}
    </section>
  );
}

export function LandingPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                <Home className="h-4 w-4" />
                Home / Landing Page
              </span>
              <h1 className="mt-5 text-4xl font-bold text-slate-950 sm:text-5xl">SRM Portal</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                Public authentication, administrator procurement controls, and supplier self-service are organized around the flow map from the latest design.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/admin">
                  <Button>
                    Admin portal <ShieldCheck className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/supplier">
                  <Button variant="secondary">
                    Supplier portal <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs font-bold uppercase text-blue-700">Public</p>
                <p className="mt-1 text-sm text-slate-600">Authentication and account onboarding</p>
              </div>
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-bold uppercase text-emerald-700">Admin</p>
                <p className="mt-1 text-sm text-slate-600">Restricted procurement workspace</p>
              </div>
              <div className="rounded-md border border-fuchsia-200 bg-fuchsia-50 p-3">
                <p className="text-xs font-bold uppercase text-fuchsia-700">Supplier</p>
                <p className="mt-1 text-sm text-slate-600">Approved partner operations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <PortalBand title="1. Public / Authentication" subtitle="Accessible without an active session" tone="public">
          <div className="grid gap-3 sm:grid-cols-2">
            {publicFlows.map((item) => (
              <FlowPill key={item.label} item={item} tone="public" />
            ))}
          </div>
        </PortalBand>

        <PortalBand title="2. Admin Portal" subtitle="Restricted to system administrators" tone="admin">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {adminModules.map((item) => (
              <FlowPill key={item.label} item={item} tone="admin" />
            ))}
          </div>
        </PortalBand>

        <PortalBand title="3. Supplier Portal" subtitle="Restricted to approved suppliers" tone="supplier">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {supplierModules.map((item) => (
              <FlowPill key={item.label} item={item} tone="supplier" />
            ))}
          </div>
        </PortalBand>
      </div>
    </main>
  );
}
