import React, { useState } from 'react';
import axios from 'axios';
import { FileSpreadsheet, FileJson, Upload, Download, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import FileSaver from 'file-saver';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: number;
  name: string;
  generic_name: string;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  stock_status: string;
  barcode: string;
  unit: string;
  supplier_name: string;
}

interface InventoryImportExportProps {
  inventory: InventoryItem[];
  onImportComplete: () => void;
}

const InventoryImportExport: React.FC<InventoryImportExportProps> = ({
  inventory,
  onImportComplete
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [importError, setImportError] = useState<string | null>(null);
  
  // Transform inventory data for export
  const transformInventoryForExport = () => {
    return inventory.map(item => ({
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
    }));
  };
  
  // Handle exporting inventory data
  const handleExport = () => {
    const data = transformInventoryForExport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (exportFormat === 'csv') {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      FileSaver.saveAs(blob, `inventory_export_${timestamp}.csv`);
    } else {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      FileSaver.saveAs(blob, `inventory_export_${timestamp}.json`);
    }
    
    toast.success(`Inventory exported as ${exportFormat.toUpperCase()}`);
  };
  
  // Handle importing inventory data
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setImportError(null);
    
    try {
      if (importFormat === 'csv') {
        handleCsvImport(file);
      } else {
        await handleJsonImport(file);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsImporting(false);
    }
  };
  
  // Handle CSV file import
  const handleCsvImport = (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            throw new Error(`CSV parsing error: ${results.errors[0].message}`);
          }
          
          // Send the parsed data to the server
          await axios.post('/api/inventory/import', {
            data: results.data,
            format: 'csv'
          });
          
          toast.success('Inventory imported successfully');
          onImportComplete();
        } catch (error) {
          console.error('CSV import error:', error);
          setImportError(`Failed to import CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        setImportError(`Failed to parse CSV: ${error.message}`);
        setIsImporting(false);
      }
    });
  };
  
  // Handle JSON file import
  const handleJsonImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        throw new Error('Imported JSON must be an array of inventory items');
      }
      
      // Send the parsed data to the server
      await axios.post('/api/inventory/import', {
        data,
        format: 'json'
      });
      
      toast.success('Inventory imported successfully');
      onImportComplete();
    } catch (error) {
      console.error('JSON import error:', error);
      setImportError(`Failed to import JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Import & Export Inventory</h3>
      
      {/* Export Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-2">Export Inventory</h4>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="exportFormat"
                checked={exportFormat === 'csv'}
                onChange={() => setExportFormat('csv')}
                className="text-blue-600"
              />
              <span className="text-sm flex items-center">
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                CSV
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="exportFormat"
                checked={exportFormat === 'json'}
                onChange={() => setExportFormat('json')}
                className="text-blue-600"
              />
              <span className="text-sm flex items-center">
                <FileJson className="h-4 w-4 mr-1" />
                JSON
              </span>
            </label>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={inventory.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </button>
        </div>
      </div>
      
      {/* Import Section */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Import Inventory</h4>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="importFormat"
                checked={importFormat === 'csv'}
                onChange={() => setImportFormat('csv')}
                className="text-blue-600"
              />
              <span className="text-sm flex items-center">
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                CSV
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="importFormat"
                checked={importFormat === 'json'}
                onChange={() => setImportFormat('json')}
                className="text-blue-600"
              />
              <span className="text-sm flex items-center">
                <FileJson className="h-4 w-4 mr-1" />
                JSON
              </span>
            </label>
          </div>
          <label className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
            <Upload className="h-4 w-4 mr-1" />
            {isImporting ? 'Importing...' : 'Import'}
            <input
              type="file"
              accept={importFormat === 'csv' ? '.csv' : '.json'}
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>
        
        {importError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-start">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{importError}</span>
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500">
          <p className="mb-1 font-medium">Import Guidelines:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Make sure your file follows the correct format (download an export first as a template)</li>
            <li>For CSV: Required columns are Name, Stock Quantity, and Unit</li>
            <li>For JSON: Each item must have at minimum a "Name", "Stock Quantity", and "Unit" field</li>
            <li>Large imports may take some time to process</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InventoryImportExport; 