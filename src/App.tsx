import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Profile from './components/Profile';
import ProductList from './components/products/ProductList';
import ProductDetails from './components/products/ProductDetails';
import MedicineList from './components/medicines/MedicineList';
import Users from './components/admin/Users';
import Shop from './components/shop/Shop';
import Cart from './components/shop/Cart';
import { CartProvider } from './context/CartContext';
import PaymentValidation from './components/admin/PaymentValidation';
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentFailed from './pages/payment/PaymentFailed';

// Route guard for authenticated users
const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

// Route guard for admin users
const AdminRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
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
  return element;
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {!isAuthPage && <Navbar />}
      <div className="flex flex-1">
        {isAuthenticated && !isAuthPage && <Sidebar />}
        <main className={`flex-1 ${isAuthenticated && !isAuthPage ? 'lg:ml-64' : ''}`}>
          <div className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute element={<AdminDashboard />} />} />
              <Route path="/admin/medicines" element={<AdminRoute element={<MedicineList />} />} />
              <Route path="/admin/users" element={<AdminRoute element={<Users />} />} />
              <Route path="/admin/payments" element={<AdminRoute element={<PaymentValidation />} />} />
              
              {/* User Routes */}
              <Route path="/shop" element={<UserRoute element={<Shop />} />} />
              <Route path="/shop/medicine/:id" element={<UserRoute element={<ProductDetails />} />} />
              <Route path="/cart" element={<UserRoute element={<Cart />} />} />
              
              {/* Shared Protected Routes */}
              <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
              
              {/* Root Route - Redirect to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Payment Routes */}
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/failed" element={<PaymentFailed />} />
            </Routes>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}