import {
  BarChart3,
  FileText,
  GitCompare,
  LayoutDashboard,
  PackageOpen,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout.jsx';
import ChatAssistant from '../components/ChatAssistant';

const adminItems = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Supplier Mgmt', to: '/admin/suppliers', icon: Users },
  { label: 'RFQ Mgmt', to: '/admin/rfqs', icon: FileText },
  { label: 'Bidding System', to: '/admin/bids', icon: GitCompare },
  { label: 'Orders', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Goods Receiving', to: '/admin/receiving', icon: PackageOpen },
  { label: 'Reports', to: '/admin/analytics', icon: BarChart3 },
];

export function AdminLayout() {
  return (
    <DashboardLayout items={adminItems} title="SRM Portal" subtitle="Admin Console">
      <Outlet />
      <ChatAssistant />
    </DashboardLayout>
     
  );
 

     

   

}
