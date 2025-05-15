import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Rating {
  id: number;
  user_id: number;
  medicine_id: number;
  medicine_name: string;
  rating: number;
  review: string;
  created_at: string;
  is_verified_purchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  first_name: string;
  last_name: string;
}

interface RatingStats {
  total_ratings: number;
  pending_ratings: number;
  approved_ratings: number;
  rejected_ratings: number;
  verified_ratings: number;
  average_rating: number;
}

const RatingModeration = () => {
  const [pendingRatings, setPendingRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPendingRatings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/admin/ratings/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRatings(response.data);
    } catch (err) {
      setError('Failed to fetch pending ratings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/admin/ratings/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPendingRatings();
    fetchStats();
  }, []);

  const handleModerate = async (ratingId: number, status: 'approved' | 'rejected') => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `/admin/ratings/${ratingId}/moderate`,
        { 
          status, 
          reason: status === 'rejected' ? rejectionReason : null 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh data
      fetchPendingRatings();
      fetchStats();
      setRejectionReason('');
    } catch (err) {
      setError('Failed to moderate rating');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Rating Moderation</h1>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold text-lg">Pending Reviews</h3>
            <p className="text-3xl">{stats.pending_ratings}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold text-lg">Total Reviews</h3>
            <p className="text-3xl">{stats.total_ratings}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold text-lg">Verified Purchase %</h3>
            <p className="text-3xl">
              {stats.total_ratings 
                ? Math.round((stats.verified_ratings / stats.total_ratings) * 100) 
                : 0}%
            </p>
          </div>
        </div>
      )}
      
      <h2 className="text-xl font-semibold mb-2">Pending Reviews ({pendingRatings.length})</h2>
      
      {pendingRatings.length === 0 ? (
        <div className="bg-green-50 p-4 rounded border border-green-200">
          No pending reviews to moderate! 🎉
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingRatings.map(rating => (
            <div key={rating.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{rating.medicine_name}</p>
                  <p className="text-gray-600">
                    Rated by {rating.first_name} {rating.last_name} on {new Date(rating.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-yellow-500 text-xl my-1">{renderStars(rating.rating)}</p>
                  {rating.is_verified_purchase && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleModerate(rating.id, 'approved')}
                    disabled={actionLoading}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt('Reason for rejection?');
                      if (reason !== null) {
                        setRejectionReason(reason);
                        handleModerate(rating.id, 'rejected');
                      }
                    }}
                    disabled={actionLoading}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
              {rating.review && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  {rating.review}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingModeration; 