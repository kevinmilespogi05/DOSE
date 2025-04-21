import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

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
        if (!isAuthenticated) {
          throw new Error('Not authenticated');
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Get order details from location state
        const { orderId, amount } = location.state;
        if (!orderId || !amount) {
          throw new Error('Missing order details');
        }

        // Create GCash payment source
        const response = await axios.post('/api/payments/create-source', {
          orderId,
          amount
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const { checkoutUrl, sourceId } = response.data;
        setCheckoutUrl(checkoutUrl);

        // Start polling for payment status
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await axios.post('/api/payments/verify', {
              sourceId
            }, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            const { status } = statusResponse.data;

            if (status === 'paid') {
              clearInterval(pollInterval);
              navigate('/payment/success');
            } else if (status === 'failed') {
              clearInterval(pollInterval);
              navigate('/payment/failed');
            }
          } catch (err) {
            console.error('Error checking payment status:', err);
          }
        }, 5000); // Poll every 5 seconds

        // Cleanup interval on unmount
        return () => clearInterval(pollInterval);
      } catch (err) {
        console.error('Error processing payment:', err);
        setError('Failed to process payment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [isAuthenticated, location.state, navigate]);

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