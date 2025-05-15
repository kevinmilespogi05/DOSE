import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import OrderList from '../../components/admin/OrderList';
import UserList from '../../components/admin/UserList';
import ReturnRequests from '../../components/admin/ReturnRequests';
import RatingModeration from './RatingModeration';

const Dashboard: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <nav className="flex gap-4">
          <Link
            to="/admin"
            className={`px-4 py-2 rounded ${
              isActive('/admin')
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Orders
          </Link>
          <Link
            to="/admin/users"
            className={`px-4 py-2 rounded ${
              isActive('/admin/users')
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Users
          </Link>
          <Link
            to="/admin/returns"
            className={`px-4 py-2 rounded ${
              isActive('/admin/returns')
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Returns
          </Link>
          <Link
            to="/admin/ratings"
            className={`px-4 py-2 rounded ${
              isActive('/admin/ratings')
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Reviews
          </Link>
        </nav>
      </div>

      <Routes>
        <Route index element={<OrderList />} />
        <Route path="users" element={<UserList />} />
        <Route path="returns" element={<ReturnRequests />} />
        <Route path="ratings" element={<RatingModeration />} />
      </Routes>
    </div>
  );
};

export default Dashboard; 