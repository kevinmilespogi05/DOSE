import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSource, verifyPayment } from '../../utils/paymongo';
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

  // Check for pending payment on component mount
  useEffect(() => {
    const checkPendingPayment = async () => {
      const pendingOrderId = localStorage.getItem('pendingOrderId');
      const pendingSourceId = localStorage.getItem('pendingSourceId');
      
      if (pendingOrderId && pendingSourceId) {
        try {
          const verification = await verifyPayment(pendingSourceId);
          if (verification.status === 'paid') {
            // Clear pending payment data
            localStorage.removeItem('pendingOrderId');
            localStorage.removeItem('pendingSourceId');
            
            // Update order status
            await axios.put(`/api/orders/${pendingOrderId}/status`, {
              status: 'paid'
            }, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            // Show success message and close modal
            alert('Payment successful!');
            onClose();
          }
        } catch (err) {
          console.error('Payment verification failed:', err);
        }
      }
    };

    checkPendingPayment();
  }, [onClose]);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Validate amount
      if (amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      console.log('Creating payment source for amount:', amount);
      const source = await createSource(amount, selectedMethod);
      
      if (!source || !source.attributes || !source.attributes.redirect) {
        throw new Error('Invalid payment source response');
      }

      // Store payment details for verification
      localStorage.setItem('pendingOrderId', orderId);
      localStorage.setItem('pendingSourceId', source.id);
      
      console.log('Redirecting to payment provider:', source.attributes.redirect.checkout_url);
      // Redirect to payment provider
      window.location.href = source.attributes.redirect.checkout_url;
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

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