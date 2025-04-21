import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 text-red-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          We couldn't process your payment. Please try again or contact support if the problem persists.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed; 