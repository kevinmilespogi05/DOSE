import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Function to check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    if (!decoded.exp) return true; // No expiration means risky, treat as expired
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // If we can't decode, assume it's expired
  }
};

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    // Check if token is expired
    if (isTokenExpired(token)) {
      console.log('Token expired, removing from storage');
      localStorage.removeItem('token');
      // Redirect to login if token is expired
      window.location.href = '/login';
      return config;
    }
    
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 and 403 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip automatic redirection for payment API calls
    const isPaymentApiCall = error.config?.url?.includes('/payments/');
    
    if ((error.response?.status === 401 || error.response?.status === 403) && !isPaymentApiCall) {
      console.log('Unauthorized response, clearing token');
      localStorage.removeItem('token');
      
      // Only redirect to login if not already on login page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/payment')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  register: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post('/auth/register', data);
    localStorage.setItem('token', response.data.token);
    return response.data;
  },
  
  login: async (data: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', data);
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
  }
};

export const cars = {
  list: () => api.get('/cars'),
  create: (data: any) => api.post('/cars', data),
  get: (id: number) => api.get(`/cars/${id}`),
  update: (id: number, data: any) => api.put(`/cars/${id}`, data),
  delete: (id: number) => api.delete(`/cars/${id}`)
};

export const bookings = {
  create: (data: any) => api.post('/bookings', data),
  list: () => api.get('/bookings'),
  get: (id: number) => api.get(`/bookings/${id}`),
  update: (id: number, data: any) => api.put(`/bookings/${id}`, data),
  cancel: (id: number) => api.post(`/bookings/${id}/cancel`)
};

export default api;