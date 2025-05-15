import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import api from '../../lib/api';

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
          throw new Error('Authentication required');
        }

        try {
          // Verify payment with backend using the configured API instance
          const response = await api.post('/payments/verify', {
            orderId,
            sourceId
          });

          if (response.data.status === 'paid' || response.data.status === 'processing') {
            // Clear pending payment data
            localStorage.removeItem('pendingOrderId');
            localStorage.removeItem('pendingSourceId');

            setIsProcessing(false);
          } else {
            throw new Error(`Payment status: ${response.data.status}`);
          }
        } catch (apiError: any) {
          // Handle the case where payment already exists
          if (apiError.response?.status === 400 && apiError.response?.data?.message === 'Payment already exists for this order') {
            // This is actually a success case - the payment was already processed
            localStorage.removeItem('pendingOrderId');
            localStorage.removeItem('pendingSourceId');
            setIsProcessing(false);
          } else {
            throw apiError;
          }
        }
      } catch (err: any) {
        console.error('Payment verification error:', err.response?.data || err.message);
        setError(err instanceof Error ? err.message : 'Failed to verify payment. Please contact support.');
        setIsProcessing(false);
      }
    };

    verifyPayment();
  }, [navigate]);

  const handleClose = () => {
    navigate('/order-history');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleClose}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            View Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {isProcessing ? (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-primary-600 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Processing Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </>
        ) : (
          <>
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">Thank you for your purchase. Your order is being processed.</p>
            <button
              onClick={handleClose}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
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