import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSource } from '../../utils/paymongo';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

interface PaymongoCheckoutProps {
  orderId: string;
  amount: number;
  onClose: () => void;
}

const PaymongoCheckout: React.FC<PaymongoCheckoutProps> = ({ orderId, amount, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'gcash' | 'grab_pay'>('gcash');
  const navigate = useNavigate();

  // Create a custom axios instance for backend API calls
  const apiClient = axios.create({
    baseURL: window.location.origin,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add request interceptor to handle token
  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Add response interceptor to handle token refresh
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No token found');
          }

          const response = await axios.post('/api/auth/refresh', {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const newToken = response.data.token;
          localStorage.setItem('token', newToken);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // If refresh fails, redirect to login
          localStorage.removeItem('token');
          navigate('/login');
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Validate amount
      if (amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Validate authentication
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to continue with payment');
      }

      console.log('Creating payment source for amount:', amount);
      const source = await createSource(amount, selectedMethod);
      
      if (!source || !source.attributes || !source.attributes.redirect) {
        throw new Error('Invalid payment source response');
      }

      // Create payment record in backend
      await apiClient.post('/api/payments/create-source', {
        orderId,
        amount,
        sourceId: source.id
      });

      // Store payment details for verification
      localStorage.setItem('pendingOrderId', orderId);
      localStorage.setItem('pendingSourceId', source.id);
      
      console.log('Redirecting to payment provider:', source.attributes.redirect.checkout_url);
      // Redirect to payment provider
      window.location.href = source.attributes.redirect.checkout_url;
    } catch (err: any) {
      console.error('Payment error:', err.response?.data || err.message);
      setError(err instanceof Error ? err.message : 'Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: 'gcash',
      name: 'GCash',
      icon: '💳',
      description: 'Pay with your GCash wallet'
    },
    {
      id: 'grab_pay',
      name: 'GrabPay',
      icon: '🚗',
      description: 'Pay with your GrabPay wallet'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Select Payment Method</h2>
        
        {isProcessing && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="ml-2">Processing payment...</span>
          </div>
        )}

        {!isProcessing && (
          <>
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id as 'gcash' | 'grab_pay')}
                  className={`w-full flex items-center p-4 border rounded-lg transition-all ${
                    selectedMethod === method.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-600'
                  }`}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <div className="ml-4 flex-1 text-left">
                    <p className="font-medium text-gray-900">{method.name}</p>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ml-4 ${
                    selectedMethod === method.id
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedMethod === method.id && (
                      <div className="w-full h-full rounded-full bg-white transform scale-50" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="mt-6 flex space-x-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}
              >
                Proceed to Payment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymongoCheckout; 