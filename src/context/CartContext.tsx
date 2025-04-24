import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

interface CartContextType {
  cartCount: number;
  updateCartCount: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCartCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCartCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/cart');
      const items = response.data;
      setCartCount(items.length);
    } catch (error) {
      console.error('Error fetching cart count:', error);
      
      // Handle specific error types
      if (error.response) {
        if (error.response.status === 401) {
          // Handle unauthorized - likely token expired
          localStorage.removeItem('token'); // Clear invalid token
          setCartCount(0);
        }
      } else {
        setError('Could not retrieve cart information');
      }
      
      setCartCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      updateCartCount();
    }
    
    // Listen for storage events to handle token changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue) {
          updateCartCount();
        } else {
          setCartCount(0);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, updateCartCount, isLoading, error }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 