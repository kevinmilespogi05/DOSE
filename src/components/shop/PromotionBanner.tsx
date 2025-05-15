import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Promotion } from '../../types/promotion';
import { format } from 'date-fns';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const PromotionBanner: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedPromotions();
  }, []);

  const fetchFeaturedPromotions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/promotions/featured');
      setPromotions(response.data);
    } catch (err) {
      console.error('Error fetching featured promotions:', err);
      setError('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-48 bg-gray-200 animate-pulse rounded-lg mb-6">
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-500">Loading promotions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Don't show anything if there's an error
  }

  if (promotions.length === 0) {
    return null; // Don't show the component if there are no promotions
  }

  return (
    <div className="mb-8">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        className="rounded-lg overflow-hidden shadow-md"
      >
        {promotions.map((promotion) => (
          <SwiperSlide key={promotion.id}>
            <div className="relative">
              {promotion.banner_url ? (
                <img 
                  src={promotion.banner_url} 
                  alt={promotion.title} 
                  className="w-full h-64 md:h-80 object-cover"
                />
              ) : (
                <div className="w-full h-64 md:h-80 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <div className="text-center text-white p-6">
                    <h2 className="text-3xl font-bold mb-2">{promotion.title}</h2>
                    <p className="text-lg mb-4">{promotion.description}</p>
                    {(promotion.discount_percentage || promotion.discount_amount) && (
                      <div className="text-2xl font-bold mb-2">
                        {promotion.discount_percentage 
                          ? `${promotion.discount_percentage}% OFF` 
                          : `₱${promotion.discount_amount?.toFixed(2)} OFF`}
                      </div>
                    )}
                    <div className="text-sm opacity-80">
                      Valid until {format(new Date(promotion.end_date), 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
              )}

              {promotion.banner_url && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center">
                  <div className="text-white p-6 md:p-12 max-w-xl">
                    <h2 className="text-2xl md:text-4xl font-bold mb-2">{promotion.title}</h2>
                    <p className="text-sm md:text-lg mb-4">{promotion.description}</p>
                    {(promotion.discount_percentage || promotion.discount_amount) && (
                      <div className="text-xl md:text-3xl font-bold mb-2">
                        {promotion.discount_percentage 
                          ? `${promotion.discount_percentage}% OFF` 
                          : `₱${promotion.discount_amount?.toFixed(2)} OFF`}
                      </div>
                    )}
                    <div className="mt-4">
                      <button className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold shadow-md hover:bg-indigo-50 transition-colors">
                        Shop Now
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default PromotionBanner; 