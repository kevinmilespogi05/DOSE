import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Prescription {
  id: number;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  notes: string;
}

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/prescriptions/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPrescriptions(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to load your prescriptions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a prescription image to upload');
      return;
    }

    try {
      setUploadingPrescription(true);
      setError(null);

      const formData = new FormData();
      formData.append('prescription', selectedFile);

      const response = await axios.post('/prescriptions/upload', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Refresh prescriptions list
      fetchPrescriptions();
    } catch (err) {
      console.error('Error uploading prescription:', err);
      setError('Failed to upload prescription. Please try again.');
    } finally {
      setUploadingPrescription(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Prescriptions</h1>

      {/* Upload Form */}
      <div className="bg-white shadow-md rounded-lg mb-8 p-6">
        <h2 className="text-xl font-semibold mb-4">Upload a Prescription</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-40 h-40 border rounded-lg overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Prescription preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex flex-col space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="prescription-image"
              />
              <label
                htmlFor="prescription-image"
                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Choose Image
              </label>
              <button
                type="submit"
                disabled={!selectedFile || uploadingPrescription}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {uploadingPrescription ? 'Uploading...' : 'Upload Prescription'}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}
          
          <div className="text-sm text-gray-600 mt-2">
            <p>Upload a clear image of your doctor's prescription to purchase prescription medicines.</p>
            <p>Supported formats: JPG, PNG. Max size: 5MB.</p>
          </div>
        </form>
      </div>

      {/* Prescriptions List */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Prescription History</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">You haven't uploaded any prescriptions yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="border rounded-lg overflow-hidden">
                <div className="relative h-48">
                  <img 
                    src={prescription.image_url} 
                    alt="Prescription" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
                    {getStatusIcon(prescription.status)}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(prescription.created_at).toLocaleDateString()}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${prescription.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        prescription.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}
                    >
                      {prescription.status}
                    </span>
                  </div>
                  
                  {prescription.notes && (
                    <div className="mt-2 text-sm text-gray-700">
                      <p className="font-semibold">Pharmacist Notes:</p>
                      <p>{prescription.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescriptions; 