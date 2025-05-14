import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Package, CheckCircle, Clock, Truck } from 'lucide-react';
import api from '../../lib/api';

interface TrackingStatus {
  id: string;
  status: string;
  description: string;
  location?: string;
  created_at: string;
}

interface OrderTrackingProps {
  orderId: string;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId }) => {
  const [trackingHistory, setTrackingHistory] = useState<TrackingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrackingHistory = async () => {
      try {
        const response = await api.get(`/orders/${orderId}/tracking`);
        setTrackingHistory(response.data.tracking);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tracking history:', err);
        setError('Failed to load tracking information');
        setLoading(false);
      }
    };

    fetchTrackingHistory();
  }, [orderId]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'processing':
        return <Package className="w-6 h-6 text-blue-500" />;
      case 'shipping':
        return <Truck className="w-6 h-6 text-purple-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-4">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Order Tracking</h3>
      
      <div className="space-y-6">
        {trackingHistory.map((status, index) => (
          <div key={status.id} className="relative">
            {index !== trackingHistory.length - 1 && (
              <div className="absolute top-8 left-3 w-0.5 h-full bg-gray-200"></div>
            )}
            
            <div className="flex items-start gap-4">
              <div className="relative z-10 bg-white">
                {getStatusIcon(status.status)}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium capitalize">{status.status}</h4>
                    <p className="text-sm text-gray-600 mt-1">{status.description}</p>
                    {status.location && (
                      <p className="text-sm text-gray-500 mt-1">
                        Location: {status.location}
                      </p>
                    )}
                  </div>
                  <time className="text-sm text-gray-500">
                    {format(new Date(status.created_at), 'PPp')}
                  </time>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTracking; 