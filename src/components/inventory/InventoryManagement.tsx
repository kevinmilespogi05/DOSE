import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  Download,
  Upload,
  AlertTriangle,
  Package,
  Barcode,
  Search,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import BarcodeManager from './BarcodeManager';
import BarcodeScanner from './BarcodeScanner';
import InventoryImportExport from './InventoryImportExport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import FileSaver from 'file-saver';
import Papa from 'papaparse';

interface InventoryItem {
  id: number;
  name: string;
  generic_name: string;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  barcode: string;
  unit: string;
  supplier_name: string;
}

interface DetailModalProps {
  item: InventoryItem;
  onClose: () => void;
  onUpdate: () => void;
}

const ItemDetailModal: React.FC<DetailModalProps> = ({ item, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [updatedBarcode, setUpdatedBarcode] = useState(item.barcode || '');

  const handleScanComplete = (product: any) => {
    if (product.id === item.id) {
      alert('This is the same product!');
    } else {
      alert(`Scanned product: ${product.name}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">{item.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="details">Product Details</TabsTrigger>
            <TabsTrigger value="barcode">Barcode Management</TabsTrigger>
            <TabsTrigger value="scanner">Barcode Scanner</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">General Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product ID:</span>
                    <span className="font-medium">{item.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Generic Name:</span>
                    <span className="font-medium">{item.generic_name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit:</span>
                    <span className="font-medium">{item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-medium">{item.supplier_name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Barcode:</span>
                    <span className="font-medium">{updatedBarcode || '-'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Inventory Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Stock:</span>
                    <span className="font-medium">{item.stock_quantity} {item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Stock Level:</span>
                    <span className="font-medium">{item.min_stock_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Stock Level:</span>
                    <span className="font-medium">{item.max_stock_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reorder Point:</span>
                    <span className="font-medium">{item.reorder_point}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.stock_status === 'in_stock' ? 'bg-green-100 text-green-800' :
                      item.stock_status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.stock_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="barcode" className="p-6">
            <BarcodeManager 
              medicineId={item.id}
              medicineName={item.name}
              existingBarcode={item.barcode}
              onBarcodeUpdate={(barcode) => {
                setUpdatedBarcode(barcode);
                onUpdate();
              }}
            />
          </TabsContent>
          
          <TabsContent value="scanner" className="p-6">
            <BarcodeScanner onScanComplete={handleScanComplete} />
          </TabsContent>
        </Tabs>
        
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const InventoryManagement: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/inventory/status');
      setInventory(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = Papa.unparse(inventory.map(item => ({
      ID: item.id,
      Name: item.name,
      'Generic Name': item.generic_name,
      'Stock Quantity': item.stock_quantity,
      'Min Stock Level': item.min_stock_level,
      'Max Stock Level': item.max_stock_level,
      'Reorder Point': item.reorder_point,
      'Stock Status': item.stock_status,
      Barcode: item.barcode,
      Unit: item.unit,
      Supplier: item.supplier_name
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    FileSaver.saveAs(blob, `inventory_export_${new Date().toISOString()}.csv`);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      Papa.parse(file, {
        complete: async (results) => {
          try {
            await axios.post('/inventory/import', {
              data: results.data
            });
            fetchInventory(); // Refresh inventory after import
          } catch (err) {
            setError('Failed to import inventory data');
          }
        },
        header: true
      });
    } catch (err) {
      setError('Failed to parse CSV file');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.generic_name && item.generic_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.barcode && item.barcode.includes(searchTerm));
    
    const matchesFilter = filterStatus === 'all' || item.stock_status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const lowStockItems = inventory.filter(item => item.stock_status === 'low_stock');
  const outOfStockItems = inventory.filter(item => item.stock_status === 'out_of_stock');

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your product inventory, track stock levels, and handle barcodes
        </p>
      </div>

      {/* Low Stock Alerts */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <h2 className="text-lg font-semibold text-yellow-800">
              Inventory Alerts
            </h2>
          </div>
          <div className="mt-2 space-y-2">
            {outOfStockItems.length > 0 && (
              <div className="text-red-600 font-medium">
                {outOfStockItems.length} items out of stock
              </div>
            )}
            {lowStockItems.length > 0 && (
              <div className="text-yellow-700 font-medium">
                {lowStockItems.length} items with low stock
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import/Export Panel (Collapsed by default) */}
      <div className="mb-6">
        <button
          onClick={() => setShowImportExport(!showImportExport)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <span className="mr-1">{showImportExport ? '▼' : '►'}</span>
          Import & Export Tools
        </button>
        
        {showImportExport && (
          <div className="mt-4">
            <InventoryImportExport 
              inventory={inventory}
              onImportComplete={fetchInventory}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products or barcodes..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thresholds
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Barcode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No inventory items found matching your criteria
                </td>
              </tr>
            ) : (
              filteredInventory.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => handleItemClick(item)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.generic_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.stock_quantity} {item.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.stock_status)}`}>
                      {item.stock_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Min: {item.min_stock_level}</div>
                    <div>Max: {item.max_stock_level}</div>
                    <div>Reorder: {item.reorder_point}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.barcode ? (
                      <div className="flex items-center">
                        <Barcode className="h-4 w-4 mr-1 text-blue-500" />
                        <span>{item.barcode}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.supplier_name || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <ItemDetailModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)}
          onUpdate={fetchInventory}
        />
      )}
    </div>
  );
};

export default InventoryManagement; 