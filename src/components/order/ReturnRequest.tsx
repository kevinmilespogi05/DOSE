import React, { useState } from 'react';
import api from '../../lib/api';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

interface ReturnRequestProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

interface ReturnItem {
  order_item_id: string;
  quantity: number;
  reason: string;
  condition: string;
}

const ReturnRequest: React.FC<ReturnRequestProps> = ({ order, onClose, onSuccess }) => {
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const orderItem = order.items.find(item => item.id === itemId);
    if (!orderItem || quantity > orderItem.quantity) return;

    const existingItem = returnItems.find(item => item.order_item_id === itemId);
    if (existingItem) {
      setReturnItems(returnItems.map(item =>
        item.order_item_id === itemId ? { ...item, quantity } : item
      ));
    } else {
      setReturnItems([...returnItems, {
        order_item_id: itemId,
        quantity,
        reason: '',
        condition: 'new'
      }]);
    }
  };

  const handleReasonChange = (itemId: string, reason: string) => {
    setReturnItems(returnItems.map(item =>
      item.order_item_id === itemId ? { ...item, reason } : item
    ));
  };

  const handleConditionChange = (itemId: string, condition: string) => {
    setReturnItems(returnItems.map(item =>
      item.order_item_id === itemId ? { ...item, condition } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (returnItems.length === 0) {
      setError('Please select at least one item to return');
      return;
    }

    const invalidItems = returnItems.filter(item => !item.reason);
    if (invalidItems.length > 0) {
      setError('Please provide a reason for all return items');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post(`/orders/${order.id}/returns`, {
        items: returnItems
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Return Request</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {order.items.map((item) => {
              const returnItem = returnItems.find(ri => ri.order_item_id === item.id);
              return (
                <div key={item.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{item.product_name}</h3>
                      <p className="text-sm text-gray-600">
                        Original Quantity: {item.quantity} | Price: ₱{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Return Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnItem?.quantity || 0}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                        className="w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    {returnItem?.quantity > 0 && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Return
                          </label>
                          <select
                            value={returnItem.reason}
                            onChange={(e) => handleReasonChange(item.id, e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          >
                            <option value="">Select a reason</option>
                            <option value="wrong_item">Wrong Item Received</option>
                            <option value="damaged">Item Damaged</option>
                            <option value="defective">Item Defective</option>
                            <option value="not_as_described">Not as Described</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Condition
                          </label>
                          <select
                            value={returnItem.condition}
                            onChange={(e) => handleConditionChange(item.id, e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          >
                            <option value="new">New/Unopened</option>
                            <option value="opened">Opened</option>
                            <option value="damaged">Damaged</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400"
              disabled={loading || returnItems.length === 0}
            >
              {loading ? 'Submitting...' : 'Submit Return Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnRequest; 