import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Barcode, Download, Copy, RefreshCw, UploadCloud, Printer } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode.react';
import toast from 'react-hot-toast';

interface BarcodeManagerProps {
  medicineId?: number;
  medicineName?: string;
  existingBarcode?: string;
  onBarcodeUpdate: (barcode: string) => void;
}

const BarcodeManager: React.FC<BarcodeManagerProps> = ({
  medicineId,
  medicineName,
  existingBarcode,
  onBarcodeUpdate
}) => {
  const [barcode, setBarcode] = useState<string>(existingBarcode || '');
  const [barcodeType, setBarcodeType] = useState<'barcode' | 'qrcode'>('barcode');
  const [isGenerating, setIsGenerating] = useState(false);
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Generate a random barcode
  const generateRandomBarcode = () => {
    // EAN-13 format (12 digits + check digit)
    const prefix = '200'; // Product type prefix for pharmaceuticals
    const middle = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const newBarcode = prefix + middle + suffix;
    setBarcode(newBarcode);
    onBarcodeUpdate(newBarcode);
  };

  // Save barcode to the database
  const saveBarcode = async () => {
    if (!medicineId) return;
    
    try {
      setIsGenerating(true);
      await axios.put(`/api/inventory/barcode/${medicineId}`, { barcode });
      toast.success('Barcode saved successfully');
    } catch (error) {
      toast.error('Failed to save barcode');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy barcode to clipboard
  const copyBarcode = () => {
    navigator.clipboard.writeText(barcode);
    toast.success('Barcode copied to clipboard');
  };

  // Download barcode as image
  const downloadBarcode = () => {
    if (barcodeType === 'barcode' && barcodeRef.current) {
      const link = document.createElement('a');
      link.download = `barcode-${medicineName?.replace(/\s+/g, '-').toLowerCase() || 'product'}.png`;
      link.href = barcodeRef.current.toDataURL('image/png');
      link.click();
    } else if (barcodeType === 'qrcode' && qrCodeRef.current) {
      const canvas = qrCodeRef.current.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `qrcode-${medicineName?.replace(/\s+/g, '-').toLowerCase() || 'product'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
  };

  // Print barcode
  const printBarcode = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let content = '';
    if (barcodeType === 'barcode') {
      content = `
        <html>
          <head>
            <title>Print Barcode</title>
            <style>
              body { font-family: Arial; text-align: center; }
              .barcode-container { margin: 20px; }
              .product-name { font-size: 14px; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <div class="product-name">${medicineName || 'Product'}</div>
              <img src="${barcodeRef.current?.toDataURL('image/png')}" />
              <div>${barcode}</div>
            </div>
          </body>
        </html>
      `;
    } else {
      const canvas = qrCodeRef.current?.querySelector('canvas');
      content = `
        <html>
          <head>
            <title>Print QR Code</title>
            <style>
              body { font-family: Arial; text-align: center; }
              .barcode-container { margin: 20px; }
              .product-name { font-size: 14px; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <div class="product-name">${medicineName || 'Product'}</div>
              <img src="${canvas?.toDataURL('image/png')}" />
            </div>
          </body>
        </html>
      `;
    }
    
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <Barcode className="h-5 w-5 mr-2" />
        Barcode Management
      </h3>

      <div className="space-y-4">
        <div className="flex space-x-2">
          <button
            type="button"
            className={`px-3 py-2 text-sm rounded-md ${
              barcodeType === 'barcode' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
            }`}
            onClick={() => setBarcodeType('barcode')}
          >
            Linear Barcode
          </button>
          <button
            type="button"
            className={`px-3 py-2 text-sm rounded-md ${
              barcodeType === 'qrcode' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
            }`}
            onClick={() => setBarcodeType('qrcode')}
          >
            QR Code
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={barcode}
            onChange={(e) => {
              setBarcode(e.target.value);
              onBarcodeUpdate(e.target.value);
            }}
            placeholder="Enter barcode value"
            className="flex-1 border rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={generateRandomBarcode}
            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
            title="Generate random barcode"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-center my-4">
          {barcodeType === 'barcode' ? (
            <div>
              <canvas ref={barcodeRef} className="mx-auto"></canvas>
              {barcode && (
                <div className="text-center text-sm mt-1">{barcode}</div>
              )}
            </div>
          ) : (
            <div ref={qrCodeRef}>
              <QRCode value={barcode || 'No barcode'} size={128} />
            </div>
          )}
        </div>

        {barcodeType === 'barcode' && barcode && (
          <div ref={(node) => {
            if (node && barcodeRef.current) {
              try {
                JsBarcode(barcodeRef.current, barcode, {
                  format: 'EAN13',
                  lineColor: '#000',
                  width: 2,
                  height: 50,
                  displayValue: false
                });
              } catch (e) {
                // Invalid barcode
              }
            }
          }} />
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={saveBarcode}
            disabled={isGenerating || !barcode || !medicineId}
            className={`flex items-center px-3 py-2 text-sm rounded-md ${
              isGenerating || !barcode || !medicineId
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <UploadCloud className="h-4 w-4 mr-1" />
            Save
          </button>
          <button
            onClick={copyBarcode}
            disabled={!barcode}
            className={`flex items-center px-3 py-2 text-sm rounded-md ${
              !barcode
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </button>
          <button
            onClick={downloadBarcode}
            disabled={!barcode}
            className={`flex items-center px-3 py-2 text-sm rounded-md ${
              !barcode
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </button>
          <button
            onClick={printBarcode}
            disabled={!barcode}
            className={`flex items-center px-3 py-2 text-sm rounded-md ${
              !barcode
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeManager; 