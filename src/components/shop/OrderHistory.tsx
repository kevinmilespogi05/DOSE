import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, Download, Eye, X } from 'lucide-react';

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!isAuthenticated) {
          throw new Error('Not authenticated');
        }

        const response = await api.get('/orders/history');
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

  const handlePreviewInvoice = async (orderId: string) => {
    try {
      // First generate the invoice if not already generated
      await api.post(`/invoices/${orderId}/generate`);

      // Set the preview URL with token
      const token = localStorage.getItem('token');
      const url = `${api.defaults.baseURL}/invoices/${orderId}/preview?token=${token}`;
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error previewing invoice:', error);
      setError('Failed to preview invoice. Please try again later.');
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      // First generate the invoice if not already generated
      await api.post(`/invoices/${orderId}/generate`);

      // Then trigger the download with token
      const token = localStorage.getItem('token');
      window.open(`${api.defaults.baseURL}/invoices/${orderId}/download?token=${token}`, '_blank');
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      let errorMessage = 'Failed to download invoice. Please try again later.';
      
      // Check if it's an API error with a specific message
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>
      
      {/* Modal for PDF preview */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Invoice Preview</h2>
              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  setPreviewUrl('');
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={previewUrl}
                className="w-full h-full border-0 rounded"
                title="Invoice Preview"
              />
            </div>
          </div>
        </div>
      )}

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

              <div className="mt-4 flex justify-end space-x-4">
                <button
                  onClick={() => handleTrackOrder(order.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Track Order
                </button>

                {(order.status === 'completed' || order.status === 'payment_submitted') && (
                  <button
                    onClick={() => handleDownloadInvoice(order.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Invoice
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory; 