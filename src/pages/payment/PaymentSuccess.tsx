import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.headers.common['Content-Type'] = 'application/json';

const PaymentSuccess = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const orderId = localStorage.getItem('pendingOrderId');
        const sourceId = localStorage.getItem('pendingSourceId');
        const token = localStorage.getItem('token');

        if (!orderId || !sourceId) {
          throw new Error('Missing payment information');
        }

        if (!token) {
          throw new Error('Not authenticated');
        }

        // Set the Authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Verify payment with your backend
        await axios.post('/api/payments/verify', 
          {
            orderId,
            sourceId,
          }
        );

        // Clear pending payment data
        localStorage.removeItem('pendingOrderId');
        localStorage.removeItem('pendingSourceId');

        setIsProcessing(false);
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Failed to verify payment. Please contact support.');
        setIsProcessing(false);
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-soft p-8 text-center">
        {isProcessing ? (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-primary-600 animate-spin" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Verifying Payment
            </h2>
            <p className="mt-2 text-gray-600">
              Please wait while we verify your payment...
            </p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 mx-auto text-red-600">❌</div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Verification Failed
            </h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/orders')}
              className="mt-6 w-full py-3 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
            >
              View Orders
            </button>
          </>
        ) : (
          <>
            <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Payment Successful!
            </h2>
            <p className="mt-2 text-gray-600">
              Thank you for your payment. Your order has been confirmed.
            </p>
            <button
              onClick={() => navigate('/orders')}
              className="mt-6 w-full py-3 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
            >
              View Orders
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess; 