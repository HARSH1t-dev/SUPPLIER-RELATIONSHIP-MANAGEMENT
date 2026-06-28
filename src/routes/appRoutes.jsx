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
import { GoodsReceiving } from '../pages/admin/GoodsReceiving.jsx';
import { Reviews } from '../pages/admin/Reviews.jsx';
import { Analytics } from '../pages/admin/Analytics.jsx';
import { Settings } from '../pages/admin/Settings.jsx';
import { SupplierDashboard } from '../pages/supplier/Dashboard.jsx';
import { SupplierProducts } from '../pages/supplier/Products.jsx';
import { SupplierRFQs } from '../pages/supplier/RFQs.jsx';
import { MyBids } from '../pages/supplier/MyBids.jsx';
import { SupplierOrders } from '../pages/supplier/Orders.jsx';
import { SupplierReviews } from '../pages/supplier/Reviews.jsx';
import { SupplierProfile } from '../pages/supplier/Profile.jsx';
import { NotFound } from '../pages/NotFound.jsx';


export const appRoutes = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
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
      { path: 'receiving', element: <GoodsReceiving /> },
      { path: 'reviews', element: <Reviews /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'settings', element: <Settings /> },
      { path: 'reports', element: <Navigate to="/admin/analytics" replace /> },
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
      { path: 'orders', element: <SupplierOrders /> },
      { path: 'reviews', element: <SupplierReviews /> },
      { path: 'profile', element: <SupplierProfile /> },
      { path: 'account', element: <Navigate to="/supplier/profile" replace /> },
      { path: 'catalog', element: <Navigate to="/supplier/products" replace /> },
      { path: 'sales', element: <Navigate to="/supplier/rfqs" replace /> },
      { path: 'fulfillment', element: <Navigate to="/supplier/orders" replace /> },
    ],
  },
  { path: '*', element: <NotFound /> },
];
