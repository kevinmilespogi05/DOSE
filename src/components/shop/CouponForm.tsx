import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { formatPeso } from '../../utils/currency';

interface CouponData {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
}

interface CouponFormProps {
  subtotal: number;
  onApplyCoupon: (couponData: CouponData) => void;
  onRemoveCoupon: () => void;
  appliedCoupon: CouponData | null;
}

const CouponForm: React.FC<CouponFormProps> = ({ 
  subtotal, 
  onApplyCoupon, 
  onRemoveCoupon,
  appliedCoupon
}) => {
  const [couponCode, setCouponCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState<boolean>(false);
  
  useEffect(() => {
    fetchAvailableCoupons();
  }, []);
  
  const fetchAvailableCoupons = async () => {
    try {
      const response = await axios.get('coupons/available', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAvailableCoupons(response.data);
    } catch (err) {
      console.error('Error fetching available coupons:', err);
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.post('coupons/validate', 
        {
          code: couponCode,
          total_amount: subtotal
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.valid) {
        setSuccess(`Coupon applied successfully! You saved ${formatPeso(response.data.coupon.discount_amount)}`);
        onApplyCoupon(response.data.coupon);
        setCouponCode('');
      } else {
        setError('Invalid coupon code');
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 404) {
          setError('Invalid or expired coupon code');
        } else if (err.response.status === 400) {
          setError(err.response.data.message || 'Coupon cannot be applied');
        } else {
          setError('Error validating coupon');
        }
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCoupon = (code: string) => {
    setCouponCode(code);
    setShowAvailableCoupons(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4">
      <h3 className="font-medium text-gray-900 mb-3">Coupon Code</h3>
      
      {appliedCoupon ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md mb-2">
          <div className="flex items-center">
            <CheckCircle2 className="text-green-500 w-5 h-5 mr-2" />
            <div>
              <p className="font-medium">{appliedCoupon.code}</p>
              <p className="text-sm text-gray-600">
                {appliedCoupon.discount_type === 'percentage' 
                  ? `${appliedCoupon.discount_value}% off` 
                  : `${formatPeso(appliedCoupon.discount_value)} off`}
              </p>
            </div>
          </div>
          <button 
            onClick={onRemoveCoupon}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      ) : (
        <div>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 p-2 border border-gray-300 rounded-md"
              disabled={loading}
            />
            <button
              onClick={validateCoupon}
              disabled={loading}
              className={`px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Apply
            </button>
          </div>
          
          {error && (
            <div className="flex items-center text-red-600 text-sm mt-1">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="flex items-center text-green-600 text-sm mt-1">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              {success}
            </div>
          )}
          
          {availableCoupons.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowAvailableCoupons(!showAvailableCoupons)}
                className="text-primary-600 text-sm font-medium hover:underline"
              >
                {showAvailableCoupons ? 'Hide available coupons' : 'Show available coupons'}
              </button>
              
              {showAvailableCoupons && (
                <div className="mt-2 border border-gray-200 rounded-md overflow-hidden">
                  {availableCoupons.map((coupon) => (
                    <div 
                      key={coupon.id}
                      className="p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectCoupon(coupon.code)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{coupon.code}</p>
                          <p className="text-sm text-gray-600">
                            {coupon.discount_type === 'percentage' 
                              ? `${coupon.discount_value}% off` 
                              : `${formatPeso(coupon.discount_value)} off`}
                          </p>
                          {coupon.min_purchase_amount > 0 && (
                            <p className="text-xs text-gray-500">
                              Min. purchase: {formatPeso(coupon.min_purchase_amount)}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(coupon.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CouponForm; 