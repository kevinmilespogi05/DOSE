import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Promotion, PromotionFormData, TermsConditions } from '../../types/promotion';
import { format } from 'date-fns';

const PromotionManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [selectedTab, setSelectedTab] = useState<'list' | 'form'>('list');
  const [preview, setPreview] = useState<{
    image: string | null;
    banner: string | null;
  }>({
    image: null,
    banner: null
  });
  const [formData, setFormData] = useState<PromotionFormData>({
    title: '',
    description: '',
    promotion_type: 'general',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    is_featured: false,
    is_active: true,
    discount_percentage: 0,
    discount_amount: 0,
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/promotions');
      setPromotions(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError('Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : ['discount_percentage', 'discount_amount'].includes(name) 
          ? parseFloat(value) || 0 
          : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setPreview(prev => ({
          ...prev,
          [name]: reader.result as string
        }));
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'boolean') {
            formDataToSend.append(key, value.toString());
          } else if (key === 'applicable_products' || key === 'terms_conditions') {
            // Ensure these are properly serialized arrays/objects
            if (Array.isArray(value) || typeof value === 'object') {
              formDataToSend.append(key, JSON.stringify(value));
            }
          } else {
            formDataToSend.append(key, value.toString());
          }
        }
      });
      
      // Append files if they exist
      const imageInput = document.getElementById('image') as HTMLInputElement;
      const bannerInput = document.getElementById('banner') as HTMLInputElement;
      
      if (imageInput.files && imageInput.files.length > 0) {
        formDataToSend.append('image', imageInput.files[0]);
      }
      
      if (bannerInput.files && bannerInput.files.length > 0) {
        formDataToSend.append('banner', bannerInput.files[0]);
      }
      
      if (selectedPromotion) {
        // Update existing promotion
        await api.put(`/promotions/${selectedPromotion.id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Promotion updated successfully');
      } else {
        // Create new promotion
        await api.post('/promotions', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Promotion created successfully');
      }
      
      // Reset form and fetch updated promotions
      resetForm();
      fetchPromotions();
      setSelectedTab('list');
    } catch (err: any) {
      console.error('Error saving promotion:', err);
      setError(err.response?.data?.message || 'Failed to save promotion');
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    
    setFormData({
      title: promotion.title,
      description: promotion.description,
      promotion_type: promotion.promotion_type,
      start_date: format(new Date(promotion.start_date), 'yyyy-MM-dd'),
      end_date: format(new Date(promotion.end_date), 'yyyy-MM-dd'),
      discount_percentage: promotion.discount_percentage || 0,
      discount_amount: promotion.discount_amount || 0,
      is_featured: promotion.is_featured,
      is_active: promotion.is_active,
      applicable_products: promotion.applicable_products || [],
      terms_conditions: promotion.terms_conditions || {},
    });
    
    // Set image previews if they exist
    setPreview({
      image: promotion.image_url,
      banner: promotion.banner_url
    });
    
    setSelectedTab('form');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) {
      return;
    }
    
    try {
      await api.delete(`/promotions/${id}`);
      setSuccess('Promotion deleted successfully');
      fetchPromotions();
    } catch (err) {
      console.error('Error deleting promotion:', err);
      setError('Failed to delete promotion');
    }
  };

  const resetForm = () => {
    setSelectedPromotion(null);
    setFormData({
      title: '',
      description: '',
      promotion_type: 'general',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
      is_featured: false,
      is_active: true,
      discount_percentage: 0,
      discount_amount: 0,
    });
    setPreview({
      image: null,
      banner: null
    });
  };

  const addNewPromotion = () => {
    resetForm();
    setSelectedTab('form');
  };

  if (loading && promotions.length === 0) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Promotion Management</h1>
        <div className="flex space-x-3">
          <button
            className={`px-4 py-2 rounded-md ${selectedTab === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setSelectedTab('list')}
          >
            View All
          </button>
          <button
            className={`px-4 py-2 rounded-md ${selectedTab === 'form' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={addNewPromotion}
          >
            Add New
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded" role="alert">
          <p>{success}</p>
        </div>
      )}

      {selectedTab === 'list' && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promotion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No promotions found. Click "Add New" to create your first promotion.
                  </td>
                </tr>
              ) : (
                promotions.map((promotion) => (
                  <tr key={promotion.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {promotion.image_url && (
                          <div className="flex-shrink-0 h-10 w-10 mr-4">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={promotion.image_url}
                              alt={promotion.title}
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{promotion.title}</div>
                          <div className="text-sm text-gray-500">
                            {promotion.description.length > 50 
                              ? `${promotion.description.substring(0, 50)}...` 
                              : promotion.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {promotion.promotion_type.replace('_', ' ')}
                      </span>
                      {promotion.is_featured && (
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(promotion.start_date), 'MMM d, yyyy')} to<br />
                      {format(new Date(promotion.end_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {promotion.discount_percentage ? (
                        <span>{promotion.discount_percentage}% off</span>
                      ) : promotion.discount_amount ? (
                        <span>₱{promotion.discount_amount.toFixed(2)} off</span>
                      ) : (
                        <span>No discount</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          promotion.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {promotion.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(promotion)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(promotion.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedTab === 'form' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6">
            {selectedPromotion ? 'Edit Promotion' : 'Create New Promotion'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="promotion_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Promotion Type *
                </label>
                <select
                  id="promotion_type"
                  name="promotion_type"
                  value={formData.promotion_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="general">General</option>
                  <option value="flash_sale">Flash Sale</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="product_specific">Product Specific</option>
                  <option value="category_specific">Category Specific</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="discount_percentage" className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  id="discount_percentage"
                  name="discount_percentage"
                  value={formData.discount_percentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="discount_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Amount (₱)
                </label>
                <input
                  type="number"
                  id="discount_amount"
                  name="discount_amount"
                  value={formData.discount_amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                  Promotion Image
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {preview.image && (
                  <div className="mt-2">
                    <img
                      src={preview.image}
                      alt="Promotion preview"
                      className="h-32 w-auto object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="banner" className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Image
                </label>
                <input
                  type="file"
                  id="banner"
                  name="banner"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {preview.banner && (
                  <div className="mt-2">
                    <img
                      src={preview.banner}
                      alt="Banner preview"
                      className="h-32 w-auto object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                    Featured
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setSelectedTab('list');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {selectedPromotion ? 'Update Promotion' : 'Create Promotion'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PromotionManagement; 