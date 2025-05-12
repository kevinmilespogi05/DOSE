import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

interface InventoryItem {
  id: number;
  name: string;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  stock_status: string;
  barcode: string;
}

const InventoryManagement: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockForm, setStockForm] = useState({
    quantity: 0,
    type: 'add',
    batch_number: '',
    unit_price: 0
  });
  const [thresholdForm, setThresholdForm] = useState({
    min_stock_level: 0,
    max_stock_level: 0
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory/status');
      setInventory(response.data);
    } catch (err) {
      setError('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = async (medicineId: number) => {
    try {
      await api.put(`/inventory/stock/${medicineId}`, stockForm);
      setSuccess('Stock updated successfully');
      fetchInventory();
      setSelectedItem(null);
    } catch (err) {
      setError('Failed to update stock');
    }
  };

  const handleThresholdChange = async (medicineId: number) => {
    try {
      await api.put(`/inventory/thresholds/${medicineId}`, thresholdForm);
      setSuccess('Thresholds updated successfully');
      fetchInventory();
      setSelectedItem(null);
    } catch (err) {
      setError('Failed to update thresholds');
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await api.get('/inventory/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export inventory');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/inventory/import/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Inventory imported successfully');
      fetchInventory();
    } catch (err) {
      setError('Failed to import inventory');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <div className="space-x-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export to CSV
          </button>
          <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
            Import from CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map(item => (
          <div key={item.id} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
            
            <div className="space-y-2 mb-4">
              <p className="flex justify-between">
                <span className="text-gray-600">Current Stock:</span>
                <span className="font-medium">{item.stock_quantity}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Min Level:</span>
                <span className="font-medium">{item.min_stock_level}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Max Level:</span>
                <span className="font-medium">{item.max_stock_level}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  item.stock_status === 'low' ? 'text-red-600' :
                  item.stock_status === 'out' ? 'text-red-600' :
                  'text-green-600'
                }`}>
                  {item.stock_status.charAt(0).toUpperCase() + item.stock_status.slice(1)}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Barcode:</span>
                <span className="font-medium">{item.barcode}</span>
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedItem(item)}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Update Stock
              </button>
              <button
                onClick={() => {
                  setSelectedItem(item);
                  setThresholdForm({
                    min_stock_level: item.min_stock_level,
                    max_stock_level: item.max_stock_level
                  });
                }}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Set Thresholds
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Update Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Update Stock</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <select
                  value={stockForm.type}
                  onChange={(e) => setStockForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="add">Add Stock</option>
                  <option value="remove">Remove Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                  min="1"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number
                </label>
                <input
                  type="text"
                  value={stockForm.batch_number}
                  onChange={(e) => setStockForm(prev => ({ ...prev, batch_number: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Price
                </label>
                <input
                  type="number"
                  value={stockForm.unit_price}
                  onChange={(e) => setStockForm(prev => ({ ...prev, unit_price: parseFloat(e.target.value) }))}
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStockChange(selectedItem.id)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Update Modal */}
      {selectedItem && thresholdForm.min_stock_level > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Set Stock Thresholds</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  value={thresholdForm.min_stock_level}
                  onChange={(e) => setThresholdForm(prev => ({ ...prev, min_stock_level: parseInt(e.target.value) }))}
                  min="0"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Stock Level
                </label>
                <input
                  type="number"
                  value={thresholdForm.max_stock_level}
                  onChange={(e) => setThresholdForm(prev => ({ ...prev, max_stock_level: parseInt(e.target.value) }))}
                  min={thresholdForm.min_stock_level + 1}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setThresholdForm({ min_stock_level: 0, max_stock_level: 0 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleThresholdChange(selectedItem.id)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Update Thresholds
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement; 