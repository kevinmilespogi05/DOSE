import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import OrderTracking from '../../components/order/OrderTracking';

interface OrderDetails {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`/orders/${orderId}`);
        setOrder(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details');
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center text-red-600 py-8">
        {error || 'Order not found'}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Order Details</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Order Information</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-medium">{order.id}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Date Placed</p>
                <p className="font-medium">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-medium">₱{order.total_amount.toFixed(2)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium capitalize">{order.status}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium mb-3">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₱{item.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <OrderTracking orderId={order.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails; 