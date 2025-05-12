import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

interface OrderItem {
  id: number;
  medicine_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  unit: string;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_postal_code: string;
  shipping_cost: number;
  tax_amount: number;
  items: OrderItem[];
}

interface Review {
  id: number;
  medicine_id: number;
  rating: number;
  review_text: string;
  created_at: string;
  status: string;
}

const OrderHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewForm, setReviewForm] = useState({
    medicine_id: 0,
    rating: 5,
    review_text: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/user/orders');
      setOrders(response.data);
    } catch (err) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/cancel`);
      fetchOrders();
    } catch (err) {
      setError('Failed to cancel order');
    }
  };

  const submitReview = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/reviews`, reviewForm);
      setReviewForm({
        medicine_id: 0,
        rating: 5,
        review_text: ''
      });
      setSelectedOrder(null);
    } catch (err) {
      setError('Failed to submit review');
    }
  };

  const handleReviewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReviewForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Order History</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${order.total_amount.toFixed(2)}</p>
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Shipping Address</h4>
                <p className="text-gray-600">
                  {order.shipping_address}<br />
                  {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}<br />
                  {order.shipping_country}
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} {item.unit} × ${item.unit_price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                {order.status === 'pending_payment' && (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Cancel Order
                  </button>
                )}

                {order.status === 'completed' && (
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Write Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Write a Review</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Product
              </label>
              <select
                name="medicine_id"
                value={reviewForm.medicine_id}
                onChange={handleReviewChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select a product</option>
                {selectedOrder.items.map(item => (
                  <option key={item.medicine_id} value={item.medicine_id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <select
                name="rating"
                value={reviewForm.rating}
                onChange={handleReviewChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {[5, 4, 3, 2, 1].map(rating => (
                  <option key={rating} value={rating}>
                    {rating} {rating === 1 ? 'Star' : 'Stars'}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review
              </label>
              <textarea
                name="review_text"
                value={reviewForm.review_text}
                onChange={handleReviewChange}
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Write your review here..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => submitReview(selectedOrder.id)}
                disabled={!reviewForm.medicine_id}
                className={`px-4 py-2 rounded-md ${
                  reviewForm.medicine_id
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory; 