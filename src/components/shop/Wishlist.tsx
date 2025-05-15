import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Check, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../utils/api';
import { formatPeso } from '../../utils/currency';

interface Medicine {
  id: number;
  name: string;
  generic_name: string;
  brand: string;
  price: string | number;
  stock_quantity: number;
  unit: string;
  category_name: string;
  supplier_name: string;
  image_url: string;
  description: string;
  requires_prescription: boolean;
  average_rating: number;
  is_in_wishlist: boolean;
}

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [removingFromWishlist, setRemovingFromWishlist] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateCartCount } = useCart();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const response = await api.get('/wishlist');
      setWishlistItems(response.data);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError('Failed to fetch wishlist items');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (medicineId: number) => {
    setRemovingFromWishlist(medicineId);
    try {
      await api.delete(`/wishlist/${medicineId}`);
      setWishlistItems(prev => prev.filter(item => item.id !== medicineId));
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    } finally {
      setRemovingFromWishlist(null);
    }
  };

  const addToCart = async (medicineId: number) => {
    setAddingToCart(medicineId);
    try {
      await api.post('/cart/items', { medicine_id: medicineId, quantity: 1 });
      await updateCartCount();
      setTimeout(() => {
        setAddingToCart(null);
      }, 1000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAddingToCart(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${rating >= star ? 'fill-current' : 'fill-none'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Wishlist</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your favorite medicines</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-4">Your wishlist is empty</p>
          <button
            onClick={() => navigate('/shop')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {wishlistItems.map((medicine) => (
            <div key={medicine.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div 
                onClick={() => navigate(`/shop/medicine/${medicine.id}`)}
                className="cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={medicine.image_url || '/images/medicine-placeholder.png'}
                    alt={medicine.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/medicine-placeholder.png';
                    }}
                  />
                  {medicine.requires_prescription && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      Rx
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(medicine.id);
                    }}
                    className="absolute top-2 left-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                    disabled={removingFromWishlist === medicine.id}
                  >
                    {removingFromWishlist === medicine.id ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white rounded-full" />
                    ) : (
                      <Heart className="h-5 w-5 fill-current" />
                    )}
                  </button>
                </div>

                <div className="p-4">
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{medicine.name}</h3>
                      <p className="text-sm text-gray-600">{medicine.generic_name}</p>
                    </div>
                    <p className="text-sm text-gray-500">Brand: {medicine.brand}</p>
                    <div className="flex items-center space-x-1">
                      {renderStars(medicine.average_rating || 0)}
                      {medicine.average_rating ? (
                        <span className="text-sm text-gray-500">
                          ({Number(medicine.average_rating).toFixed(1)})
                        </span>
                      ) : null}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{formatPeso(medicine.price)}</p>
                        <p className={`text-sm ${
                          medicine.stock_quantity === 0 
                            ? 'text-red-500 font-medium' 
                            : medicine.stock_quantity <= 10
                              ? 'text-yellow-600 font-medium'
                              : 'text-gray-500'
                        }`}>
                          Stock: {medicine.stock_quantity} {medicine.unit}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (medicine.stock_quantity > 0) {
                            addToCart(medicine.id);
                          }
                        }}
                        className={`flex items-center justify-center p-2 rounded-full transition-colors ${
                          medicine.stock_quantity === 0
                            ? 'bg-gray-300 cursor-not-allowed'
                            : addingToCart === medicine.id
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        disabled={addingToCart === medicine.id || medicine.stock_quantity === 0}
                        title={medicine.stock_quantity === 0 ? 'Out of stock' : 'Add to cart'}
                      >
                        {addingToCart === medicine.id ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <ShoppingCart className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist; 