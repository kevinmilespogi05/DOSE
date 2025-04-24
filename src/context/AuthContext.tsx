import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User, AuthResponse, LoginCredentials, RegisterData } from '../types';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
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
          const response = await api.get('/user/profile', {
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

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { token, user } = response.data;
      
      // Set token and update axios defaults
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Update state sequentially
      setUser(user);
      setIsAuthenticated(true);
      
      // Use setTimeout to ensure state updates have propagated
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/shop', { replace: true });
        }
      }, 100);
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed');
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
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated, isAdmin }}>
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