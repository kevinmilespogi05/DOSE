import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, ShoppingCart, Check, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
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

  useEffect(() => {
    fetchMedicines();
  }, [currentPage, sortBy, sortOrder]);

  const fetchMedicines = async () => {
    try {
      const response = await axios.get<PaginatedResponse>('/api/medicines', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          page: currentPage,
          limit: 10,
          sortBy,
          sortOrder
        }
      });
      
      setMedicines(response.data.data);
      setTotalPages(response.data.totalPages);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(response.data.data.map((med: Medicine) => med.category_name))
      ).filter(Boolean) as string[];
      
      setCategories(uniqueCategories);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch medicines');
      setLoading(false);
      console.error('Error fetching medicines:', err);
    }
  };

  const addToCart = async (medicineId: number) => {
    setAddingToCart(medicineId);
    try {
      await axios.post('/api/cart/items', 
        { medicine_id: medicineId, quantity: 1 },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
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

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = 
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || medicine.category_name === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Medicine Shop</h1>
            <p className="text-sm text-gray-600 mt-1">Browse and purchase medicines</p>
          </div>
          <button
            onClick={viewCart}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>View Cart</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center space-y-4 sm:space-y-0 mb-6">
        <div className="w-full sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search medicines..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Sorting Options */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleSort('name')}
          className={`flex items-center px-3 py-1 rounded ${
            sortBy === 'name' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
          }`}
        >
          Name
          <ArrowUpDown className="h-4 w-4 ml-1" />
        </button>
        <button
          onClick={() => handleSort('price')}
          className={`flex items-center px-3 py-1 rounded ${
            sortBy === 'price' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
          }`}
        >
          Price
          <ArrowUpDown className="h-4 w-4 ml-1" />
        </button>
        <button
          onClick={() => handleSort('stock_quantity')}
          className={`flex items-center px-3 py-1 rounded ${
            sortBy === 'stock_quantity' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
          }`}
        >
          Stock
          <ArrowUpDown className="h-4 w-4 ml-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredMedicines.map((medicine) => (
          <div key={medicine.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div 
              onClick={() => navigate(`/shop/medicine/${medicine.id}`)}
              className="cursor-pointer"
            >
              <div className="aspect-w-16 aspect-h-9 relative">
                <img
                  src={medicine.image_url || '/images/medicine-placeholder.png'}
                  alt={medicine.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/medicine-placeholder.png';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                    {medicine.category_name}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{medicine.name}</h3>
                    <p className="text-sm text-gray-600">{medicine.generic_name}</p>
                  </div>
                  <p className="text-sm text-gray-500">Brand: {medicine.brand}</p>
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{formatPeso(medicine.price)}</p>
                      <p className="text-sm text-gray-500 whitespace-nowrap">Stock: {medicine.stock_quantity} {medicine.unit}</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(medicine.id);
                      }}
                      className={`flex items-center justify-center p-2 rounded-full transition-colors ${
                        addingToCart === medicine.id
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      disabled={addingToCart === medicine.id}
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

      {filteredMedicines.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No medicines found matching your criteria.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-4 mt-8">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-full ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-full ${
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Shop; 