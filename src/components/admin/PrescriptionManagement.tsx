import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  FileText,
  UserIcon,
  CalendarIcon,
  MailIcon,
  Filter,
  Search,
  ArrowUpDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  PlusCircle,
  CheckSquare,
  ChevronDown,
  RefreshCw,
  X as XIcon,
  AlertCircle
} from 'lucide-react';
import { showConfirmation, showSuccess, showError, showLoading, closeAlert, showInfo, showToast } from '../../utils/swalUtil';

interface Prescription {
  id: number;
  user_id: number;
  username: string;
  email: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  notes: string;
}

interface Medicine {
  id: number;
  name: string;
  price: number;
  description: string;
}

const PrescriptionManagement = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [recommendedMedicines, setRecommendedMedicines] = useState<Medicine[]>([]);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPrescriptions();
  }, [refreshKey]);

  useEffect(() => {
    filterAndSortPrescriptions();
  }, [prescriptions, searchTerm, statusFilter, sortField, sortDirection]);

  const filterAndSortPrescriptions = () => {
    let filtered = [...prescriptions];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.username?.toLowerCase().includes(term) || 
        p.email?.toLowerCase().includes(term) ||
        p.id.toString().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === 'updated_at') {
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      } else if (sortField === 'username') {
        comparison = a.username.localeCompare(b.username);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredPrescriptions(filtered);
  };

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/prescriptions/admin/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPrescriptions(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to load prescriptions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setNotes(prescription.notes || '');
    setZoomLevel(1);
    
    if (prescription.status === 'approved') {
      fetchRecommendedMedicines(prescription.id);
    } else {
      setRecommendedMedicines([]);
    }
  };

  const fetchRecommendedMedicines = async (prescriptionId: number) => {
    try {
      setIsLoadingMedicines(true);
      const response = await axios.get(`/prescriptions/admin/${prescriptionId}/recommendations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setRecommendedMedicines(response.data);
    } catch (err) {
      console.error('Error fetching recommended medicines:', err);
    } finally {
      setIsLoadingMedicines(false);
    }
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!selectedPrescription) return;
    
    const statusText = status === 'approved' ? 'approve' : 'reject';
    
    const result = await showConfirmation(
      `${status === 'approved' ? 'Approve' : 'Reject'} Prescription`,
      `Are you sure you want to ${statusText} this prescription?`,
      `Yes, ${statusText}`,
      'Cancel'
    );
    
    if (!result.isConfirmed) return;

    showLoading(`${status === 'approved' ? 'Approving' : 'Rejecting'} prescription...`);
    
    try {
      setUpdatingStatus(true);
      const response = await axios.put(
        `/prescriptions/${selectedPrescription.id}/status`,
        { status, notes },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Update prescription list
      setPrescriptions(prescriptions.map(p => 
        p.id === selectedPrescription.id 
          ? { ...p, status, notes, updated_at: new Date().toISOString() }
          : p
      ));

      // Update selected prescription
      setSelectedPrescription({
        ...selectedPrescription,
        status,
        notes,
        updated_at: new Date().toISOString()
      });

      closeAlert();
      showSuccess(
        `Prescription ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        `The prescription has been successfully ${status}.`
      );
      
      // If approved, fetch recommended medicines
      if (status === 'approved') {
        fetchRecommendedMedicines(selectedPrescription.id);
      }
    } catch (err) {
      console.error(`Error ${status} prescription:`, err);
      closeAlert();
      showError('Action Failed', `Failed to ${statusText} the prescription. Please try again.`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBatchStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (selectedItems.length === 0) return;
    
    const statusText = status === 'approved' ? 'approve' : 'reject';
    
    const result = await showConfirmation(
      `Batch ${status === 'approved' ? 'Approve' : 'Reject'}`,
      `Are you sure you want to ${statusText} ${selectedItems.length} selected prescription(s)?`,
      `Yes, ${statusText} all`,
      'Cancel'
    );
    
    if (!result.isConfirmed) return;

    showLoading(`${status === 'approved' ? 'Approving' : 'Rejecting'} prescriptions...`);
    
    try {
      setIsBatchProcessing(true);
      
      // Process each selected prescription
      for (const id of selectedItems) {
        await axios.put(
          `/prescriptions/${id}/status`,
          { status, notes: '' },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }

      // Update prescriptions list
      setPrescriptions(prescriptions.map(p => 
        selectedItems.includes(p.id)
          ? { ...p, status, updated_at: new Date().toISOString() }
          : p
      ));

      setSelectedItems([]);
      setShowBatchActions(false);
      
      closeAlert();
      showSuccess(
        'Batch Action Complete',
        `Successfully ${status} ${selectedItems.length} prescription(s).`
      );
    } catch (err) {
      console.error(`Error batch ${status} prescriptions:`, err);
      closeAlert();
      showError('Batch Action Failed', `Failed to ${statusText} some prescriptions. Please try again.`);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredPrescriptions.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredPrescriptions.map(p => p.id));
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      if (direction === 'in' && prev < 3) return prev + 0.25;
      if (direction === 'out' && prev > 0.5) return prev - 0.25;
      return prev;
    });
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const handleAddMedicine = async (medicineId: number) => {
    if (!selectedPrescription) return;
    
    try {
      const response = await axios.post(
        `/prescriptions/${selectedPrescription.id}/medicines`,
        { medicine_id: medicineId, quantity: 1 },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Show success notification
      showToast('success', 'Medicine added to prescription successfully');
    } catch (err) {
      console.error('Error adding medicine to prescription:', err);
      setError('Failed to add medicine to prescription');
      showToast('error', 'Failed to add medicine to prescription');
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

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize";
    switch (status) {
      case 'approved':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>{status}</span>;
      case 'rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>{status}</span>;
      default:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Prescription Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)} 
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
          
          {selectedItems.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBatchActions(!showBatchActions)}
                disabled={isBatchProcessing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Layers size={16} className="mr-2" />
                Batch Actions ({selectedItems.length})
                <ChevronDown size={16} className="ml-2" />
              </button>
              
              {showBatchActions && (
                <div className="absolute z-10 right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => handleBatchStatusUpdate('approved')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      disabled={isBatchProcessing}
                    >
                      <CheckCircle size={16} className="inline mr-2 text-green-500" />
                      Approve Selected
                    </button>
                    <button
                      onClick={() => handleBatchStatusUpdate('rejected')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      disabled={isBatchProcessing}
                    >
                      <XCircle size={16} className="inline mr-2 text-red-500" />
                      Reject Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search prescriptions..."
              className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex space-x-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <Filter size={16} />
              </div>
            </div>
            
            <div className="relative">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="created_at">Date Submitted</option>
                <option value="updated_at">Last Updated</option>
                <option value="username">Customer Name</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ArrowUpDown size={16} />
              </div>
            </div>
            
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        
        {isBatchProcessing && (
          <div className="mt-4 flex items-center justify-center py-2 bg-blue-50 text-blue-700 rounded">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Processing {selectedItems.length} prescriptions...
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2 bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Prescriptions ({filteredPrescriptions.length})</h2>
            
            {filteredPrescriptions.length > 0 && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredPrescriptions.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Select All</span>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">No prescriptions found.</p>
              {searchTerm || statusFilter !== 'all' ? (
                <p className="text-sm mt-1">Try adjusting your filters.</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <div 
                  key={prescription.id} 
                  className={`border rounded-lg overflow-hidden cursor-pointer transition hover:shadow-md 
                    ${selectedPrescription?.id === prescription.id ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex p-4 items-center">
                    <div className="mr-3 flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(prescription.id)}
                        onChange={() => handleSelectItem(prescription.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div 
                      className="flex flex-1 items-center"
                      onClick={() => handleViewPrescription(prescription)}
                    >
                    <div className="mr-4 flex-shrink-0 h-16 w-16 rounded-md overflow-hidden">
                      <img 
                        src={prescription.image_url} 
                        alt="Prescription thumbnail" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {prescription.username || prescription.email}
                        </p>
                        {getStatusBadge(prescription.status)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon size={14} className="mr-1" />
                        {new Date(prescription.created_at).toLocaleDateString()}
                      </div>
                        {prescription.notes && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            Notes: {prescription.notes}
                          </p>
                        )}
                    </div>
                    <div>
                      <Eye size={20} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Prescription Details</h2>
          
          {!selectedPrescription ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">Select a prescription to view details</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  Prescription #{selectedPrescription.id}
                </h3>
                {getStatusBadge(selectedPrescription.status)}
              </div>
              
              <div className="border-t border-b py-4">
                <div className="flex items-center space-x-2 mb-2">
                  <UserIcon size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">{selectedPrescription.username}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <MailIcon size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">{selectedPrescription.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CalendarIcon size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">
                    Submitted on {new Date(selectedPrescription.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-md font-medium">Prescription Image</h4>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleZoom('in')} 
                      className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
                      disabled={zoomLevel >= 3}
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button 
                      onClick={() => handleZoom('out')} 
                      className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
                      disabled={zoomLevel <= 0.5}
                    >
                      <ZoomOut size={16} />
                    </button>
                    <button 
                      onClick={resetZoom} 
                      className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
                <div className="border rounded-md overflow-hidden bg-gray-50" style={{ height: '300px', overflow: 'auto' }}>
                  <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', transition: 'transform 0.2s' }}>
                    <img 
                      ref={imageRef}
                    src={selectedPrescription.image_url} 
                    alt="Prescription" 
                    className="w-full h-auto"
                  />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-2">Pharmacist Notes</h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Add notes for the customer..."
                  disabled={selectedPrescription.status !== 'pending' || updatingStatus}
                />
              </div>
              
              {selectedPrescription.status === 'pending' && (
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={updatingStatus}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 flex items-center justify-center"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    {updatingStatus ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={updatingStatus}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 flex items-center justify-center"
                  >
                    <XCircle size={16} className="mr-2" />
                    {updatingStatus ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              )}
              
              {selectedPrescription.status === 'approved' && (
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium mb-3">Recommended Medicines</h4>
                  
                  {isLoadingMedicines ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : recommendedMedicines.length === 0 ? (
                    <div className="text-center py-3 text-gray-500 border border-dashed rounded-md">
                      <p className="text-sm">No medicine recommendations yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recommendedMedicines.map(medicine => (
                        <div key={medicine.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                          <div>
                            <p className="font-medium text-sm">{medicine.name}</p>
                            <p className="text-xs text-gray-500">${typeof medicine.price === 'number' ? medicine.price.toFixed(2) : parseFloat(medicine.price).toFixed(2)}</p>
                          </div>
                          <button 
                            className="p-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                            title="Add to prescription"
                            onClick={() => handleAddMedicine(medicine.id)}
                          >
                            <PlusCircle size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {error && (
                <div className="text-red-500 text-sm mt-2">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionManagement; 