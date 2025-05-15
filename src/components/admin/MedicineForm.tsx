import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import { showLoading, closeAlert, showSuccess, showError } from '../../utils/swalUtil';

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface MedicineFormProps {
  onSubmit: (medicine: any) => void;
  initialData?: any;
}

const MedicineForm: React.FC<MedicineFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    generic_name: initialData?.generic_name || '',
    brand: initialData?.brand || '',
    category_id: initialData?.category_id || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    stock_quantity: initialData?.stock_quantity || '',
    unit: initialData?.unit || '',
    supplier_id: initialData?.supplier_id || '',
    requires_prescription: initialData?.requires_prescription || false,
    min_stock_level: initialData?.min_stock_level || 10,
    max_stock_level: initialData?.max_stock_level || 100,
    reorder_point: initialData?.reorder_point || 20,
    expiry_date: initialData?.expiry_date || '',
    box_quantity: initialData?.box_quantity || '',
    price_per_box: initialData?.price_per_box || '',
    image_url: initialData?.image_url || ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(initialData?.image_url || '');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/api/medicine-categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axiosInstance.get('/api/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    showLoading(initialData ? 'Updating medicine...' : 'Adding new medicine...');

    try {
      let imageUrl = formData.image_url;

      // Upload image if selected
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);

        const response = await axiosInstance.post('/api/medicines/upload', imageFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        imageUrl = response.data.imageUrl;
      }

      // Format the data
      const medicineData = {
        ...formData,
        image_url: imageUrl,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        min_stock_level: parseInt(formData.min_stock_level),
        max_stock_level: parseInt(formData.max_stock_level),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        requires_prescription: Boolean(formData.requires_prescription)
      };

      // Submit form with image URL
      await onSubmit(medicineData);
      
      closeAlert();
      showSuccess(
        initialData ? 'Medicine Updated' : 'Medicine Added', 
        `${formData.name} has been successfully ${initialData ? 'updated' : 'added'} to the inventory.`
      );
    } catch (error) {
      console.error('Error submitting form:', error);
      closeAlert();
      showError(
        'Submission Failed', 
        `Failed to ${initialData ? 'update' : 'add'} medicine. Please try again.`
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Medicine Image</label>
          <div className="mt-1 flex items-center space-x-4">
            <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="medicine-image"
              />
              <label
                htmlFor="medicine-image"
                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Choose Image
              </label>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Generic Name</label>
            <input
              type="text"
              value={formData.generic_name}
              onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Brand</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier</label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₱</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Box Quantity</label>
            <input
              type="number"
              value={formData.box_quantity}
              onChange={(e) => setFormData({ ...formData, box_quantity: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price per Box</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₱</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.price_per_box}
                onChange={(e) => setFormData({ ...formData, price_per_box: e.target.value })}
                className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
            <input
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Stock Status</label>
            <div className={`mt-1 px-3 py-2 rounded-md ${
              parseInt(formData.stock_quantity) === 0
                ? 'bg-red-100 text-red-800'
                : parseInt(formData.stock_quantity) <= parseInt(formData.min_stock_level)
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  parseInt(formData.stock_quantity) === 0
                    ? 'bg-red-500'
                    : parseInt(formData.stock_quantity) <= parseInt(formData.min_stock_level)
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}></div>
                {parseInt(formData.stock_quantity) === 0
                  ? 'Out of Stock'
                  : parseInt(formData.stock_quantity) <= parseInt(formData.min_stock_level)
                  ? `Low Stock (Below ${formData.min_stock_level} ${formData.unit})`
                  : 'In Stock'}
              </div>
              <div className="text-sm mt-1">
                Current Stock: {formData.stock_quantity} {formData.unit}
                {parseInt(formData.stock_quantity) <= parseInt(formData.reorder_point) && (
                  <span className="text-amber-600 ml-2">
                    • Reorder Point Reached
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Unit</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="">Select Unit</option>
              <option value="tablets">Tablets</option>
              <option value="capsules">Capsules</option>
              <option value="ml">ML</option>
              <option value="mg">MG</option>
              <option value="pieces">Pieces</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
        </div>

        {/* Stock Management */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Minimum Stock Level</label>
            <input
              type="number"
              value={formData.min_stock_level}
              onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Maximum Stock Level</label>
            <input
              type="number"
              value={formData.max_stock_level}
              onChange={(e) => setFormData({ ...formData, max_stock_level: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reorder Point</label>
            <input
              type="number"
              value={formData.reorder_point}
              onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">Stock level at which to reorder</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Prescription Requirement */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.requires_prescription}
            onChange={(e) => setFormData({ ...formData, requires_prescription: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Requires Prescription
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
        >
          {uploading ? 'Saving...' : 'Save Medicine'}
        </button>
      </div>
    </form>
  );
};

export default MedicineForm; 