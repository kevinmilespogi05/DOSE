import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSource } from '../../utils/paymongo';
import { ArrowRight, Loader2 } from 'lucide-react';

interface PaymentProps {
  orderId: string;
  totalAmount: number;
  onClose: () => void;
}

const Payment: React.FC<PaymentProps> = ({ orderId, totalAmount, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'gcash' | 'grab_pay'>('gcash');
  const navigate = useNavigate();

  const handlePayment = async (type: 'gcash' | 'grab_pay') => {
    setIsProcessing(true);
    setError('');

    try {
      const source = await createSource(totalAmount, type);
      
      // Store order ID and source ID in localStorage for verification after redirect
      localStorage.setItem('pendingOrderId', orderId);
      localStorage.setItem('pendingSourceId', source.id);
      
      // Redirect to payment provider's checkout page
      window.location.href = source.attributes.redirect.checkout_url;
    } catch (err) {
      console.error('Payment error:', err);
      setError('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: 'gcash',
      name: 'GCash',
      logo: '/images/gcash-logo.png',
      description: 'Pay with your GCash wallet'
    },
    {
      id: 'grab_pay',
      name: 'GrabPay',
      logo: '/images/grabpay-logo.png',
      description: 'Pay with your GrabPay wallet'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-lg font-medium text-gray-900">Order Total</p>
          <p className="text-3xl font-bold text-primary-600">
            ₱{totalAmount.toFixed(2)}
          </p>
        </div>

        <div className="space-y-4">
          <p className="font-medium text-gray-700">Select Payment Method</p>
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
              <img
                src={method.logo}
                alt={method.name}
                className="w-12 h-12 object-contain"
              />
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

        <div className="mt-6">
          <button
            onClick={() => handlePayment(selectedMethod)}
            disabled={isProcessing}
            className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment; 