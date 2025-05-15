import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Minus, Plus, Trash2, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import PaymongoCheckout from '../payment/PaymongoCheckout';
import { formatPeso } from '../../utils/currency';
import { Link } from 'react-router-dom';
import { payMongoStatus } from '../../utils/paymongo';
import CouponForm from './CouponForm';

interface CartItem {
  id: number;
  medicine_id: number;
  name: string;
  price: string | number;
  quantity: number;
  unit: string;
  image_url?: string;
  requires_prescription: boolean;
  stock_quantity?: number;
}

interface ShippingMethod {
  id: number;
  name: string;
  base_cost: number;
  estimated_days: number;
}

interface CouponData {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { user } = useAuth();
  const { updateCartCount } = useCart();
  const [prescriptionValidationError, setPrescriptionValidationError] = useState<string | null>(null);
  const [hasApprovedPrescriptions, setHasApprovedPrescriptions] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    state: '',
    country: 'Philippines',
    postal_code: ''
  });
  const [taxRate, setTaxRate] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  useEffect(() => {
    fetchCartItems();
    fetchShippingMethods();
  }, []);

  useEffect(() => {
    if (cartItems.some(item => item.requires_prescription)) {
      checkApprovedPrescriptions();
    }
  }, [cartItems]);

  useEffect(() => {
    // Calculate subtotal whenever cart items change
    const newSubtotal = calculateSubtotal();
    setSubtotal(newSubtotal);
  }, [cartItems]);

  useEffect(() => {
    // Fetch tax rate when shipping address state changes
    if (shippingAddress.state && shippingAddress.country) {
      fetchTaxRate();
    }
  }, [shippingAddress.state, shippingAddress.country]);

  useEffect(() => {
    // Calculate tax amount whenever subtotal, shipping cost, discount, or tax rate changes
    calculateTaxAmount();
  }, [subtotal, selectedShippingMethod, discountAmount, taxRate]);

  const fetchCartItems = async () => {
    try {
      const response = await axios.get('/cart', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Fetch stock information for each cart item
      const updatedItems = await Promise.all(
        response.data.map(async (item) => {
          try {
            const stockResponse = await axios.get(`/medicines/${item.medicine_id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            return {
              ...item,
              stock_quantity: stockResponse.data.stock_quantity
            };
          } catch (err) {
            console.error(`Error fetching stock for medicine ${item.medicine_id}:`, err);
            return item;
          }
        })
      );
      
      setCartItems(updatedItems);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch cart items');
      setLoading(false);
    }
  };

  const fetchShippingMethods = async () => {
    try {
      const response = await axios.get('/shipping-methods', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setShippingMethods(response.data);
      if (response.data.length > 0) {
        setSelectedShippingMethod(response.data[0]);
      }
    } catch (err) {
      console.error('Error fetching shipping methods:', err);
    }
  };

  const fetchTaxRate = async () => {
    try {
      const response = await axios.get(
        `/tax-rates?country=${shippingAddress.country}&state=${shippingAddress.state}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.data && response.data.rate) {
        setTaxRate(response.data.rate);
      } else {
        setTaxRate(0);
      }
    } catch (err) {
      console.error('Error fetching tax rate:', err);
      setTaxRate(0);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      // Get the cart item to check its medicine_id
      const itemToUpdate = cartItems.find(item => item.id === itemId);
      if (!itemToUpdate) return;

      // Check available stock before updating quantity
      const stockCheckResponse = await axios.get(`/medicines/${itemToUpdate.medicine_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const availableStock = stockCheckResponse.data.stock_quantity;
      
      if (newQuantity > availableStock) {
        setError(`Only ${availableStock} units of ${itemToUpdate.name} are available`);
        return;
      }
      
      await axios.put(`/cart/items/${itemId}`, 
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
      setError(null);
    } catch (err) {
      setError('Failed to update quantity');
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await axios.delete(`/cart/items/${itemId}`, {
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

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const calculateTaxAmount = () => {
    const shippingCost = selectedShippingMethod ? selectedShippingMethod.base_cost : 0;
    // Apply tax after discounts
    const taxableAmount = Number(subtotal) - Number(discountAmount) + Number(shippingCost);
    const newTaxAmount = (taxableAmount * taxRate) / 100;
    setTaxAmount(newTaxAmount);
  };

  const calculateTotal = () => {
    const shippingCost = selectedShippingMethod ? Number(selectedShippingMethod.base_cost) : 0;
    return Number(subtotal) - Number(discountAmount) + shippingCost + Number(taxAmount);
  };

  const checkApprovedPrescriptions = async () => {
    try {
      const response = await axios.get('/prescriptions/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const hasApproved = response.data.some((p: any) => p.status === 'approved');
      setHasApprovedPrescriptions(hasApproved);
    } catch (err) {
      console.error('Error checking prescriptions:', err);
      setHasApprovedPrescriptions(false);
    }
  };

  const handleShippingMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const methodId = parseInt(e.target.value);
    const selectedMethod = shippingMethods.find(method => method.id === methodId) || null;
    setSelectedShippingMethod(selectedMethod);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateShippingAddress = () => {
    const { address, city, state, postal_code } = shippingAddress;
    if (!address.trim() || !city.trim() || !state.trim() || !postal_code.trim()) {
      return false;
    }
    return true;
  };

  const handleApplyCoupon = (couponData: CouponData) => {
    setAppliedCoupon(couponData);
    setDiscountAmount(couponData.discount_amount);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
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

      // Validate shipping method is selected
      if (!selectedShippingMethod) {
        setError('Please select a shipping method');
        return;
      }

      // Validate shipping address
      if (!validateShippingAddress()) {
        setError('Please provide a complete shipping address');
        setShowAddressForm(true);
        return;
      }

      // Validate prescription requirements
      const requiresPrescription = cartItems.some(item => item.requires_prescription);
      if (requiresPrescription && !hasApprovedPrescriptions) {
        setPrescriptionValidationError('Some items in your cart require a valid prescription. Please upload a prescription and wait for approval before proceeding.');
        return;
      } else {
        setPrescriptionValidationError(null);
      }

      // Validate all items have valid quantities
      const invalidItems = cartItems.filter(item => item.quantity < 1);
      if (invalidItems.length > 0) {
        setError('Some items have invalid quantities');
        return;
      }
      
      // Check stock availability for all items
      let stockError = false;
      for (const item of cartItems) {
        const stockCheckResponse = await axios.get(`/medicines/${item.medicine_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const availableStock = stockCheckResponse.data.stock_quantity;
        if (item.quantity > availableStock) {
          setError(`Insufficient stock for ${item.name}. Only ${availableStock} units available.`);
          stockError = true;
          break;
        }
      }
      
      if (stockError) {
        return;
      }

      // Validate Paymongo configuration
      if (!payMongoStatus.isConfigured) {
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
        user_id: user.id,
        shipping_address: shippingAddress.address,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state,
        shipping_country: shippingAddress.country,
        shipping_postal_code: shippingAddress.postal_code,
        shipping_method_id: selectedShippingMethod.id,
        shipping_cost: selectedShippingMethod.base_cost,
        tax_amount: taxAmount
      };

      // Add coupon code if one is applied
      if (appliedCoupon) {
        orderData.coupon_code = appliedCoupon.code;
      }

      console.log('Creating order with data:', orderData);

      const response = await axios.post('/orders', 
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
    
    // Clear cart items explicitly to handle any missed cases
    axios.delete('/cart/clear', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(() => {
      // Refresh cart items after payment processing
      fetchCartItems();
      // Update cart count in the navigation
      updateCartCount();
    }).catch(err => {
      console.error('Error clearing cart:', err);
      // Still try to refresh cart items and count
      fetchCartItems();
      updateCartCount();
    });
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
                        {item.stock_quantity && (
                          <p className={`text-sm ${item.stock_quantity < 5 ? 'text-red-500' : 'text-gray-500'}`}>
                            {item.stock_quantity} in stock
                          </p>
                        )}
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
                          className="p-1 rounded-md text-gray-500 hover:text-primary-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={item.stock_quantity !== undefined && item.quantity >= item.stock_quantity}
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

            {/* Shipping Address Form */}
            <div className="mt-6 bg-white shadow-soft rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Shipping Address</h2>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="text-primary-600 text-sm font-medium"
                >
                  {showAddressForm ? 'Hide' : 'Edit'}
                </button>
              </div>

              {showAddressForm ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={shippingAddress.address}
                      onChange={handleAddressChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleAddressChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleAddressChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleAddressChange}
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                      required
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      name="postal_code"
                      value={shippingAddress.postal_code}
                      onChange={handleAddressChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="text-gray-600">
                  {shippingAddress.address ? (
                    <>
                      <p>{shippingAddress.address}</p>
                      <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
                      <p>{shippingAddress.country}</p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">No shipping address provided</p>
                  )}
                </div>
              )}
            </div>

            {/* Shipping Methods */}
            <div className="mt-6 bg-white shadow-soft rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Method</h2>
              {shippingMethods.length > 0 ? (
                <div>
                  <select
                    value={selectedShippingMethod?.id || ''}
                    onChange={handleShippingMethodChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {shippingMethods.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.name} - {formatPeso(method.base_cost)} ({method.estimated_days} {method.estimated_days === 1 ? 'day' : 'days'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-gray-500">No shipping methods available</p>
              )}
            </div>

            {/* Coupon Form */}
            <div className="mt-6">
              <CouponForm 
                subtotal={subtotal}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={handleRemoveCoupon}
                appliedCoupon={appliedCoupon}
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white shadow-soft rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPeso(subtotal)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatPeso(discountAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {selectedShippingMethod 
                      ? formatPeso(selectedShippingMethod.base_cost)
                      : 'Select shipping method'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tax ({taxRate}%)</span>
                  <span className="font-medium">{formatPeso(taxAmount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-semibold">Total</span>
                    <span className="text-2xl font-bold">{formatPeso(calculateTotal())}</span>
                  </div>
                </div>
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

      {prescriptionValidationError && (
        <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Prescription Required</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{prescriptionValidationError}</p>
                <Link to="/prescriptions" className="mt-2 inline-block text-red-700 font-medium underline">
                  Upload your prescription here
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart; 