import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import PaymongoCheckout from '../payment/PaymongoCheckout';
import { formatPeso } from '../../utils/currency';

interface CartItem {
  id: number;
  medicine_id: number;
  name: string;
  price: string | number;
  quantity: number;
  unit: string;
  image_url?: string;
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { user } = useAuth();
  const { updateCartCount } = useCart();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const response = await axios.get('/api/cart', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCartItems(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch cart items');
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await axios.put(`/api/cart/items/${itemId}`, 
        { quantity: newQuantity },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setCartItems(cartItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (err) {
      setError('Failed to update quantity');
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await axios.delete(`/api/cart/items/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setCartItems(cartItems.filter(item => item.id !== itemId));
      await updateCartCount();
    } catch (err) {
      setError('Failed to remove item');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const handleCheckout = async () => {
    try {
      // Validate cart is not empty
      if (cartItems.length === 0) {
        setError('Your cart is empty');
        return;
      }

      // Validate user is logged in
      if (!user) {
        setError('Please log in to complete your purchase');
        return;
      }

      // Validate all items have valid quantities
      const invalidItems = cartItems.filter(item => item.quantity < 1);
      if (invalidItems.length > 0) {
        setError('Some items have invalid quantities');
        return;
      }

      // Validate Paymongo configuration
      if (!import.meta.env.VITE_PAYMONGO_PUBLIC_KEY || !import.meta.env.VITE_PAYMONGO_SECRET_KEY) {
        console.error('Paymongo configuration missing');
        setError('Payment system is not properly configured. Please contact support.');
        return;
      }

      // Transform cart items to match backend expectations
      const orderItems = cartItems.map(item => ({
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        price_per_unit: typeof item.price === 'string' ? parseFloat(item.price) : item.price
      }));

      const totalAmount = calculateTotal();

      // Create order with additional metadata
      const orderData = {
        items: orderItems,
        total_amount: totalAmount,
        user_id: user.id
      };

      console.log('Creating order with data:', orderData);

      const response = await axios.post('/api/orders', 
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.orderId) {
        console.log('Order created successfully:', response.data.orderId);
        setOrderId(response.data.orderId);
        setShowPayment(true);
        setError(null); // Clear any previous errors
      } else {
        throw new Error('Failed to create order: No order ID received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      let errorMessage = 'Failed to process your order. Please try again.';
      
      if (err.response) {
        // Handle specific error cases
        if (err.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.message || 'Invalid order data. Please check your cart.';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        console.error('Server response:', err.response.data);
      }
      
      setError(errorMessage);
    }
  };

  const handleClosePayment = () => {
    setShowPayment(false);
    setOrderId(null);
    // Refresh cart items after successful payment
    fetchCartItems();
    updateCartCount();
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-600 text-center p-4">
      {error}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Your cart is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white shadow-soft rounded-lg overflow-hidden">
              {cartItems.map((item) => (
                <div key={item.id} className="p-6 border-b border-gray-200 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md">
                        <img
                          src={item.image_url || '/images/medicine-placeholder.png'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/medicine-placeholder.png';
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                        <p className="text-gray-600">{formatPeso(item.price)} per {item.unit}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1 rounded-md text-gray-500 hover:text-primary-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-md text-gray-500 hover:text-primary-600 hover:bg-gray-100"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="w-24 text-right">
                        {formatPeso(Number(item.price) * item.quantity)}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-gray-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white shadow-soft rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Total</span>
                <span className="text-2xl font-bold">{formatPeso(calculateTotal())}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 transition-colors duration-200"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayment && orderId && (
        <PaymongoCheckout
          orderId={orderId}
          amount={calculateTotal()}
          onClose={handleClosePayment}
        />
      )}
    </div>
  );
};

export default Cart; 