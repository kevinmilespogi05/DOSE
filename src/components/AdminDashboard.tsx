import React from 'react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign,
  Users,
  ShoppingCart
} from 'lucide-react';

const AdminDashboard = () => {
  const stats = [
    {
      title: 'Total Sales',
      value: '$12,456',
      icon: DollarSign,
      change: '+12.5%',
      color: 'bg-green-500',
    },
    {
      title: 'Low Stock Items',
      value: '23',
      icon: AlertTriangle,
      change: '5 critical',
      color: 'bg-red-500',
    },
    {
      title: 'Total Inventory',
      value: '1,234',
      icon: Package,
      change: '45 categories',
      color: 'bg-blue-500',
    },
    {
      title: 'Monthly Revenue',
      value: '$34,567',
      icon: TrendingUp,
      change: '+8.2%',
      color: 'bg-purple-500',
    },
    {
      title: 'Active Users',
      value: '456',
      icon: Users,
      change: '+15 this week',
      color: 'bg-yellow-500',
    },
    {
      title: 'Orders',
      value: '89',
      icon: ShoppingCart,
      change: '12 pending',
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">Welcome back, Admin!</h2>
        <p className="text-gray-600">Here's what's happening with your pharmacy today.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">
                    {stat.value}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Orders
          </h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b pb-4"
              >
                <div>
                  <p className="font-medium">Order #{1000 + index}</p>
                  <p className="text-sm text-gray-500">3 items • Processing</p>
                </div>
                <p className="font-semibold text-green-600">$123.45</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Low Stock Alert
          </h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b pb-4"
              >
                <div>
                  <p className="font-medium">Medicine {index + 1}</p>
                  <p className="text-sm text-gray-500">5 units left</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  Reorder
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;