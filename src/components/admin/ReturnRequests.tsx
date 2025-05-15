import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { format } from 'date-fns';
import { showConfirmation, showSuccess, showError } from '../../utils/swalUtil';

interface ReturnRequest {
  id: number;
  order_id: string;
  status: string;
  created_at: string;
  total_refund_amount: string;
  user: {
    name: string;
    email: string;
  };
  items: Array<{
    id: number;
    quantity: number;
    reason: string;
    item_status: string;
    refund_amount: string;
    product_name: string;
  }>;
}

const ReturnRequests: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const fetchReturns = async () => {
    try {
      const response = await api.get(`/admin/returns?status=${statusFilter}`);
      setReturns(response.data);
    } catch (err) {
      console.error('Error fetching returns:', err);
      setError('Failed to fetch return requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReturn = async (returnId: number, action: 'approve' | 'reject') => {
    const confirmMessage = action === 'approve' 
      ? 'Are you sure you want to approve this return request? This will process the refund.'
      : 'Are you sure you want to reject this return request?';

    const result = await showConfirmation(
      `${action === 'approve' ? 'Approve' : 'Reject'} Return Request`,
      confirmMessage,
      `Yes, ${action} it`,
      'Cancel'
    );

    if (result.isConfirmed) {
      try {
        await api.post(`/admin/returns/${returnId}/${action}`);
        showSuccess('Success', `Return request ${action}d successfully`);
        fetchReturns(); // Refresh the list
      } catch (err) {
        console.error(`Error ${action}ing return:`, err);
        showError('Error', `Failed to ${action} return request`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Return Requests</h1>
        <div className="w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto border rounded px-3 py-2 bg-white"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {returns.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No return requests found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {returns.map((returnRequest) => (
            <div key={returnRequest.id} className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Order ID</div>
                  <div className="font-medium">{returnRequest.order_id}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500">Customer</div>
                  <div className="font-medium">{returnRequest.user.name}</div>
                  <div className="text-sm text-gray-500">{returnRequest.user.email}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">Date</div>
                  <div>{format(new Date(returnRequest.created_at), 'MMM d, yyyy')}</div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <div className="text-sm font-medium text-gray-500 mb-2">Items</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {returnRequest.items.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded p-3">
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                          <br />
                          Reason: {item.reason.split('_').join(' ')}
                          <br />
                          Condition: {item.item_status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">Total Refund</div>
                  <div className="font-medium">₱{Number(returnRequest.total_refund_amount).toFixed(2)}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">Status</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                    ${returnRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                      returnRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'}`}>
                    {returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1)}
                  </span>
                </div>

                {returnRequest.status === 'pending' && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleProcessReturn(returnRequest.id, 'approve')}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleProcessReturn(returnRequest.id, 'reject')}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReturnRequests; 