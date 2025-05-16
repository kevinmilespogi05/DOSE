import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import CONFIG from '../config/config';

interface GoogleSignInButtonProps {
  className?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ className = '' }) => {
  const handleGoogleSignIn = () => {
    window.location.href = `${CONFIG.API_URL}/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className={`flex items-center justify-center gap-2 w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
    >
      <FcGoogle className="w-5 h-5" />
      <span>Sign in with Google</span>
    </button>
  );
};

export default GoogleSignInButton; 