import { Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout.jsx';
import { AdminLayout } from '../layouts/AdminLayout.jsx';
import { SupplierLayout } from '../layouts/SupplierLayout.jsx';
import { LandingPage } from '../pages/LandingPage.jsx';
import { Login } from '../pages/auth/Login.jsx';
import { Register } from '../pages/auth/Register.jsx';
import { ForgotPassword } from '../pages/auth/ForgotPassword.jsx';
import { AdminDashboard } from '../pages/admin/Dashboard.jsx';
import { SupplierManagement } from '../pages/admin/SupplierManagement.jsx';
import { ProductManagement } from '../pages/admin/ProductManagement.jsx';
import { RFQManagement } from '../pages/admin/RFQManagement.jsx';
import { RFQDetail } from '../pages/admin/RFQDetail.jsx';
import { BidComparison } from '../pages/admin/BidComparison.jsx';
import { PurchaseOrders } from '../pages/admin/PurchaseOrders.jsx';
import { OrderTracker } from '../pages/admin/OrderTracker.jsx';
import { GoodsReceiving } from '../pages/admin/GoodsReceiving.jsx';
import { Reviews } from '../pages/admin/Reviews.jsx';
import { Analytics } from '../pages/admin/Analytics.jsx';
import { Reports } from '../pages/admin/Reports.jsx';
import { Settings } from '../pages/admin/Settings.jsx';
import { AuditLogs } from '../pages/admin/AuditLogs.jsx';
import { RoleManagement } from '../pages/admin/RoleManagement.jsx';
import { AdminProfile } from '../pages/admin/AdminProfile.jsx';
import { SupplierDashboard } from '../pages/supplier/Dashboard.jsx';
import { SupplierProducts } from '../pages/supplier/Products.jsx';
import { SupplierRFQs } from '../pages/supplier/RFQs.jsx';
import { MyBids } from '../pages/supplier/MyBids.jsx';
import { SupplierOrders } from '../pages/supplier/Orders.jsx';
import { SupplierOrderHistory } from '../pages/supplier/OrderHistory.jsx';
import { SupplierInvoices } from '../pages/supplier/Invoices.jsx';
import { SupplierReviews } from '../pages/supplier/Reviews.jsx';
import { WorkspaceFeed } from '../pages/supplier/WorkspaceFeed.jsx';
import { Notifications } from '../pages/supplier/Notifications.jsx';
import { SupplierKpiPerformance } from '../pages/supplier/KpiPerformance.jsx';
import { SupplierProfile } from '../pages/supplier/Profile.jsx';
import { NotFound } from '../pages/NotFound.jsx';

export const appRoutes = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '/home', element: <LandingPage /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'suppliers', element: <SupplierManagement /> },
      { path: 'products', element: <ProductManagement /> },
      { path: 'rfqs', element: <RFQManagement /> },
      { path: 'rfqs/:id', element: <RFQDetail /> },
      { path: 'bids', element: <BidComparison /> },
      { path: 'orders', element: <PurchaseOrders /> },
      { path: 'order-tracker', element: <OrderTracker /> },
      { path: 'receiving', element: <GoodsReceiving /> },
      { path: 'receipts-reviews', element: <GoodsReceiving /> },
      { path: 'reviews', element: <Reviews /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'reports', element: <Reports /> },
      { path: 'settings', element: <Settings /> },
      { path: 'audit-logs', element: <AuditLogs /> },
      { path: 'roles', element: <RoleManagement /> },
      { path: 'profile', element: <AdminProfile /> },
      { path: 'compliance', element: <Navigate to="/admin/reviews" replace /> },
      { path: 'logistics', element: <Navigate to="/admin/orders" replace /> },
    ],
  },
  {
    path: '/supplier',
    element: <SupplierLayout />,
    children: [
      { index: true, element: <SupplierDashboard /> },
      { path: 'products', element: <SupplierProducts /> },
      { path: 'rfqs', element: <SupplierRFQs /> },
      { path: 'bids', element: <MyBids /> },
      { path: 'bid-history', element: <MyBids /> },
      { path: 'orders', element: <SupplierOrders /> },
      { path: 'order-history', element: <SupplierOrderHistory /> },
      { path: 'invoices', element: <SupplierInvoices /> },
      { path: 'reviews', element: <SupplierReviews /> },
      { path: 'performance', element: <SupplierKpiPerformance /> },
      { path: 'profile', element: <SupplierProfile /> },
      { path: 'workspace-feed', element: <WorkspaceFeed /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'account', element: <Navigate to="/supplier/profile" replace /> },
      { path: 'catalog', element: <Navigate to="/supplier/products" replace /> },
      { path: 'sales', element: <Navigate to="/supplier/rfqs" replace /> },
      { path: 'fulfillment', element: <Navigate to="/supplier/orders" replace /> },
    ],
  },
  { path: '*', element: <NotFound /> },
];
