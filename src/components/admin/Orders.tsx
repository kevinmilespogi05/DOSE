import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface OrderItem {
  medicine_id: number;
  quantity: number;
  unit_price: number;
  medicine_name: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get('/api/admin/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setOrders(response.data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.put(`/api/admin/orders/${orderId}/status`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus } 
          : order
      ));
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    }
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

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>
      
      {orders.filter(order => order.status === 'payment_submitted').length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No orders pending approval found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-3 px-4 text-left">Order ID</th>
                <th className="py-3 px-4 text-left">Customer</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Total</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.filter(order => order.status === 'payment_submitted').map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">{order.id}</td>
                  <td className="py-3 px-4">
                    {order.user ? (
                      <>
                        <div>{order.user.name}</div>
                        <div className="text-sm text-gray-500">{order.user.email}</div>
                      </>
                    ) : (
                      <span className="text-gray-400">Unknown</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {format(new Date(order.created_at), 'PPP')}
                  </td>
                  <td className="py-3 px-4 font-medium">
                    ₱{Number(order.total_amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'payment_submitted' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button 
                        className="text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1 text-sm"
                        onClick={() => {
                          const details = order.items.map(item => 
                            `${item.medicine_name} (${item.quantity} x ₱${Number(item.unit_price).toFixed(2)})`
                          ).join('\n');
                          alert(`Order Items:\n${details}`);
                        }}
                      >
                        Details
                      </button>
                      
                      {order.status === 'payment_submitted' && (
                        <button 
                          className="text-white bg-green-600 hover:bg-green-700 rounded px-3 py-1 text-sm"
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                        >
                          Complete
                        </button>
                      )}
                      
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <button 
                          className="text-white bg-red-600 hover:bg-red-700 rounded px-3 py-1 text-sm"
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders; 