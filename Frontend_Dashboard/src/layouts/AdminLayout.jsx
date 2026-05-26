import {
  BarChart3,
  ClipboardList,
  FileText,
  GitCompare,
  LayoutDashboard,
  ListChecks,
  PackageOpen,
  PieChart,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  UserCog,
} from 'lucide-react';
import { Outlet } from 'react-router-dom';
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
      { label: 'Purchase Orders', to: '/admin/orders', icon: ShoppingCart },
      { label: 'Order Tracker', to: '/admin/order-tracker', icon: ClipboardList },
      { label: 'Receipts & Reviews', to: '/admin/receipts-reviews', icon: PackageOpen },
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
  return (
    <DashboardLayout items={adminItems} title="SRM Portal" subtitle="Admin Console">
      <Outlet />
    </DashboardLayout>
  );
}
