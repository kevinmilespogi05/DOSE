import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-soft p-8 text-center">
        <XCircle className="w-16 h-16 mx-auto text-red-600" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          Payment Failed
        </h2>
        <p className="mt-2 text-gray-600">
          We couldn't process your payment. Please try again or contact support if the problem persists.
        </p>
        <div className="mt-6 space-y-3">
          <button
            onClick={() => navigate('/cart')}
            className="w-full py-3 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/support')}
            className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed; 