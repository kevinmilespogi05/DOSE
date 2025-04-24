import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface SalesData {
  period: string;
  total: number;
}

interface ReportSummary {
  orderCount: number;
  monthlyRevenue: number;
  averageOrderValue: number;
}

interface ReportData {
  dailySales: SalesData[];
  monthlySales: SalesData[];
  summary: ReportSummary;
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    dailySales: [],
    monthlySales: [],
    summary: {
      orderCount: 0,
      monthlyRevenue: 0,
      averageOrderValue: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get('/api/admin/reports/sales', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setReportData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports. Please try again later.');
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Sales Reports</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Report */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Daily Sales</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="py-2 px-4 text-left">Day</th>
                  <th className="py-2 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reportData.dailySales.length > 0 ? (
                  reportData.dailySales.map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-4">{data.period}</td>
                      <td className="py-2 px-4 text-right">₱{data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-gray-500">No daily sales data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Sales Report */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Monthly Sales</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="py-2 px-4 text-left">Month</th>
                  <th className="py-2 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reportData.monthlySales.length > 0 ? (
                  reportData.monthlySales.map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-4">{data.period}</td>
                      <td className="py-2 px-4 text-right">₱{data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-gray-500">No monthly sales data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Orders</div>
            <div className="text-2xl font-bold mt-1">{reportData.summary.orderCount}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Monthly Revenue</div>
            <div className="text-2xl font-bold mt-1">₱{reportData.summary.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Average Order Value</div>
            <div className="text-2xl font-bold mt-1">₱{reportData.summary.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 