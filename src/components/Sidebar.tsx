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
  LogOut,
  ShoppingBag,
  CreditCard,
  PieChart,
  FileText,
  FileCheck,
  Heart,
  Truck,
  Percent,
  Tag,
  Ticket,
  Gift,
  TagsIcon,
  BarChart2,
  Star,
  ChevronDown,
  ChevronRight,
  Layers,
  PackageCheck
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { isAdmin, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    main: true,
    catalog: false,
    marketing: false,
    operations: false
  });
  
  // Reorganized admin menu items into categories
  const adminMenuCategories = [
    {
      id: 'main',
      label: 'Main',
      items: [
        { icon: Home, label: 'Dashboard', path: '/admin' },
        { icon: BarChart2, label: 'Analytics', path: '/admin/analytics' },
        { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
      ]
    },
    {
      id: 'catalog',
      label: 'Catalog',
      items: [
        { icon: Package, label: 'Medicines', path: '/admin/medicines' },
        { icon: PieChart, label: 'Prescriptions', path: '/admin/prescriptions' },
        { icon: Star, label: 'Ratings', path: '/admin/rating-moderation' },
        { icon: PackageCheck, label: 'Inventory', path: '/inventory' },
      ]
    },
    {
      id: 'marketing',
      label: 'Marketing',
      items: [
        { icon: Ticket, label: 'Coupons', path: '/admin/coupons' },
        { icon: Gift, label: 'Promotions', path: '/admin/promotions' },
      ]
    },
    {
      id: 'operations',
      label: 'Operations',
      items: [
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: FileCheck, label: 'Returns', path: '/admin/returns' },
        { icon: Truck, label: 'Shipping', path: '/admin/shipping' },
        { icon: Percent, label: 'Tax Rates', path: '/admin/tax-rates' },
        { icon: TrendingUp, label: 'Reports', path: '/admin/reports' },
      ]
    }
  ];

  const userMenuItems = [
    { icon: ShoppingCart, label: 'Shop', path: '/shop' },
    { icon: Gift, label: 'Promotions', path: '/promotions' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    { icon: History, label: 'Order History', path: '/order-history' },
    { icon: ShoppingBag, label: 'Cart', path: '/cart' },
    { icon: FileText, label: 'Prescriptions', path: '/prescriptions' },
    { icon: UserCog, label: 'Profile', path: '/profile' },
  ];

  const toggleCategory = (categoryId) => {
    setExpandedCategories({
      ...expandedCategories,
      [categoryId]: !expandedCategories[categoryId]
    });
  };

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
          <div className="space-y-2">
            {isAdmin ? (
              // Admin Menu with categories
              adminMenuCategories.map((category) => (
                <div key={category.id} className="mb-3">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 rounded-md"
                  >
                    <div className="flex items-center">
                      <Layers className="w-4 h-4 mr-2" />
                      <span>{category.label}</span>
                    </div>
                    {expandedCategories[category.id] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {expandedCategories[category.id] && (
                    <div className="mt-1 ml-2 space-y-1">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            className={`
                              flex items-center px-4 py-2 rounded-md text-sm
                              transition-all duration-200 group relative
                              ${isActive 
                                ? 'bg-primary-50 text-primary-600 shadow-soft' 
                                : 'hover:bg-gray-50 hover:text-primary-600'
                              }
                            `}
                          >
                            <Icon className={`
                              w-4 h-4 mr-3 transition-transform duration-200 
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
                    </div>
                  )}
                </div>
              ))
            ) : (
              // User Menu - no categories
              userMenuItems.map((item) => {
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
              })
            )}
            
            {/* Logout Button */}
            <button
              onClick={() => {
                setIsMobileOpen(false);
                logout();
              }}
              className="w-full flex items-center px-4 py-3 mt-6 rounded-md text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
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