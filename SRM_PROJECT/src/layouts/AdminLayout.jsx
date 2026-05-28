import {
  BarChart3,
  ClipboardList,
  FileText,
  GitCompare,
  LayoutDashboard,
  ListChecks,
  Package,
  PackageOpen,
  PieChart,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  UserCog,
  ReceiptText,
} from 'lucide-react';
import { Outlet, Navigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout.jsx';

const adminItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  {
    section: 'Sourcing',
    items: [
      { label: 'RFQs', to: '/admin/rfqs', icon: FileText },
      { label: 'Bid Management', to: '/admin/bids', icon: GitCompare },
      { label: 'Suppliers', to: '/admin/suppliers', icon: Users },
    ],
  },
  {
    section: 'Procurement',
    items: [
      { label: 'Product Management', to: '/admin/products', icon: Package },
      { label: 'Purchase Orders', to: '/admin/orders', icon: ShoppingCart },
      { label: 'Order Tracker', to: '/admin/order-tracker', icon: ClipboardList },
      { label: 'Receipts & Reviews', to: '/admin/receipts-reviews', icon: PackageOpen },
      { label: 'Invoices & Billing', to: '/admin/invoices', icon: ReceiptText },
    ],
  },
  {
    section: 'Analytics',
    items: [
      { label: 'Spend Analytics', to: '/admin/analytics', icon: PieChart },
      { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    section: 'Governance',
    items: [
      { label: 'Audit Logs', to: '/admin/audit-logs', icon: ShieldCheck },
      { label: 'User & Role Management', to: '/admin/roles', icon: UserCog },
      { label: 'System Settings', to: '/admin/settings', icon: Settings },
    ],
  },
  {
    section: 'Profile',
    items: [{ label: 'Profile', to: '/admin/profile', icon: ListChecks }],
  },
];

export function AdminLayout() {
  const storedUser = sessionStorage.getItem('srm_user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout items={adminItems} title="SRM Portal" subtitle="Admin Console">
      <Outlet />
    </DashboardLayout>
  );
}
