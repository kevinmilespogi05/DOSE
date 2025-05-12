import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { showConfirmation, showSuccess, showError, showLoading, closeAlert, showInfo } from '../../utils/swalUtil';

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
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  // Filter orders based on selected status
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  // Count orders by status
  const orderCounts = {
    all: orders.length,
    pending_payment: orders.filter(order => order.status === 'pending_payment').length,
    payment_submitted: orders.filter(order => order.status === 'payment_submitted').length,
    payment_approved: orders.filter(order => order.status === 'payment_approved').length,
    processing: orders.filter(order => order.status === 'processing').length,
    completed: orders.filter(order => order.status === 'completed').length,
    cancelled: orders.filter(order => order.status === 'cancelled').length
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const actionText = newStatus === 'completed' ? 'complete' : 'cancel';
    const result = await showConfirmation(
      `${newStatus === 'completed' ? 'Complete' : 'Cancel'} Order`,
      `Are you sure you want to ${actionText} this order?`,
      `Yes, ${actionText} it`,
      'No, keep current status'
    );

    if (result.isConfirmed) {
      showLoading(`${newStatus === 'completed' ? 'Completing' : 'Cancelling'} order...`);
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

        closeAlert();
        showSuccess(
          `Order ${newStatus === 'completed' ? 'Completed' : 'Cancelled'}`,
          `Order #${orderId} has been ${newStatus === 'completed' ? 'completed' : 'cancelled'} successfully.`
        );
      } catch (err) {
        console.error('Error updating order status:', err);
        closeAlert();
        showError('Error', 'Failed to update order status. Please try again.');
      }
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

  const showOrderDetails = (order: Order) => {
    const items = order.items.map(item => 
      `<div class="ml-4 mb-2">• ${item.medicine_name} (${item.quantity} × ₱${Number(item.unit_price).toFixed(2)})</div>`
    ).join('');

    showInfo(
      `Order Details - #${order.id.substring(0, 8)}`,
      `<div style="text-align: left;">
        <p class="mb-2"><strong>Date:</strong> ${format(new Date(order.created_at), 'PPP')}</p>
        <p class="mb-2"><strong>Customer:</strong> ${order.user ? order.user.name : 'Unknown'}</p>
        <p class="mb-2"><strong>Status:</strong> ${formatStatus(order.status)}</p>
        <p class="mb-2"><strong>Items:</strong></p>
        ${items}
        <p class="mt-4 pt-2 border-t"><strong>Total:</strong> ₱${Number(order.total_amount).toFixed(2)}</p>
      </div>`
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-7 gap-3">
        <div 
          className={`cursor-pointer p-3 rounded-lg text-center ${statusFilter === 'all' ? 'bg-primary-100 border-2 border-primary-500' : 'bg-gray-100 hover:bg-gray-200'}`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="font-bold">All</div>
          <div className="text-xl">{orderCounts.all}</div>
        </div>
        <div 
          className={`cursor-pointer p-3 rounded-lg text-center ${statusFilter === 'pending_payment' ? 'bg-yellow-100 border-2 border-yellow-500' : 'bg-gray-100 hover:bg-gray-200'}`}
          onClick={() => setStatusFilter('pending_payment')}
        >
          <div className="font-bold">Pending</div>
          <div className="text-xl">{orderCounts.pending_payment}</div>
        </div>
        <div 
          className={`cursor-pointer p-3 rounded-lg text-center ${statusFilter === 'payment_submitted' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100 hover:bg-gray-200'}`}
          onClick={() => setStatusFilter('payment_submitted')}
        >
          <div className="font-bold">Submitted</div>
          <div className="text-xl">{orderCounts.payment_submitted}</div>
        </div>
        <div 
          className={`cursor-pointer p-3 rounded-lg text-center ${statusFilter === 'payment_approved' ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-gray-100 hover:bg-gray-200'}`}
          onClick={() => setStatusFilter('payment_approved')}
        >
          <div className="font-bold">Approved</div>
          <div className="text-xl">{orderCounts.payment_approved}</div>
        </div>
        <div 
          className={`cursor-pointer p-3 rounded-lg text-center ${statusFilter === 'processing' ? 'bg-purple-100 border-2 border-purple-500' : 'bg-gray-100 hover:bg-gray-200'}`}
          onClick={() => setStatusFilter('processing')}
        >
          <div className="font-bold">Processing</div>
          <div className="text-xl">{orderCounts.processing}</div>
        </div>
        <div 
          className={`cursor-pointer p-3 rounded-lg text-center ${statusFilter === 'completed' ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100 hover:bg-gray-200'}`}
          onClick={() => setStatusFilter('completed')}
        >
          <div className="font-bold">Completed</div>
          <div className="text-xl">{orderCounts.completed}</div>
        </div>
        <div 
          className={`cursor-pointer p-3 rounded-lg text-center ${statusFilter === 'cancelled' ? 'bg-red-100 border-2 border-red-500' : 'bg-gray-100 hover:bg-gray-200'}`}
          onClick={() => setStatusFilter('cancelled')}
        >
          <div className="font-bold">Cancelled</div>
          <div className="text-xl">{orderCounts.cancelled}</div>
        </div>
      </div>
      
      {filteredOrders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No orders found for the selected filter.</p>
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
              {filteredOrders.map((order) => (
                <tr key={order.id} className={`hover:bg-gray-50 ${order.status === 'completed' ? 'bg-green-50' : ''}`}>
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
                      order.status === 'payment_approved' ? 'bg-indigo-100 text-indigo-800' :
                      order.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button 
                        className="text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1 text-sm"
                        onClick={() => showOrderDetails(order)}
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