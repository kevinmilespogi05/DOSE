import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import RatingDisplay from '../RatingDisplay';
import RatingForm from '../RatingForm';

interface ReviewsProps {
  medicineId: number;
  onRatingChange?: (averageRating: number) => void;
}

export const Reviews: React.FC<ReviewsProps> = ({ medicineId, onRatingChange }) => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRatingSubmitted = () => {
    // Refresh the ratings display when a new rating is submitted
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Customer Reviews</h3>

      {/* Rating Display */}
      <RatingDisplay key={`display-${refreshKey}`} medicineId={medicineId} />

      {/* Rating Form - only for logged in users */}
      {user && (
        <RatingForm medicineId={medicineId} onRatingSubmitted={handleRatingSubmitted} />
      )}

      {/* Prompt to log in if not logged in */}
      {!user && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-blue-700">Please <a href="/login" className="underline font-medium">log in</a> to leave a review.</p>
        </div>
      )}
    </div>
  );
};

export default Reviews; 