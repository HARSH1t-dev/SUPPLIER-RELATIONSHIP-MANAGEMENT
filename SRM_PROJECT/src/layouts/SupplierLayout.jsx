import { Bell, Gauge, History, Inbox, LayoutDashboard, ReceiptText, ShoppingBag, Star, Truck, UserRound } from 'lucide-react';
import { Outlet, Navigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout.jsx';

const supplierItems = [
  { label: 'Dashboard', to: '/supplier', icon: LayoutDashboard, end: true },
  {
    section: 'Sourcing',
    items: [
      { label: 'RFQ Sourcing Inbox', to: '/supplier/rfqs', icon: Inbox },
      { label: 'My Bids', to: '/supplier/bids', icon: ReceiptText },
      { label: 'Bid History', to: '/supplier/bid-history', icon: History },
    ],
  },
  {
    section: 'Orders',
    items: [
      { label: 'Active Orders', to: '/supplier/orders', icon: Truck },
      { label: 'Order History', to: '/supplier/order-history', icon: ShoppingBag },
      { label: 'Invoices', to: '/supplier/invoices', icon: ReceiptText },
    ],
  },
  {
    section: 'Performance',
    items: [
      { label: 'KPI & Performance', to: '/supplier/performance', icon: Gauge },
      { label: 'Reviews & Ratings', to: '/supplier/reviews', icon: Star },
    ],
  },
  {
    section: 'Workspace',
    items: [
      { label: 'Workspace Feed', to: '/supplier/workspace-feed', icon: Bell },
      { label: 'Notifications', to: '/supplier/notifications', icon: Bell },
    ],
  },
  {
    section: 'Profile',
    items: [{ label: 'Profile', to: '/supplier/profile', icon: UserRound }],
  },
];

export function SupplierLayout() {
  const storedUser = sessionStorage.getItem('srm_user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user || user.role !== 'supplier') {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout items={supplierItems} title="Supplier Portal" subtitle="Partner Workspace">
      <Outlet />
    </DashboardLayout>
  );
}
