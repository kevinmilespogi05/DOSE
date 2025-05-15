import React, { useState, useEffect } from 'react';
import api from '../lib/api';

interface RatingFormProps {
  medicineId: number;
  onRatingSubmitted?: () => void;
}

const RatingForm: React.FC<RatingFormProps> = ({ medicineId, onRatingSubmitted }) => {
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState<string>('');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [userReview, setUserReview] = useState<any>(null);
  const [isVerifiedPurchase, setIsVerifiedPurchase] = useState<boolean>(false);
  const [checkingPurchase, setCheckingPurchase] = useState<boolean>(true);

  useEffect(() => {
    const checkUserPurchase = async () => {
      try {
        setCheckingPurchase(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setCheckingPurchase(false);
          return;
        }
        
        // First check if user has already reviewed this medicine
        const reviewResponse = await api.get(`/ratings/user/${medicineId}`);
        
        if (reviewResponse.data && reviewResponse.data.length > 0) {
          const userRating = reviewResponse.data[0];
          setUserReview(userRating);
          setRating(userRating.rating);
          setReview(userRating.review || '');
          setIsVerifiedPurchase(userRating.is_verified_purchase);
          setCheckingPurchase(false);
          return;
        }

        // Check if user has purchased this medicine
        const response = await api.get(`/orders/has-purchased/${medicineId}`);
        setIsVerifiedPurchase(response.data.hasPurchased);
      } catch (err) {
        console.error('Error checking purchase status:', err);
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkUserPurchase();
  }, [medicineId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to submit a review');
        return;
      }

      const response = await api.post(
        '/ratings', 
        { medicine_id: medicineId, rating, review: review.trim() || null }
      );

      setSuccess(
        response.data.isVerifiedPurchase
          ? 'Your review has been submitted and is now visible!'
          : 'Your review has been submitted and is pending approval. Thank you!'
      );
      
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
      
      // Update the local user review object
      setUserReview({
        rating,
        review: review.trim() || null,
        is_verified_purchase: response.data.isVerifiedPurchase,
        status: response.data.status
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error submitting review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (value: number) => {
    const stars = [];
    const effectiveRating = hoveredRating !== null ? hoveredRating : rating;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={`text-2xl ${
            i <= effectiveRating ? 'text-yellow-500' : 'text-gray-300'
          }`}
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(null)}
        >
          ★
        </button>
      );
    }
    return stars;
  };

  if (checkingPurchase) {
    return <div>Checking purchase history...</div>;
  }

  // If user has already submitted a review that's pending
  if (userReview && userReview.status === 'pending') {
    return (
      <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mt-4">
        <h3 className="font-semibold text-lg mb-2">Your Review is Pending Approval</h3>
        <p>Thank you for your review! It's currently being reviewed by our team.</p>
        <div className="mt-3">
          <div className="flex text-yellow-500 mb-2">{renderStars(userReview.rating)}</div>
          {userReview.review && <p className="italic">"{userReview.review}"</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
      
      {isVerifiedPurchase && (
        <div className="bg-green-50 p-3 rounded mb-4 flex items-center">
          <span className="text-green-700 mr-2">✓</span>
          <span>You purchased this product! Your review will be marked as a Verified Purchase.</span>
        </div>
      )}
      
      {!isVerifiedPurchase && (
        <div className="bg-gray-50 p-3 rounded mb-4">
          <p>You haven't purchased this product yet. Your review will be subject to moderation before being published.</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 p-3 rounded mb-4 text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 p-3 rounded mb-4 text-green-700">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Rating</label>
          <div className="flex">
            {renderStars(rating)}
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="review" className="block mb-2">
            Review (optional)
          </label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
            className="w-full border rounded p-2"
            placeholder="Share your experience with this product..."
          />
        </div>
        
        <button
          type="submit"
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default RatingForm; 