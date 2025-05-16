import React from 'react';
import { Link } from 'react-router-dom';

const GoogleAuthError = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-4">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Failed
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We couldn't complete your Google sign-in. Please try again.
          </p>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthError; 