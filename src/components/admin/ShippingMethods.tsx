import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axios';
import { showSuccess, showError, showConfirmation } from '../../utils/swalUtil';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

interface ShippingMethod {
  id: number;
  name: string;
  base_cost: number;
  estimated_days: number;
  is_active: boolean;
}

const ShippingMethods: React.FC = () => {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    base_cost: 0,
    estimated_days: 1,
    is_active: true
  });

  useEffect(() => {
    fetchShippingMethods();
  }, []);

  const fetchShippingMethods = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/shipping/methods');
      setShippingMethods(response.data);
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      showError('Failed to load shipping methods');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      base_cost: 0,
      estimated_days: 1,
      is_active: true
    });
    setEditingMethod(null);
    setShowAddForm(false);
  };

  const handleAddEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMethod) {
        // Update existing method
        await axiosInstance.put(`/api/admin/shipping-methods/${editingMethod.id}`, formData);
        showSuccess('Shipping method updated successfully');
      } else {
        // Add new method
        await axiosInstance.post('/api/admin/shipping-methods', formData);
        showSuccess('Shipping method added successfully');
      }
      
      resetForm();
      fetchShippingMethods();
    } catch (error) {
      console.error('Error saving shipping method:', error);
      showError('Failed to save shipping method');
    }
  };

  const handleEdit = (method: ShippingMethod) => {
    setFormData({
      name: method.name,
      base_cost: method.base_cost,
      estimated_days: method.estimated_days,
      is_active: method.is_active
    });
    setEditingMethod(method);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirmation(
      'Delete Shipping Method',
      'Are you sure you want to delete this shipping method? This action cannot be undone.'
    );

    if (confirmed) {
      try {
        await axiosInstance.delete(`/api/admin/shipping-methods/${id}`);
        showSuccess('Shipping method deleted successfully');
        fetchShippingMethods();
      } catch (error) {
        console.error('Error deleting shipping method:', error);
        showError('Failed to delete shipping method');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shipping Methods</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add New Method
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingMethod ? 'Edit Shipping Method' : 'Add New Shipping Method'}
          </h2>
          <form onSubmit={handleAddEdit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Base Cost</label>
                <input
                  type="number"
                  name="base_cost"
                  value={formData.base_cost}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Estimated Days</label>
                <input
                  type="number"
                  name="estimated_days"
                  value={formData.estimated_days}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-gray-700">Active</label>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md"
              >
                {editingMethod ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {shippingMethods.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-500">No shipping methods found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shippingMethods.map((method) => (
                    <tr key={method.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{method.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₱{Number(method.base_cost).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {method.estimated_days} {method.estimated_days === 1 ? 'day' : 'days'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            method.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {method.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(method)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(method.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ShippingMethods; 