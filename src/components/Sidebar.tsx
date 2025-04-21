import React, { useState } from 'react';
import { 
  Pill, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Settings,
  Home,
  Package,
  ClipboardList,
  UserCog,
  Receipt,
  History,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { isAdmin, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const adminMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: Package, label: 'Inventory', path: '/admin/inventory' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    { icon: ClipboardList, label: 'Products', path: '/admin/products' },
    { icon: UserCog, label: 'Suppliers', path: '/admin/suppliers' },
    { icon: TrendingUp, label: 'Reports', path: '/admin/reports' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
    { icon: Package, label: 'Medicines', path: '/admin/medicines' },
  ];

  const userMenuItems = [
    { icon: ShoppingCart, label: 'Shop', path: '/shop' },
    { icon: History, label: 'Order History', path: '/order-history' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        {isMobileOpen ? (
          <X className="h-6 w-6 transition-transform duration-200 rotate-0 hover:rotate-90" />
        ) : (
          <Menu className="h-6 w-6 transition-transform duration-200 hover:scale-110" />
        )}
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          h-[100dvh] w-64 bg-white shadow-soft
          transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          flex flex-col
        `}
      >
        <div className="p-6 flex-shrink-0">
          <Link to="/" className="block group">
            <h1 className="text-2xl font-bold text-primary-600 transition-colors duration-200 group-hover:text-primary-700">DOSE</h1>
            <p className="text-sm text-gray-600 mt-1 transition-colors duration-200 group-hover:text-gray-700">
              {isAdmin ? 'Admin Panel' : 'User Dashboard'}
            </p>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center px-4 py-3 rounded-md text-gray-700 
                    transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-primary-50 text-primary-600 shadow-soft' 
                      : 'hover:bg-gray-50 hover:text-primary-600'
                    }
                  `}
                >
                  <Icon className={`
                    w-5 h-5 mr-3 transition-transform duration-200 
                    ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-600'} 
                    group-hover:scale-110
                  `} />
                  <span className={`
                    font-medium transition-colors duration-200
                    ${isActive ? 'text-primary-600' : 'text-gray-700 group-hover:text-primary-600'}
                  `}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute inset-y-0 left-0 w-1 bg-primary-600 rounded-r-full transition-transform duration-200 transform scale-y-100" />
                  )}
                </Link>
              );
            })}
            
            {/* Logout Button */}
            <button
              onClick={() => {
                setIsMobileOpen(false);
                logout();
              }}
              className="w-full flex items-center px-4 py-3 rounded-md text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 mr-3 text-gray-500 group-hover:text-red-600 transition-colors duration-200" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;