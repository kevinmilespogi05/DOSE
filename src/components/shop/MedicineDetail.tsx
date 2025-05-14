import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, ShoppingCart, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../utils/api';
import { formatPeso } from '../../utils/currency';
import Reviews from './Reviews';

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

const MedicineDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { updateCartCount } = useCart();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    fetchMedicineDetails();
  }, [id]);

  const fetchMedicineDetails = async () => {
    try {
      const response = await api.get(`/medicines/${id}`);
      setMedicine(response.data);
    } catch (err) {
      setError('Failed to fetch medicine details');
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async () => {
    if (!user || !medicine) return;

    setWishlistLoading(true);
    try {
      if (medicine.is_in_wishlist) {
        await api.delete(`/user/wishlist/${medicine.id}`);
      } else {
        await api.post('/user/wishlist', { medicine_id: medicine.id });
      }
      setMedicine(prev => prev ? { ...prev, is_in_wishlist: !prev.is_in_wishlist } : null);
    } catch (err) {
      setError('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const addToCart = async () => {
    if (!medicine || medicine.stock_quantity === 0) return;

    setAddingToCart(true);
    try {
      await api.post('/cart/items', { medicine_id: medicine.id, quantity: 1 });
      await updateCartCount();
      setTimeout(() => setAddingToCart(false), 1000);
    } catch (err) {
      setError('Failed to add item to cart');
      setAddingToCart(false);
    }
  };

  const handleRatingChange = (newRating: number) => {
    if (medicine) {
      setMedicine({ ...medicine, average_rating: newRating });
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error || !medicine) return (
    <div className="text-red-600 text-center p-4">
      {error || 'Medicine not found'}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image and Basic Info */}
        <div>
          <div className="relative">
            <img
              src={medicine.image_url || '/images/medicine-placeholder.png'}
              alt={medicine.name}
              className="w-full rounded-lg shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/medicine-placeholder.png';
              }}
            />
            {medicine.requires_prescription && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Prescription Required
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{medicine.name}</h1>
            <p className="text-lg text-gray-600 mt-1">{medicine.generic_name}</p>
          </div>

          <div className="flex items-center space-x-4">
            <p className="text-2xl font-bold text-gray-900">
              {formatPeso(medicine.price)}
            </p>
            <div className={`text-sm font-medium ${
              medicine.stock_quantity === 0 
                ? 'text-red-600' 
                : medicine.stock_quantity <= 10 
                  ? 'text-yellow-600' 
                  : 'text-green-600'
            }`}>
              {medicine.stock_quantity === 0 
                ? 'Out of Stock' 
                : `${medicine.stock_quantity} ${medicine.unit} available`}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={addToCart}
              disabled={addingToCart || medicine.stock_quantity === 0}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-lg ${
                medicine.stock_quantity === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : addingToCart
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {addingToCart ? (
                <Check className="h-5 w-5" />
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              className={`p-3 rounded-lg border ${
                medicine.is_in_wishlist
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {wishlistLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full" />
              ) : (
                <Heart className={`h-5 w-5 ${medicine.is_in_wishlist ? 'fill-current' : ''}`} />
              )}
            </button>
          </div>

          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold">Description</h3>
            <p className="text-gray-600">{medicine.description}</p>
          </div>

          <div className="space-y-2">
            <p><span className="font-medium">Brand:</span> {medicine.brand}</p>
            <p><span className="font-medium">Category:</span> {medicine.category_name}</p>
            <p><span className="font-medium">Supplier:</span> {medicine.supplier_name}</p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <Reviews medicineId={medicine.id} onRatingChange={handleRatingChange} />
      </div>
    </div>
  );
};

export default MedicineDetail; 