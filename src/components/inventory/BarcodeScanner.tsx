import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { CameraIcon, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';
import toast from 'react-hot-toast';

interface BarcodeScannerProps {
  onScanComplete: (product: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Toggle scanner visibility
  const toggleScanner = async () => {
    if (isScanning) {
      stopScanner();
    } else {
      setIsScanning(true);
      setError(null);
      setScannedBarcode(null);
      startScanner();
    }
  };

  // Start the barcode scanner
  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScannerReady(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure you have granted camera permissions.');
      setIsScanning(false);
    }
  };

  // Stop the barcode scanner
  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setScannerReady(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Process video frames to detect barcodes
  useEffect(() => {
    if (!isScanning || !scannerReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animationFrameId: number;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scanFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        
        if (code) {
          // QR code detected
          setScannedBarcode(code.data);
          stopScanner();
          lookupBarcode(code.data);
          return;
        }

        // If QR detection fails, try linear barcode detection
        // For linear barcodes, we would typically use a dedicated library
        // but for simplicity, we'll just allow manual entry if QR detection fails
      }
      
      animationFrameId = requestAnimationFrame(scanFrame);
    };
    
    animationFrameId = requestAnimationFrame(scanFrame);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, scannerReady]);

  // Lookup product information using the scanned barcode
  const lookupBarcode = async (barcode: string) => {
    try {
      const response = await axios.post('/api/inventory/scan', { barcode });
      toast.success('Product found!');
      onScanComplete(response.data);
    } catch (error) {
      setError('Product not found. Please try again or enter the barcode manually.');
    }
  };

  // Manually enter barcode
  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedBarcode) return;
    
    try {
      const response = await axios.post('/api/inventory/scan', { barcode: scannedBarcode });
      toast.success('Product found!');
      onScanComplete(response.data);
    } catch (error) {
      setError('Product not found. Please check the barcode and try again.');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <CameraIcon className="h-5 w-5 mr-2" />
        Barcode Scanner
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-start">
          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {!isScanning ? (
          <button
            onClick={toggleScanner}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <CameraIcon className="h-5 w-5 mr-2" />
            Scan Barcode
          </button>
        ) : (
          <div>
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-md"
                autoPlay
                playsInline
                muted
              />
              <button
                onClick={stopScanner}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                aria-label="Close scanner"
              >
                <X className="h-5 w-5" />
              </button>
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="text-center text-sm text-gray-500 mt-2">
              Position the barcode within the camera view
            </div>
          </div>
        )}

        <div className="text-center text-gray-500 text-sm">- OR -</div>

        <form onSubmit={handleManualEntry} className="space-y-2">
          <div className="flex items-center">
            <input
              type="text"
              value={scannedBarcode || ''}
              onChange={(e) => setScannedBarcode(e.target.value)}
              placeholder="Enter barcode manually"
              className="flex-1 border rounded-l-md px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={!scannedBarcode}
              className={`px-3 py-2 rounded-r-md text-sm ${
                !scannedBarcode
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BarcodeScanner; 