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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token by fetching user profile
          const response = await api.get('/users/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          setUser(response.data);
          setIsAuthenticated(true);
          
          // Redirect based on role
          if (response.data.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/shop');
          }
        } catch (error) {
          // If token is invalid, clear it
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
          navigate('/login');
          showErrorAlert('Session Expired', 'Please log in again');
        }
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
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      
      if (response.data.requiresMFA) {
        return response.data;
      }

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setUser(response.data.user);
        setIsAuthenticated(true);
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
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

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser,
      setIsAuthenticated,
      login, 
      register, 
      logout, 
      isAuthenticated, 
      isAdmin 
    }}>
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