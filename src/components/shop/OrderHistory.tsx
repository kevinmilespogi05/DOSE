import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

interface OrderItem {
  medicine_id: number;
  quantity: number;
  unit_price: number;
  medicine_name: string;
}

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!isAuthenticated) {
          throw new Error('Not authenticated');
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get('/api/orders/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setOrders(response.data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load order history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated]);

  const handleTrackOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Order #{order.id}</h2>
                  <p className="text-sm text-gray-600">
                    {format(new Date(order.created_at), 'PPP')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    ₱{order.total_amount.toFixed(2)}
                  </p>
                  <span className={`px-2 py-1 rounded text-sm ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'payment_submitted' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium mb-2">Items:</h3>
                <ul className="space-y-2">
                  {order.items && order.items.map((item) => (
                    <li key={item.medicine_id} className="flex justify-between">
                      <span>{item.medicine_name}</span>
                      <span>
                        {item.quantity} × ₱{item.unit_price.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleTrackOrder(order.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Track Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory; 