import { BriefcaseBusiness, FileText, LayoutDashboard, Package, ShoppingCart } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout.jsx';

const supplierItems = [
  { label: 'Overview', to: '/supplier', icon: LayoutDashboard, end: true },
  { label: 'Account Mgmt', to: '/supplier/profile', icon: BriefcaseBusiness },
  { label: 'Catalog', to: '/supplier/products', icon: Package },
  { label: 'Sales / RFQs', to: '/supplier/rfqs', icon: FileText },
  { label: 'Fulfillment', to: '/supplier/orders', icon: ShoppingCart },
];

export function SupplierLayout() {
  return (
    <DashboardLayout items={supplierItems} title="Supplier Portal" subtitle="Partner Workspace">
      <Outlet />
    </DashboardLayout>
  );
}
