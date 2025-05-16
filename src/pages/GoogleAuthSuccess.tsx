import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showErrorAlert } from '../utils/alerts';

const GoogleAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const { handleGoogleAuthSuccess } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleGoogleAuthSuccess(token);
    } else {
      showErrorAlert('Authentication Failed', 'No authentication token received');
    }
  }, [searchParams, handleGoogleAuthSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-4">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Processing your sign in...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we complete your Google sign-in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess; 