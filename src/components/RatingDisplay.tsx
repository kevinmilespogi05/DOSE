import React, { useState, useEffect } from 'react';
import api from '../lib/api';

interface Rating {
  id: number;
  user_id: number;
  medicine_id: number;
  rating: number;
  review: string | null;
  created_at: string;
  username?: string;
  is_verified_purchase: boolean;
}

interface RatingDisplayProps {
  medicineId: number;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({ medicineId }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await api.get(`/ratings/medicine/${medicineId}`);
        setRatings(response.data);
      } catch (err) {
        setError('Failed to load ratings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [medicineId]);

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) return <div>Loading ratings...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (ratings.length === 0) return <div>No ratings yet. Be the first to review this product!</div>;

  // Calculate average rating
  const averageRating = ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length;

  // Group ratings by number of stars
  const ratingCounts = {
    5: ratings.filter(r => r.rating === 5).length,
    4: ratings.filter(r => r.rating === 4).length,
    3: ratings.filter(r => r.rating === 3).length,
    2: ratings.filter(r => r.rating === 2).length,
    1: ratings.filter(r => r.rating === 1).length,
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
      
      <div className="flex flex-col md:flex-row gap-8 mb-6">
        {/* Average rating display */}
        <div className="md:w-1/3">
          <div className="text-4xl font-bold text-yellow-500">
            {averageRating.toFixed(1)} <span className="text-2xl">out of 5</span>
          </div>
          <div className="text-yellow-500 text-2xl my-1">
            {renderStars(Math.round(averageRating))}
          </div>
          <div className="text-gray-500">
            {ratings.length} {ratings.length === 1 ? 'review' : 'reviews'}
          </div>
        </div>
        
        {/* Rating breakdown */}
        <div className="md:w-2/3">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="flex items-center mb-1">
              <span className="w-8">{star} ★</span>
              <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-yellow-400 h-2.5 rounded-full" 
                  style={{ width: `${ratings.length ? (ratingCounts[star as keyof typeof ratingCounts] / ratings.length) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-500">{ratingCounts[star as keyof typeof ratingCounts]}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Individual reviews */}
      <div className="space-y-4">
        {ratings.map(rating => (
          <div key={rating.id} className="border-b pb-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{rating.username || `User #${rating.user_id}`}</span>
              {rating.is_verified_purchase && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                  Verified Purchase
                </span>
              )}
            </div>
            <div className="text-yellow-500 my-1">{renderStars(rating.rating)}</div>
            <div className="text-sm text-gray-500 mb-2">
              Reviewed on {new Date(rating.created_at).toLocaleDateString()}
            </div>
            {rating.review && <p>{rating.review}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingDisplay; 