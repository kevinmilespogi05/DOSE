import React from 'react';
import { Search, Filter } from 'lucide-react';
import { formatPeso } from '../utils/currency';

const products = [
  {
    id: 1,
    name: 'Paracetamol',
    brand: 'Generic',
    price: 5.99,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400',
    category: 'Pain Relief',
    stock: 150
  },
  {
    id: 2,
    name: 'Vitamin C',
    brand: 'HealthPlus',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?auto=format&fit=crop&q=80&w=400',
    category: 'Vitamins',
    stock: 200
  },
  {
    id: 3,
    name: 'Ibuprofen',
    brand: 'Generic',
    price: 7.99,
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f7e?auto=format&fit=crop&q=80&w=400',
    category: 'Pain Relief',
    stock: 120
  },
  // Add more products as needed
];

const UserDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div className="relative flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Search medicines..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>
        
        <button className="mt-4 md:mt-0 ml-0 md:ml-4 flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
          <Filter className="w-5 h-5 mr-2" />
          <span>Filter</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-blue-600">{formatPeso(product.price)}</span>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserDashboard;