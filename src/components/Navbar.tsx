import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, User, LogOut, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-soft sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <h1 className="text-2xl font-bold text-primary-600 transition-colors duration-200 group-hover:text-primary-700">DOSE</h1>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 transition-transform duration-200 rotate-0 hover:rotate-90" />
              ) : (
                <Menu className="h-6 w-6 transition-transform duration-200 hover:scale-110" />
              )}
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  to="/cart"
                  className="p-2 text-gray-600 hover:text-primary-600 relative transition-colors duration-200 group"
                >
                  <ShoppingCart className="w-6 h-6 transition-transform group-hover:scale-110" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs animate-pulse-subtle">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors duration-200 group"
                >
                  <User className="w-6 h-6 transition-transform group-hover:scale-110" />
                  <span className="font-medium">{user.firstName}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors duration-200 group"
                >
                  <LogOut className="w-6 h-6 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary-600 px-4 py-2 transition-colors duration-200 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-all duration-200 transform hover:shadow-hover font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`lg:hidden transition-all duration-300 ease-in-out transform ${
          isMobileMenuOpen 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-soft">
          {user ? (
            <>
              <Link
                to="/cart"
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
              >
                <ShoppingCart className="w-6 h-6" />
                <span className="font-medium">Cart</span>
                {cartCount > 0 && (
                  <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs animate-pulse-subtle">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
              >
                <User className="w-6 h-6" />
                <span className="font-medium">Profile</span>
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
              >
                <LogOut className="w-6 h-6" />
                <span className="font-medium">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors duration-200 font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-md transition-all duration-200 transform hover:shadow-hover font-medium"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;