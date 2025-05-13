import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginSchema, mfaTokenSchema, type LoginFormData, type MFACredentials } from '../../types/auth';
import { UserRound } from 'lucide-react';
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts';
import api from '../../lib/api';

const LoginForm = () => {
  const { login, setUser, setIsAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showMFA, setShowMFA] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const {
    register: registerMFA,
    handleSubmit: handleSubmitMFA,
    formState: { errors: mfaErrors }
  } = useForm<MFACredentials>({
    resolver: zodResolver(mfaTokenSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      const response = await login(data);
      
      if (response.requiresMFA) {
        setEmail(data.email);
        setShowMFA(true);
      } else {
        showSuccessAlert('Success', 'Login successful');
        navigate('/shop');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      showErrorAlert('Error', 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onMFASubmit = async (data: MFACredentials) => {
    try {
      setIsSubmitting(true);
      const endpoint = useBackupCode ? '/auth/verify-backup' : '/auth/verify-mfa-login';
      
      // Ensure the token is exactly 6 digits
      const formattedToken = data.token.toString().padStart(6, '0').slice(0, 6);
      
      const requestData = {
        email,
        otp: formattedToken
      };
      
      console.log('Sending MFA verification request:', {
        ...requestData,
        email: requestData.email.slice(0, 3) + '...' // Log partial email for privacy
      });
      
      const response = await api.post(endpoint, requestData);

      if (response.data.token) {
        // Update authentication state
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setUser(response.data.user);
        setIsAuthenticated(true);

        showSuccessAlert('Success', 'Login successful');
        navigate('/shop');
      } else {
        showErrorAlert('Error', 'Invalid response from server');
      }
    } catch (error: any) {
      console.error('MFA verification error:', error);
      if (error.response?.data?.message) {
        showErrorAlert('Error', error.response.data.message);
      } else {
        showErrorAlert('Error', useBackupCode ? 'Invalid backup code' : 'Invalid MFA code');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showMFA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {useBackupCode 
                ? "Enter a backup code" 
                : "Enter the code from your authenticator app"}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmitMFA(onMFASubmit)}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="token" className="sr-only">
                  {useBackupCode ? "Backup Code" : "Authentication Code"}
                </label>
                <input
                  {...registerMFA('token')}
                  type="text"
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={useBackupCode ? "Enter backup code" : "Enter 6-digit code"}
                />
                {mfaErrors.token && (
                  <p className="mt-2 text-sm text-red-600">
                    {mfaErrors.token.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? "Verifying..." : "Verify"}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setUseBackupCode(!useBackupCode)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {useBackupCode 
                  ? "Use authenticator app instead" 
                  : "Use backup code instead"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-full">
              <UserRound className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold text-blue-600">DOSE</h1>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmitLogin(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                {...registerLogin('email')}
                type="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {loginErrors.email && (
                <p className="mt-2 text-sm text-red-600">
                  {loginErrors.email.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...registerLogin('password')}
                type="password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              {loginErrors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {loginErrors.password.message}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;