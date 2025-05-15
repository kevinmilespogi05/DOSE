import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axios';
import { showSuccess, showError, showConfirmation } from '../../utils/swalUtil';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

interface TaxRate {
  id: number;
  country: string;
  state: string | null;
  rate: number;
  is_active: boolean;
}

const TaxRates: React.FC = () => {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    country: '',
    state: '',
    rate: 0,
    is_active: true
  });

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const fetchTaxRates = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/tax');
      setTaxRates(response.data);
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      showError('Failed to load tax rates');
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
      country: '',
      state: '',
      rate: 0,
      is_active: true
    });
    setEditingRate(null);
    setShowAddForm(false);
  };

  const handleAddEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSend = {
      ...formData,
      state: formData.state || null, // Convert empty string to null
      rate: parseFloat(formData.rate.toString())
    };
    
    try {
      if (editingRate) {
        // Update existing tax rate
        await axiosInstance.put(`/api/admin/tax/${editingRate.id}`, dataToSend);
        showSuccess('Tax rate updated successfully');
      } else {
        // Add new tax rate
        await axiosInstance.post('/api/admin/tax', dataToSend);
        showSuccess('Tax rate added successfully');
      }
      
      resetForm();
      fetchTaxRates();
    } catch (error) {
      console.error('Error saving tax rate:', error);
      showError('Failed to save tax rate');
    }
  };

  const handleEdit = (rate: TaxRate) => {
    setFormData({
      country: rate.country,
      state: rate.state || '',
      rate: rate.rate,
      is_active: rate.is_active
    });
    setEditingRate(rate);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirmation(
      'Delete Tax Rate',
      'Are you sure you want to delete this tax rate? This action cannot be undone.'
    );

    if (confirmed) {
      try {
        await axiosInstance.delete(`/api/admin/tax/${id}`);
        showSuccess('Tax rate deleted successfully');
        fetchTaxRates();
      } catch (error) {
        console.error('Error deleting tax rate:', error);
        showError('Failed to delete tax rate');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tax Rates</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add New Tax Rate
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingRate ? 'Edit Tax Rate' : 'Add New Tax Rate'}
          </h2>
          <form onSubmit={handleAddEdit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">State/Province (Optional)</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  name="rate"
                  value={formData.rate}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
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
            <div className="flex justify-end space-x-4">
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
                {editingRate ? 'Update' : 'Save'}
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
          {taxRates.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-500">No tax rates found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      State/Province
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
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
                  {taxRates.map((rate) => (
                    <tr key={rate.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{rate.country}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{rate.state || 'All Regions'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{Number(rate.rate).toFixed(2)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            rate.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rate.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(rate)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rate.id)}
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

export default TaxRates; 