import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const UnauthorizedAccess: React.FC = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, isAdmin } = useAuth();

  const handleGoToHome = () => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/shop');
      }
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="bg-red-100 p-6 rounded-full mb-6">
        <ShieldAlert className="h-16 w-16 text-red-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Unauthorized Access</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        You don't have permission to access this page. This could be due to an expired session or insufficient privileges.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleGoToHome}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Home className="h-5 w-5" />
          Go to Home
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedAccess; 