import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, ShoppingCart, Heart, Share2, AlertTriangle, Check, FileText } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { formatPeso } from '../../utils/currency';
import RatingDisplay from '../RatingDisplay';
import RatingForm from '../RatingForm';

interface Medicine {
  id: number;
  name: string;
  generic_name: string;
  brand: string;
  description: string;
  price: string | number;
  stock_quantity: number;
  unit: string;
  category_name: string;
  supplier_name: string;
  requires_prescription: boolean;
  image_url: string;
  box_quantity: number;
  price_per_box: string | number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateCartCount } = useCart();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [refreshRatings, setRefreshRatings] = useState(0);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/medicines/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setMedicine(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch medicine details');
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [id]);

  const handleQuantityChange = (value: number) => {
    if (medicine && value >= 1 && value <= medicine.stock_quantity) {
      setQuantity(value);
    }
  };

  const addToCart = async () => {
    if (!medicine) return;
    
    setAddingToCart(true);
    try {
      await axios.post('/cart/items', {
        medicine_id: medicine.id,
        quantity: quantity
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      await updateCartCount();
      // Show success feedback
      setTimeout(() => {
        setAddingToCart(false);
      }, 1000);
    } catch (err) {
      setError('Failed to add item to cart');
      setAddingToCart(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-screen text-red-600">
      {error}
    </div>
  );

  if (!medicine) return (
    <div className="flex justify-center items-center min-h-screen text-gray-600">
      Medicine not found
    </div>
  );

  const getImageUrl = (url: string | null | undefined): string => {
    if (!url || url.includes('via.placeholder.com')) {
      return '/images/medicines/medicine-1741854248652.jpg';
    }
    // If the URL is relative (starts with /), use it as is
    if (url.startsWith('/')) {
      return url;
    }
    // If it's an absolute URL, use it as is
    if (url.startsWith('http')) {
      return url;
    }
    // Otherwise, assume it's a relative path and add the leading slash
    return `/${url}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/shop')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Shop
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Image */}
        <div className="space-y-4">
          <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={getImageUrl(medicine.image_url)}
              alt={medicine.name}
              className="w-full h-full object-center object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/medicines/medicine-1741854248652.jpg';
                target.onerror = null;
              }}
            />
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{medicine.name}</h1>
            <p className="text-lg text-gray-600 mt-2">{medicine.generic_name}</p>
            <p className="text-sm text-gray-500">Brand: {medicine.brand}</p>
          </div>

          <div className="border-t border-b border-gray-200 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{formatPeso(medicine.price)}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                    medicine.stock_status === 'out_of_stock'
                      ? 'bg-red-100 text-red-800'
                      : medicine.stock_status === 'low_stock'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      medicine.stock_status === 'out_of_stock'
                        ? 'bg-red-500'
                        : medicine.stock_status === 'low_stock'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}></div>
                    {medicine.stock_status === 'out_of_stock'
                      ? 'Out of Stock'
                      : medicine.stock_status === 'low_stock'
                      ? `Low Stock (Below ${medicine.min_stock_level} ${medicine.unit})`
                      : 'In Stock'}
                  </div>
                  <p className="text-sm text-gray-500">
                    {medicine.stock_quantity} {medicine.unit} available
                    {medicine.stock_quantity <= medicine.reorder_point && medicine.stock_quantity > 0 && (
                      <span className="text-amber-600 ml-2">
                        • Reorder Point Reached
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {medicine.requires_prescription && (
                <div className="flex items-center text-amber-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Prescription Required</span>
                </div>
              )}
            </div>
          </div>

          {medicine.description && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
              <p className="mt-2 text-gray-600">{medicine.description}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                Quantity:
              </label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                  className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
                  min="1"
                  max={medicine.stock_quantity}
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  disabled={quantity >= medicine.stock_quantity}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={addToCart}
                disabled={addingToCart || medicine.stock_quantity === 0}
                className={`flex-1 flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                  addingToCart
                    ? 'bg-green-600'
                    : medicine.stock_quantity === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {addingToCart ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {medicine.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Category</h3>
                <p className="mt-1 text-sm text-gray-500">{medicine.category_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Supplier</h3>
                <p className="mt-1 text-sm text-gray-500">{medicine.supplier_name}</p>
              </div>
            </div>
          </div>

          {medicine.requires_prescription && (
            <div className="mt-4 p-4 border border-red-300 bg-red-50 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FileText className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Prescription Required</h3>
                  <div className="mt-1 text-sm text-red-700">
                    <p>This medicine requires a valid prescription from a licensed healthcare provider.</p>
                    <Link to="/prescriptions" className="mt-2 inline-block text-red-700 font-medium underline">
                      Upload your prescription here
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ratings and Reviews Section */}
      <div className="mt-12 mb-8">
        {medicine && (
          <>
            <RatingDisplay 
              medicineId={medicine.id} 
              key={`display-${refreshRatings}`} 
            />
            <RatingForm 
              medicineId={medicine.id} 
              onRatingSubmitted={() => setRefreshRatings(prev => prev + 1)} 
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;