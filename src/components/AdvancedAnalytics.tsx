import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Clock,
  ShoppingBag
} from 'lucide-react';

interface TopSellingProduct {
  id: string;
  name: string;
  total_sold: number;
  total_revenue: number;
  order_count: number;
  unique_customers: number;
  avg_quantity_per_order: number;
  first_sale: string;
  last_sale: string;
}

interface SalesTrend {
  date: string;
  total_orders: number;
  total_items_sold: number;
  total_revenue: number;
  unique_customers: number;
  avg_order_value: number;
  day_of_week: string;
  hour_of_day: number;
}

interface InventoryMetric {
  id: string;
  name: string;
  stock_quantity: number;
  reorder_threshold: number;
  total_sold_30_days: number;
  days_of_inventory_left: number | null;
  suggested_reorder_point: number;
  avg_daily_sales: number;
}

interface CustomerInsight {
  total_customers: number;
  avg_orders_per_customer: number;
  avg_customer_lifetime_value: number;
  avg_customer_lifespan_days: number;
  avg_unique_products_per_customer: number;
  returning_customers: number;
  customer_retention_rate: number;
}

interface AnalyticsData {
  topSelling: TopSellingProduct[];
  salesTrends: SalesTrend[];
  inventoryAnalytics: InventoryMetric[];
  customerInsights: CustomerInsight;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdvancedAnalytics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/unauthorized');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const response = await api.get('/inventory/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Analytics response:', response.data);
        if (!response.data) {
          setError('No data returned from analytics API');
          setLoading(false);
          return;
        }
        
        // Check if data is structured correctly
        const requiredKeys = ['topSelling', 'salesTrends', 'inventoryAnalytics', 'customerInsights'];
        const missingKeys = requiredKeys.filter(key => !response.data[key]);
        if (missingKeys.length > 0) {
          console.error('Missing required data keys:', missingKeys);
          setError(`Incomplete data received from API: missing ${missingKeys.join(', ')}`);
          setLoading(false);
          return;
        }
        
        setData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, navigate]);

  const formatCurrency = (value: number): string => {
    return '₱' + value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !data) {
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
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sales Overview Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Sales Overview</h3>
            <DollarSign className="w-6 h-6 text-green-500" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Revenue (30 days)</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(data.salesTrends.reduce((sum, day) => sum + day.total_revenue, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Order Value</p>
              <p className="text-xl font-semibold text-gray-800">
                {formatCurrency(data.salesTrends.reduce((sum, day) => sum + day.avg_order_value, 0) / data.salesTrends.length)}
              </p>
            </div>
          </div>
          <div className="mt-6 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.salesTrends.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total_revenue" stroke="#0088FE" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Top Products</h3>
            <ShoppingBag className="w-6 h-6 text-blue-500" />
          </div>
          <div className="space-y-4">
            {data.topSelling.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.total_sold} units sold</p>
                </div>
                <p className="font-semibold text-gray-800">{formatCurrency(product.total_revenue)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topSelling.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_sold" fill="#0088FE" name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Health Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Inventory Health</h3>
            <Package className="w-6 h-6 text-purple-500" />
          </div>
          <div className="space-y-4">
            {data.inventoryAnalytics.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.days_of_inventory_left 
                      ? `${item.days_of_inventory_left} days left`
                      : 'No recent sales'}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-sm ${
                  item.stock_quantity <= item.reorder_threshold
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {item.stock_quantity} in stock
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Low Stock', value: data.inventoryAnalytics.filter(i => i.stock_quantity <= i.reorder_threshold).length },
                    { name: 'Healthy Stock', value: data.inventoryAnalytics.filter(i => i.stock_quantity > i.reorder_threshold).length }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {data.inventoryAnalytics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Customer Insights Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Customer Insights</h3>
          <Users className="w-6 h-6 text-indigo-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-600">Total Customers</p>
            <p className="text-2xl font-bold text-indigo-900">{data.customerInsights.total_customers}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">Customer Retention</p>
            <p className="text-2xl font-bold text-green-900">{data.customerInsights.customer_retention_rate}%</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600">Avg. Lifetime Value</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(data.customerInsights.avg_customer_lifetime_value)}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600">Avg. Orders</p>
            <p className="text-2xl font-bold text-purple-900">{data.customerInsights.avg_orders_per_customer}</p>
          </div>
        </div>
      </div>

      {/* Sales Patterns Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Sales Patterns</h3>
          <Clock className="w-6 h-6 text-orange-500" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Sales by Day of Week</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day_of_week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_orders" fill="#8884d8" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Sales by Hour</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.salesTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour_of_day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total_revenue" stroke="#82ca9d" name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics; 