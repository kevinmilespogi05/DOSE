import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  referenceNumber: string;
  paymentProofUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const PaymentValidation: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await axios.get('/api/admin/payments/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPayments(response.data);
    } catch (err) {
      setError('Failed to fetch pending payments');
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (paymentId: string, status: 'approved' | 'rejected') => {
    try {
      await axios.post(`/api/admin/payments/${paymentId}/validate`, 
        { status },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Remove the validated payment from the list
      setPayments(payments.filter(payment => payment.id !== paymentId));
    } catch (err) {
      setError('Failed to validate payment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Payment Validation</h2>
      
      {error && (
        <div className="text-red-600 mb-4">{error}</div>
      )}

      {payments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No pending payments to validate
        </div>
      ) : (
        <div className="space-y-6">
          {payments.map((payment) => (
            <div key={payment.id} className="border rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-medium">{payment.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium">₱{payment.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reference Number</p>
                  <p className="font-medium">{payment.referenceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{payment.user.name}</p>
                  <p className="text-sm text-gray-500">{payment.user.email}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Payment Proof</p>
                <img 
                  src={payment.paymentProofUrl} 
                  alt="Payment Proof" 
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => handleValidation(payment.id, 'approved')}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve Payment
                </button>
                <button
                  onClick={() => handleValidation(payment.id, 'rejected')}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject Payment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentValidation; 