import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { formatPeso } from '../utils/currency';

interface WishlistItem {
  id: number;
  medicine_id: number;
  name: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  added_at: string;
}

const Wishlist: React.FC = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await api.get('/user/wishlist');
      setWishlist(response.data);
    } catch (err) {
      setError('Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (medicineId: number) => {
    try {
      await api.delete(`/user/wishlist/${medicineId}`);
      setWishlist(prev => prev.filter(item => item.medicine_id !== medicineId));
    } catch (err) {
      setError('Failed to remove item from wishlist');
    }
  };

  const addToCart = async (medicineId: number) => {
    try {
      await api.post('/cart/items', { medicine_id: medicineId, quantity: 1 });
      // You might want to show a success message or update the cart count in the UI
    } catch (err) {
      setError('Failed to add item to cart');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">My Wishlist</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {wishlist.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Your wishlist is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map(item => (
            <div key={item.id} className="border rounded-lg p-4 shadow-sm">
              <div className="aspect-w-1 aspect-h-1 mb-4">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="object-cover rounded-lg"
                />
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold">{formatPeso(item.price)}</span>
                <span className={`text-sm ${
                  item.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => addToCart(item.medicine_id)}
                  disabled={item.stock_quantity === 0}
                  className={`flex-1 py-2 px-4 rounded-md ${
                    item.stock_quantity > 0
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Add to Cart
                </button>
                
                <button
                  onClick={() => removeFromWishlist(item.medicine_id)}
                  className="flex-1 py-2 px-4 rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist; 