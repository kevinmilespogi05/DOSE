import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign,
  Users,
  ShoppingCart,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { showLoading, closeAlert, showError } from '../utils/swalUtil';

interface DashboardStat {
  title: string;
  value: number;
  change: string;
  isPositive: boolean;
}

interface RecentOrder {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  item_count: number;
}

interface LowStockMedicine {
  id: number;
  name: string;
  stock_quantity: number;
}

interface DashboardData {
  stats: DashboardStat[];
  recentOrders: RecentOrder[];
  lowStockMedicines: LowStockMedicine[];
}

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: [],
    recentOrders: [],
    lowStockMedicines: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      showLoading('Loading dashboard data...');
      try {
        const token = localStorage.getItem('token');
        console.log('Auth token available:', !!token);
        if (token) {
          // Log the token details (only first few characters for security)
          const tokenPreview = token.substring(0, 10) + '...';
          console.log('Token preview:', tokenPreview);
          
          try {
            // Try to decode the token to check if it's valid
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            console.log('Token expiry:', new Date(payload.exp * 1000).toLocaleString());
            console.log('Token user role:', payload.role || 'No role found in token');
          } catch (e) {
            console.error('Token decode error:', e);
          }
        }

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get('/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setDashboardData(response.data);
        setLoading(false);
        closeAlert();
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // More detailed error logging
        if (axios.isAxiosError(err)) {
          console.log('Status code:', err.response?.status);
          console.log('Error message:', err.response?.data?.message || err.message);
        }
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
        closeAlert();
        showError('Dashboard Error', 'Failed to load dashboard data. Please try again later.');
      }
    };

    fetchDashboardData();
  }, []);

  const icons = {
    'Total Sales': DollarSign,
    'Low Stock Items': AlertTriangle,
    'Total Inventory': Package,
    'Monthly Revenue': TrendingUp,
    'Active Users': Users,
    'Orders': ShoppingCart
  };

  const colorClasses = {
    'Total Sales': 'bg-green-500',
    'Low Stock Items': 'bg-red-500',
    'Total Inventory': 'bg-blue-500',
    'Monthly Revenue': 'bg-purple-500',
    'Active Users': 'bg-yellow-500',
    'Orders': 'bg-indigo-500'
  };

  const formatCurrency = (value: number): string => {
    return '₱' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatStatus = (status: string): string => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">Welcome back, Admin!</h2>
        <p className="text-gray-600">Here's what's happening with your pharmacy today.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardData.stats.map((stat, index) => {
          const IconComponent = icons[stat.title as keyof typeof icons];
          const colorClass = colorClasses[stat.title as keyof typeof colorClasses];
          
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">
                    {stat.title.includes('Revenue') || stat.title.includes('Sales') 
                      ? formatCurrency(stat.value)
                      : stat.value.toLocaleString()}
                  </h3>
                  <p className="flex items-center text-sm mt-1">
                    {stat.isPositive !== undefined && (
                      stat.isPositive ? (
                        <ArrowUp className="w-3 h-3 text-green-500 mr-1" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-red-500 mr-1" />
                      )
                    )}
                    <span className={stat.isPositive ? 'text-green-600' : 'text-gray-600'}>
                      {stat.change}
                    </span>
                  </p>
                </div>
                <div className={`${colorClass} p-3 rounded-full`}>
                  <IconComponent className="w-6 h-6 text-white" />
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
            {dashboardData.recentOrders.length > 0 ? (
              dashboardData.recentOrders.map((order, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <p className="font-medium">Order #{order.id.substring(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {order.item_count} {order.item_count === 1 ? 'item' : 'items'} • {formatStatus(order.status)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <p className="font-semibold text-green-600">{formatCurrency(Number(order.total_amount))}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No recent orders found</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Low Stock Alert
          </h3>
          <div className="space-y-4">
            {dashboardData.lowStockMedicines.length > 0 ? (
              dashboardData.lowStockMedicines.map((medicine, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <p className="font-medium">{medicine.name}</p>
                    <p className="text-sm text-gray-500">
                      {medicine.stock_quantity} {medicine.stock_quantity === 1 ? 'unit' : 'units'} left
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800">
                    Reorder
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No low stock items found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;