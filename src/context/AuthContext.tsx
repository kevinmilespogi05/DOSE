import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User, AuthResponse, LoginCredentials, RegisterData } from '../types';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { showErrorAlert } from '../utils/alerts';
import { LoginFormData, LoginResponse } from '../types/auth';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  login: (credentials: LoginFormData) => Promise<LoginResponse>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  handleGoogleAuthSuccess: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to check if token is expired
  const isTokenExpired = (token: string) => {
    try {
      const decoded = jwtDecode(token) as any;
      const currentTime = Date.now() / 1000;
      
      if (!decoded.exp) return true; // No expiration means risky, treat as expired
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true; // If we can't decode, assume it's expired
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      setLoading(true);
      
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log('Token is expired, logging out');
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      try {
        // Decode token to get user info
        const decoded = jwtDecode(token) as { userId: number; role: string };
        console.log('Token decoded successfully, role:', decoded.role);

        // Verify token by fetching user profile
        const response = await api.get('/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const userData = {
          ...response.data,
          role: decoded.role // Always use role from token
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('User authenticated successfully as', userData.role);
      } catch (error) {
        // If token is invalid, clear it
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        showErrorAlert('Session Expired', 'Please log in again');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleUnload = () => {
      // Don't remove token on page refresh/close
      // Only remove sensitive data if needed
    };

    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const login = async (credentials: LoginFormData): Promise<LoginResponse> => {
    try {
      console.log('Login attempt with credentials:', { 
        email: credentials.email.substring(0, 3) + '...' // Only log part of email for privacy
      });
      
      // Ensure we're using the correct API endpoint
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      console.log('Login response:', JSON.stringify({
        status: response.status,
        hasToken: !!response.data.token,
        hasUser: !!response.data.user,
        userRole: response.data.user?.role
      }));
      
      if (response.data.requiresMFA) {
        return response.data;
      }

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Get user data from response
        const userData = response.data.user;
        if (!userData) {
          throw new Error('No user data in response');
        }
        
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('User authenticated successfully as', userData.role);
      } else {
        console.error('No token in login response:', response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.status, error.response?.data);
      
      if (error.response?.status === 401) {
        // Clear any existing token on auth failure
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      }
      
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      const { token, user } = response.data;
      
      // Set token and update axios defaults
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Update state sequentially
      setUser(user);
      setIsAuthenticated(true);
      
      // Use setTimeout to ensure state updates have propagated
      setTimeout(() => {
        navigate('/shop', { replace: true });
      }, 100);
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. This email may already be in use.';
      showErrorAlert('Registration Error', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleGoogleAuthSuccess = async (token: string) => {
    try {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Decode token to get user info
      const decoded = jwtDecode(token) as { userId: number; role: string };
      
      // Fetch user profile
      const response = await api.get('/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const userData = {
        ...response.data,
        role: decoded.role
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Navigate based on user role
      navigate(decoded.role === 'admin' ? '/admin' : '/shop');
    } catch (error) {
      console.error('Google auth error:', error);
      showErrorAlert('Authentication Failed', 'Failed to process Google sign-in');
    }
  };

  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    setUser,
    setIsAuthenticated,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    handleGoogleAuthSuccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;