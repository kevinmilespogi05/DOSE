import React, { useState, useEffect } from 'react';
import { Star, StarHalf, User, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: number;
  user_id: number;
  medicine_id: number;
  rating: number;
  comment: string;
  created_at: string;
  is_verified_purchase: boolean;
  user: {
    first_name: string;
    last_name: string;
  };
}

interface ReviewsProps {
  medicineId: number;
  onRatingChange?: (averageRating: number) => void;
}

export const Reviews: React.FC<ReviewsProps> = ({ medicineId, onRatingChange }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [medicineId]);

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/medicines/${medicineId}/reviews`);
      setReviews(response.data);
      
      // Calculate and emit average rating
      const avgRating = response.data.reduce((acc: number, review: Review) => acc + review.rating, 0) / response.data.length;
      onRatingChange?.(avgRating);

      // Find user's review if it exists
      const userReview = response.data.find((review: Review) => review.user_id === user?.id);
      if (userReview) {
        setUserReview(userReview);
        setNewRating(userReview.rating);
        setNewComment(userReview.comment);
      }
    } catch (err) {
      setError('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (newRating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = userReview 
        ? `/medicines/${medicineId}/reviews/${userReview.id}`
        : `/medicines/${medicineId}/reviews`;
      
      const method = userReview ? 'put' : 'post';
      
      const response = await api[method](endpoint, {
        rating: newRating,
        comment: newComment
      });

      if (userReview) {
        setReviews(reviews.map(review => 
          review.id === userReview.id ? response.data : review
        ));
      } else {
        setReviews([response.data, ...reviews]);
      }

      setUserReview(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'} text-yellow-400`}
            onClick={() => interactive && setNewRating(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
            disabled={!interactive}
          >
            <Star
              className={`h-5 w-5 ${
                (hoveredRating || newRating) >= star
                  ? 'fill-current'
                  : 'fill-none'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) return <div className="animate-pulse">Loading reviews...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Customer Reviews</h3>

      {/* Review Form */}
      {user && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-4">
            {userReview ? 'Update Your Review' : 'Write a Review'}
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              {renderStars(newRating, true)}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comment
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <button
              onClick={handleSubmitReview}
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isSubmitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {review.user.first_name} {review.user.last_name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                {review.is_verified_purchase && (
                  <div className="flex items-center text-green-600 text-sm">
                    <Check className="h-4 w-4 mr-1" />
                    Verified Purchase
                  </div>
                )}
              </div>
              <p className="mt-2 text-gray-700">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews; 