import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, Edit, Trash2, X, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axios';
import MedicineForm from '../admin/MedicineForm';
import { formatPeso } from '../../utils/currency';

interface Medicine {
  id: number;
  name: string;
  generic_name: string;
  brand: string;
  category_name: string;
  price: number;
  stock_quantity: number;
  unit: string;
  supplier_name: string;
  requires_prescription: boolean;
}

interface PaginatedResponse {
  data: Medicine[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

const MedicineList = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<number | null>(null);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const { user } = useAuth();

  useEffect(() => {
    fetchMedicines();
  }, [currentPage, sortBy, sortOrder]);

  const fetchMedicines = async () => {
    try {
      const response = await axiosInstance.get<PaginatedResponse>('/api/medicines', {
        params: {
          page: currentPage,
          limit: 10,
          sortBy,
          sortOrder
        }
      });
      setMedicines(response.data.data);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch medicines');
      setLoading(false);
      console.error('Error fetching medicines:', err);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  };

  const handleAddMedicine = async (medicineData: any) => {
    try {
      await axiosInstance.post('/api/medicines', medicineData);
      setIsModalOpen(false);
      fetchMedicines();
    } catch (error) {
      console.error('Error adding medicine:', error);
    }
  };

  const handleDeleteMedicine = async (id: number) => {
    try {
      await axiosInstance.delete(`/api/medicines/${id}`);
      setMedicineToDelete(null);
      setIsDeleteModalOpen(false);
      fetchMedicines();
    } catch (error: any) {
      console.error('Error deleting medicine:', error);
      setError(error.response?.data?.message || error.response?.data?.error || 'Failed to delete medicine. Please try again.');
      setIsDeleteModalOpen(false);
    }
  };

  const handleEditMedicine = async (medicineData: any) => {
    try {
      await axiosInstance.put(`/api/medicines/${editingMedicine?.id}`, medicineData);
      setEditingMedicine(null);
      setIsModalOpen(false);
      fetchMedicines();
    } catch (error) {
      console.error('Error updating medicine:', error);
      setError('Failed to update medicine');
    }
  };

  if (loading) return <div className="p-4">Loading medicines...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Medicines Inventory</h1>
        <button 
          onClick={() => {
            setEditingMedicine(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Add Medicine
        </button>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}</h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingMedicine(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <MedicineForm 
              onSubmit={editingMedicine ? handleEditMedicine : handleAddMedicine}
              initialData={editingMedicine}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this medicine? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => medicineToDelete && handleDeleteMedicine(medicineToDelete)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {medicines.map((medicine) => (
              <tr key={medicine.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                      <div className="text-sm text-gray-500">{medicine.generic_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {medicine.category_name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{medicine.stock_quantity} {medicine.unit}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatPeso(medicine.price)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {medicine.supplier_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => {
                        setEditingMedicine(medicine);
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => {
                        setMedicineToDelete(medicine.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

export default MedicineList; 