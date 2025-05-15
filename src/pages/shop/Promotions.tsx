import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Promotion } from '../../types/promotion';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const PromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      console.log('Fetching promotions from /promotions/public');
      const response = await api.get('/promotions/public');
      console.log('API Response:', response.data);
      console.log('Current date:', new Date().toISOString());
      setPromotions(response.data);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleShopNow = () => {
    navigate('/shop');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Current Promotions</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-200 animate-pulse rounded-lg h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Current Promotions</h1>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Current Promotions</h1>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl text-gray-600 mb-4">No active promotions at the moment</h2>
          <p className="text-gray-500 mb-6">Check back later for special offers and discounts!</p>
          <button
            onClick={handleShopNow}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Shop Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Current Promotions</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promotion) => (
          <div 
            key={promotion.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1"
          >
            {promotion.image_url ? (
              <div className="h-48 overflow-hidden">
                <img 
                  src={promotion.image_url} 
                  alt={promotion.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white p-4">
                  <h2 className="text-2xl font-bold">{promotion.title}</h2>
                  {(promotion.discount_percentage || promotion.discount_amount) && (
                    <div className="text-xl font-bold mt-2">
                      {promotion.discount_percentage 
                        ? `${promotion.discount_percentage}% OFF` 
                        : `₱${promotion.discount_amount?.toFixed(2)} OFF`}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">{promotion.title}</h2>
              <p className="text-gray-600 mb-4">{promotion.description}</p>
              
              {(promotion.discount_percentage || promotion.discount_amount) && (
                <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full inline-block text-sm font-semibold mb-4">
                  {promotion.discount_percentage 
                    ? `${promotion.discount_percentage}% OFF` 
                    : `₱${promotion.discount_amount?.toFixed(2)} OFF`}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Valid until {format(new Date(promotion.end_date), 'MMM d, yyyy')}
                </span>
                <button
                  onClick={handleShopNow}
                  className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 transition-colors"
                >
                  Shop Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromotionsPage; 