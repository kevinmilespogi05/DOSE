import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import OrderTracking from '../../components/order/OrderTracking';
import ReturnRequest from '../../components/order/ReturnRequest';

interface OrderDetails {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

interface ReturnStatus {
  id: number;
  status: string;
  total_refund_amount: string;
  created_at: string;
  items: Array<{
    id: number;
    quantity: number;
    reason: string;
    condition: string;
    refund_amount: string;
  }>;
}

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [returnStatus, setReturnStatus] = useState<ReturnStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        console.log('Fetching order details for ID:', orderId);
        const response = await api.get(`/orders/${orderId}`);
        console.log('Order details response:', response.data);
        
        if (!response.data) {
          throw new Error('No data received from server');
        }

        // Ensure the response has the expected structure
        const orderData = {
          ...response.data,
          items: Array.isArray(response.data.items) ? response.data.items : []
        };
        
        setOrder(orderData);
        
        // Fetch return status if it exists
        try {
          const returnResponse = await api.get(`/returns/orders/${orderId}/returns`);
          console.log('Return status response:', returnResponse.data);
          if (returnResponse.data) {
            setReturnStatus(returnResponse.data);
            console.log('Return status:', returnResponse.data);
          }
        } catch (returnError) {
          console.log('No return request found for this order');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleReturnRequest = async () => {
    setShowReturnModal(true);
  };

  const handleReturnSuccess = async () => {
    setShowReturnModal(false);
    // Refresh return status
    try {
      const returnResponse = await api.get(`/returns/orders/${orderId}/returns`);
      if (returnResponse.data) {
        setReturnStatus(returnResponse.data);
      }
    } catch (err) {
      console.error('Failed to fetch updated return status:', err);
    }
  };

  const canRequestReturn = (status: string) => {
    console.log('Checking return eligibility:', {
      status,
      hasExistingReturn: !!returnStatus,
      orderDate: order?.created_at,
      returnStatus: returnStatus?.status
    });

    // Only allow returns for completed orders
    if (status !== 'completed') {
      console.log('Order not eligible: status is not completed');
      return false;
    }

    // If there's a return request and it's rejected, don't show the button
    if (returnStatus && returnStatus.status === 'rejected') {
      console.log('Order not eligible: return request was rejected');
      return false;
    }

    // Check for any existing return request
    if (returnStatus) {
      console.log('Order not eligible: has an existing return request');
      return false;
    }

    // Check if within 7 days
    const orderDate = new Date(order?.created_at || '');
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log('Days since order:', daysDifference);
    
    return daysDifference <= 7;
  };

  const getReturnStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center text-red-600 py-8">
        {error || 'Order not found'}
      </div>
    );
  }

  // Ensure order.items exists before rendering
  const orderItems = order.items || [];
  console.log('Rendering order items:', orderItems);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Order Details</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Order Information</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-medium">{order.id}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Date Placed</p>
                <p className="font-medium">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-medium">₱{order.total_amount.toFixed(2)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium capitalize">{order.status}</p>
              </div>

              {returnStatus && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Return Request Status</h3>
                  <div className="space-y-2">
                    <p className={`font-medium ${getReturnStatusColor(returnStatus.status)}`}>
                      {returnStatus.status.charAt(0).toUpperCase() + returnStatus.status.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Requested on: {new Date(returnStatus.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Refund Amount: ₱{Number(returnStatus.total_refund_amount).toFixed(2)}
                    </p>
                    {returnStatus.items && returnStatus.items.map((item, index) => (
                      <div key={item.id} className="text-sm text-gray-600">
                        <p>Item {index + 1}:</p>
                        <ul className="ml-4">
                          <li>Quantity: {item.quantity}</li>
                          <li>Reason: {item.reason.split('_').join(' ')}</li>
                          <li>Condition: {item.condition}</li>
                          <li>Refund: ₱{Number(item.refund_amount).toFixed(2)}</li>
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium mb-3">Order Items</h3>
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₱{item.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {canRequestReturn(order.status) && (
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleReturnRequest}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Request Return
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  *Returns can be requested within 7 days of delivery
                </p>
              </div>
            )}
          </div>
          
          <div>
            <OrderTracking orderId={order.id} />
          </div>
        </div>
      </div>

      {showReturnModal && (
        <ReturnRequest
          order={order}
          onClose={() => setShowReturnModal(false)}
          onSuccess={handleReturnSuccess}
        />
      )}
    </div>
  );
};

export default OrderDetails; 