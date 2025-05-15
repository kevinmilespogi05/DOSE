import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, Check, ChevronLeft, ChevronRight, ArrowUpDown, FileText, Heart, HeartOff, Star } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPeso } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import RatingModal from './RatingModal';
import PromotionBanner from './PromotionBanner';

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
  total_ratings: number;
  is_in_wishlist: boolean;
}

interface PaginatedResponse {
  data: Medicine[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

const Shop = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const navigate = useNavigate();
  const { updateCartCount } = useCart();
  const ITEMS_PER_PAGE = 10;
  const LOW_STOCK_THRESHOLD = 10; // Define threshold for low stock warning
  const [wishlistLoading, setWishlistLoading] = useState<{ [key: number]: boolean }>({});
  const { user } = useAuth();
  const [selectedMedicineForRating, setSelectedMedicineForRating] = useState<Medicine | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMedicines();
    } else {
      // If no user, clear wishlist states
      setMedicines(prev => prev.map(m => ({ ...m, is_in_wishlist: false })));
    }
  }, [user]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, check if we have a valid token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.get('/medicines');
      
      // Handle both paginated and non-paginated responses
      let medicinesData: Medicine[];
      
      if (Array.isArray(response.data)) {
        medicinesData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        medicinesData = response.data.data;
      } else {
        throw new Error('Invalid response format');
      }

      // Initialize all medicines with is_in_wishlist as false
      medicinesData = medicinesData.map(medicine => ({
        ...medicine,
        is_in_wishlist: false
      }));

      // If user is logged in, fetch wishlist status for all medicines
      if (user) {
        try {
          const wishlistResponse = await api.get('/wishlist');
          
          // Create a Set of medicine IDs from the wishlist response
          const wishlistItems = new Set(wishlistResponse.data.map((item: any) => {
            // The API returns full medicine data, so we need to get the medicine ID
            const medicineId = item.id; // The medicine ID is in the root of the object
            return medicineId;
          }));
          
          medicinesData = medicinesData.map(medicine => ({
            ...medicine,
            is_in_wishlist: wishlistItems.has(medicine.id)
          }));
          
        } catch (wishlistError) {
          console.error('Error fetching wishlist:', wishlistError);
          // If we can't fetch wishlist, assume no items are in wishlist
          medicinesData = medicinesData.map(medicine => ({
            ...medicine,
            is_in_wishlist: false
          }));
        }
      }
      
      setMedicines(medicinesData);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(medicinesData.map((med: Medicine) => med.category_name))
      ).filter(Boolean) as string[];
      
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to fetch medicines');
      setMedicines([]); // Reset to empty array on error
      setCategories([]); // Reset categories on error
    } finally {
      setLoading(false);
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
      setError('Failed to add item to cart');
      setAddingToCart(null);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const viewCart = () => {
    navigate('/cart');
  };

  // Client-side sorting function
  const sortMedicines = (medicineList: Medicine[]) => {
    return [...medicineList].sort((a, b) => {
      let aValue = sortBy === 'price' ? Number(a[sortBy]) : a[sortBy];
      let bValue = sortBy === 'price' ? Number(b[sortBy]) : b[sortBy];
      
      if (sortOrder === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Filter and sort medicines
  const filteredAndSortedMedicines = React.useMemo(() => {
    const filtered = (medicines || []).filter(medicine => {
      const matchesSearch = 
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.brand.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'all' || medicine.category_name === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    return sortMedicines(filtered);
  }, [medicines, searchTerm, selectedCategory, sortBy, sortOrder]);

  // Calculate pagination
  const totalFilteredItems = filteredAndSortedMedicines.length;
  const totalFilteredPages = Math.ceil(totalFilteredItems / ITEMS_PER_PAGE);
  
  // Get current page items
  const currentItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedMedicines.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedMedicines, currentPage]);

  // Update useEffect dependencies
  useEffect(() => {
    fetchMedicines();
  }, [user]);

  // Update pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { type: 'out', label: 'Out of Stock', color: 'bg-red-500' };
    if (quantity <= LOW_STOCK_THRESHOLD) return { type: 'low', label: 'Low Stock', color: 'bg-yellow-500' };
    return null;
  };

  const toggleWishlist = async (medicineId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    setWishlistLoading(prev => ({ ...prev, [medicineId]: true }));
    try {
      const medicine = medicines.find(m => m.id === medicineId);
      if (!medicine) return;

      // Check current wishlist status before toggling
      const checkResponse = await api.get(`/wishlist/check/${medicineId}`);
      const isCurrentlyInWishlist = checkResponse.data.isInWishlist;

      // Only proceed if the current status is different from what we think it is
      if (isCurrentlyInWishlist !== medicine.is_in_wishlist) {
        setMedicines(prev => prev.map(m => 
          m.id === medicineId 
            ? { ...m, is_in_wishlist: isCurrentlyInWishlist }
            : m
        ));
        return;
      }

      // Optimistically update the UI
      setMedicines(prev => prev.map(m => 
        m.id === medicineId 
          ? { ...m, is_in_wishlist: !m.is_in_wishlist }
          : m
      ));

      if (isCurrentlyInWishlist) {
        await api.delete(`/wishlist/${medicineId}`);
      } else {
        await api.post('/wishlist', { medicine_id: medicineId });
      }
    } catch (error: any) {
      console.error('Failed to update wishlist:', error);
      // Revert the optimistic update
      const medicine = medicines.find(m => m.id === medicineId);
      if (medicine) {
        try {
          // Get the current wishlist status
          const checkResponse = await api.get(`/wishlist/check/${medicineId}`);
          const isCurrentlyInWishlist = checkResponse.data.isInWishlist;
          
          setMedicines(prev => prev.map(m => 
            m.id === medicineId 
              ? { ...m, is_in_wishlist: isCurrentlyInWishlist }
              : m
          ));
        } catch (checkError) {
          // If we can't check the status, revert to the previous state
          setMedicines(prev => prev.map(m => 
            m.id === medicineId 
              ? { ...m, is_in_wishlist: medicine.is_in_wishlist }
              : m
          ));
        }
      }
    } finally {
      setWishlistLoading(prev => ({ ...prev, [medicineId]: false }));
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

  const handleRatingClick = (e: React.MouseEvent, medicine: Medicine) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedMedicineForRating(medicine);
    setIsRatingModalOpen(true);
  };

  const handleRatingSubmit = async () => {
    await fetchMedicines(); // Refresh medicines to get updated ratings
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-600 text-center p-4">
      {error}
    </div>
  );

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* Promotion Banner Component */}
      <PromotionBanner />
      
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Medicine Shop</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Browse and purchase medicines</p>
          </div>
          <div className="flex space-x-3">
            <Link 
              to="/promotions"
              className="text-blue-600 hover:text-blue-800 text-sm sm:text-base underline"
            >
              View All Promotions
            </Link>
            <button
              onClick={viewCart}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>View Cart</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
        <div className="w-full sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
          <input
            type="text"
            placeholder="Search medicines..."
            className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 mb-4 sm:mb-6 text-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-xs sm:text-sm font-medium text-blue-800">Prescription Required</h3>
            <div className="mt-1 text-xs sm:text-sm text-blue-700">
              <p>Some medicines require a valid prescription. Look for the "Rx" badge on products. You can upload your prescription in the <Link to="/prescriptions" className="font-medium underline">Prescriptions</Link> section.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sorting Options */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleSort('name')}
          className={`flex items-center px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
            sortBy === 'name' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
          }`}
        >
          Name
          <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
        </button>
        <button
          onClick={() => handleSort('price')}
          className={`flex items-center px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
            sortBy === 'price' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
          }`}
        >
          Price
          <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
        </button>
        <button
          onClick={() => handleSort('stock_quantity')}
          className={`flex items-center px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
            sortBy === 'stock_quantity' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
          }`}
        >
          Stock
          <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {currentItems.map((medicine) => (
          <div key={medicine.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div 
              onClick={() => navigate(`/shop/medicine/${medicine.id}`)}
              className="cursor-pointer"
            >
              <div className="relative">
                <img
                  src={medicine.image_url || '/images/medicine-placeholder.png'}
                  alt={medicine.name}
                  className="w-full h-36 sm:h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/medicine-placeholder.png';
                  }}
                />
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {medicine.requires_prescription && (
                    <div className="bg-red-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                      Rx
                    </div>
                  )}
                  {getStockStatus(medicine.stock_quantity) && (
                    <div className={`${getStockStatus(medicine.stock_quantity)?.color} text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold`}>
                      {getStockStatus(medicine.stock_quantity)?.label}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => toggleWishlist(medicine.id, e)}
                  className={`absolute top-2 left-2 p-1 sm:p-1.5 rounded-full 
                    ${medicine.is_in_wishlist 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                    } transition-colors`}
                  disabled={wishlistLoading[medicine.id]}
                >
                  {wishlistLoading[medicine.id] ? (
                    <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-gray-500 rounded-full" />
                  ) : medicine.is_in_wishlist ? (
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                  ) : (
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>

              <div className="p-3 sm:p-4">
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-900 line-clamp-1">{medicine.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{medicine.generic_name}</p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">Brand: {medicine.brand}</p>
                  <div 
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                    onClick={(e) => handleRatingClick(e, medicine)}
                  >
                    {renderStars(medicine.average_rating)}
                    <span className="text-xs sm:text-sm text-gray-500">
                      {medicine.average_rating && medicine.average_rating > 0 
                        ? `(${Number(medicine.average_rating).toFixed(1)} • ${medicine.total_ratings} ${medicine.total_ratings === 1 ? 'rating' : 'ratings'})`
                        : '(No ratings yet)'
                      }
                    </span>
                    <span className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 ml-1">
                      {user ? 'Rate this' : 'Login to rate'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <p className="text-sm sm:text-lg font-bold text-gray-900">{formatPeso(medicine.price)}</p>
                      <p className={`text-xs sm:text-sm whitespace-nowrap ${
                        medicine.stock_quantity === 0 
                          ? 'text-red-500 font-medium' 
                          : medicine.stock_quantity <= LOW_STOCK_THRESHOLD 
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
                      className={`flex items-center justify-center p-1.5 sm:p-2 rounded-full transition-colors ${
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
                        <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentItems.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <p className="text-sm sm:text-base text-gray-500">No medicines found matching your criteria.</p>
        </div>
      )}

      {/* Update pagination section */}
      <div className="flex justify-center items-center space-x-2 sm:space-x-4 mt-6 sm:mt-8">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`p-1.5 sm:p-2 rounded-full ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <span className="text-sm sm:text-base text-gray-600">
          Page {currentPage} of {totalFilteredPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalFilteredPages))}
          disabled={currentPage === totalFilteredPages}
          className={`p-1.5 sm:p-2 rounded-full ${
            currentPage === totalFilteredPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* Rating Modal */}
      {selectedMedicineForRating && (
        <RatingModal
          medicineId={selectedMedicineForRating.id}
          medicineName={selectedMedicineForRating.name}
          isOpen={isRatingModalOpen}
          onClose={() => {
            setIsRatingModalOpen(false);
            setSelectedMedicineForRating(null);
          }}
          onRatingSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
};

export default Shop; 