import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import ResetPassword from './pages/ResetPassword';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import GoogleAuthError from './pages/GoogleAuthError';
import Profile from './components/Profile';
import ProductList from './components/products/ProductList';
import ProductDetails from './components/products/ProductDetails';
import MedicineList from './components/medicines/MedicineList';
import Users from './components/admin/Users';
import Shop from './components/shop/Shop';
import Cart from './components/shop/Cart';
import Wishlist from './components/shop/Wishlist';
import { CartProvider } from './context/CartContext';
import PaymentValidation from './components/admin/PaymentValidation';
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentFailed from './pages/payment/PaymentFailed';
import OrderHistory from './components/shop/OrderHistory';
import OrderDetails from './pages/orders/OrderDetails';
import Prescriptions from './components/shop/Prescriptions';
import PrescriptionManagement from './components/admin/PrescriptionManagement';
import Orders from './components/admin/Orders';
import Reports from './components/admin/Reports';
import ReturnRequests from './components/admin/ReturnRequests';
import ShippingMethods from './components/admin/ShippingMethods';
import TaxRates from './components/admin/TaxRates';
import Coupons from './components/admin/Coupons';
import PromotionManagement from './components/admin/PromotionManagement';
import PromotionsPage from './pages/shop/Promotions';
import UnauthorizedAccess from './components/common/UnauthorizedAccess';
import InventoryManagement from './components/inventory/InventoryManagement';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import RatingModeration from './pages/admin/RatingModeration';

// Route guard for authenticated users
const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return element;
};

// Route guard for admin users
const AdminRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const location = useLocation();
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  // If authenticated but not admin, show unauthorized page
  if (!isAdmin) {
    console.log('User attempted to access admin route but is not an admin:', user?.email);
    return <UnauthorizedAccess />;
  }
  
  return element;
};

// Route guard for regular users
const UserRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return element;
};

// Public route guard - redirects to dashboard if already authenticated
const PublicRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/shop"} replace />;
  }
  return element;
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isAuthPage = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/google/success',
    '/auth/google/error'
  ].includes(location.pathname);

  return (
    <div className="d-flex flex-column min-vh-100">
      {!isAuthPage && <Navbar />}
      <div className="d-flex flex-grow-1">
        {isAuthenticated && !isAuthPage && <Sidebar />}
        <main className={`flex-grow-1 py-4 ${isAuthenticated && !isAuthPage ? 'ms-4' : ''}`}>
          <div className="container">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<PublicRoute element={<LoginForm />} />} />
              <Route path="/register" element={<PublicRoute element={<RegisterForm />} />} />
              <Route path="/forgot-password" element={<PublicRoute element={<ForgotPasswordForm />} />} />
              <Route path="/reset-password" element={<PublicRoute element={<ResetPassword />} />} />
              
              {/* Google Auth Routes */}
              <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
              <Route path="/auth/google/error" element={<GoogleAuthError />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute element={<AdminDashboard />} />} />
              <Route path="/admin/medicines" element={<AdminRoute element={<MedicineList />} />} />
              <Route path="/admin/users" element={<AdminRoute element={<Users />} />} />
              <Route path="/admin/prescriptions" element={<AdminRoute element={<PrescriptionManagement />} />} />
              <Route path="/admin/orders" element={<AdminRoute element={<Orders />} />} />
              <Route path="/admin/returns" element={<AdminRoute element={<ReturnRequests />} />} />
              <Route path="/admin/reports" element={<AdminRoute element={<Reports />} />} />
              <Route path="/admin/shipping" element={<AdminRoute element={<ShippingMethods />} />} />
              <Route path="/admin/tax-rates" element={<AdminRoute element={<TaxRates />} />} />
              <Route path="/admin/coupons" element={<AdminRoute element={<Coupons />} />} />
              <Route path="/admin/promotions" element={<AdminRoute element={<PromotionManagement />} />} />
              <Route path="/admin/analytics" element={
                <AdminRoute element={<AdvancedAnalytics />} />
              } />
              <Route path="/admin/rating-moderation" element={<AdminRoute element={<RatingModeration />} />} />
              
              {/* User Routes */}
              <Route path="/shop" element={<UserRoute element={<Shop />} />} />
              <Route path="/shop/medicine/:id" element={<UserRoute element={<ProductDetails />} />} />
              <Route path="/cart" element={<UserRoute element={<Cart />} />} />
              <Route path="/wishlist" element={<UserRoute element={<Wishlist />} />} />
              <Route path="/order-history" element={<UserRoute element={<OrderHistory />} />} />
              <Route path="/orders/:orderId" element={<UserRoute element={<OrderDetails />} />} />
              <Route path="/prescriptions" element={<UserRoute element={<Prescriptions />} />} />
              <Route path="/promotions" element={<UserRoute element={<PromotionsPage />} />} />
              
              {/* Shared Protected Routes */}
              <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
              
              {/* Root Route - Redirect to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Payment Routes */}
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/failed" element={<PaymentFailed />} />

              {/* Inventory Management Route */}
              <Route 
                path="/inventory" 
                element={
                  <AdminRoute element={<InventoryManagement />} />
                } 
              />
            </Routes>
          </div>
        </main>
      </div>
      {!isAuthPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}