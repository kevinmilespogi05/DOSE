import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// Create a custom axios instance without the interceptor that redirects to login
const paymentAxios = axios.create({
  baseURL: window.location.origin,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Disable automatic redirect on error
paymentAxios.interceptors.response.use(
  response => response,
  error => {
    // Just log the error without redirecting
    console.error('Payment API Error:', error);
    // Return the rejected promise to let component handle the error
    return Promise.reject(error);
  }
);

const Payment = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processPayment = async () => {
      try {
        console.log('Starting payment process...');
        if (!isAuthenticated) {
          throw new Error('Not authenticated');
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Get order details from location state
        const { orderId, amount } = location.state || {};
        console.log('Order details:', { orderId, amount });
        
        if (!orderId || !amount) {
          throw new Error('Missing order details');
        }

        // Create GCash payment source
        try {
          console.log('Calling payment API...');
          
          const response = await paymentAxios.post('/api/payments/create-source', {
            orderId,
            amount
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('Payment API response:', response.data);
          
          const { checkoutUrl, sourceId } = response.data;
          setCheckoutUrl(checkoutUrl);
          console.log('Checkout URL:', checkoutUrl);

          // Start polling for payment status
          const pollInterval = setInterval(async () => {
            try {
              const statusResponse = await paymentAxios.post('/api/payments/verify', {
                sourceId
              }, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              const { status } = statusResponse.data;
              console.log('Payment status:', status);

              if (status === 'paid') {
                clearInterval(pollInterval);
                navigate('/payment/success');
              } else if (status === 'failed') {
                clearInterval(pollInterval);
                navigate('/payment/failed');
              }
            } catch (err) {
              console.error('Error checking payment status:', err);
              // Don't stop polling due to intermittent errors
            }
          }, 5000); // Poll every 5 seconds

          // Cleanup interval on unmount
          return () => clearInterval(pollInterval);
        } catch (apiError) {
          console.error('API Error Details:', {
            message: apiError.message,
            status: apiError.response?.status,
            data: apiError.response?.data,
            url: apiError.config?.url
          });
          
          // Capture the status code and detailed error message
          if (apiError.response) {
            const statusCode = apiError.response.status;
            const errorMessage = apiError.response.data?.message || 'Unknown error occurred';
            setError(`Error (${statusCode}): ${errorMessage}`);
            console.log(`Setting error: Error (${statusCode}): ${errorMessage}`);
          } else {
            setError('Failed to connect to payment server. Please try again.');
            console.log('Setting error: Failed to connect to payment server');
          }
          
          // Do not rethrow the error - handle it here
        }
      } catch (err) {
        console.error('General processing error:', err);
        setLoading(false);
        // Error is already set in the nested try-catch
        if (!error) {
          setError('Failed to process payment. Please try again.');
          console.log('Setting fallback error message');
        }
      } finally {
        setLoading(false);
        console.log('Payment process completed, loading set to false');
      }
    };

    processPayment();
  }, [isAuthenticated, location.state, navigate, error]);

  console.log('Render state:', { loading, error, checkoutUrl });

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
        <div className="text-red-600 mb-4 text-lg font-semibold">{error}</div>
        <div className="mb-4">
          <p className="mb-2">Please check the console for more details (Press F12 to open developer tools).</p>
          <p className="text-sm text-gray-600">Error Code: 404 - API endpoint not found. This means the payment service is not available or misconfigured.</p>
        </div>
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Complete Your Payment</h1>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            You will be redirected to GCash to complete your payment.
          </p>
          <button
            onClick={() => window.location.href = checkoutUrl}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Proceed to GCash
          </button>
        </div>

        <div className="text-sm text-gray-500">
          <p>Note: Please do not close this window while the payment is being processed.</p>
          <p>You will be automatically redirected once the payment is completed.</p>
        </div>
      </div>
    </div>
  );
};

export default Payment; 