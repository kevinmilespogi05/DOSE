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
const isTokenExpired = (token: string) => {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    const currentTime = Date.now() / 1000;
    
    if (!decoded.exp) return true; // No expiration means risky, treat as expired
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // If we can't decode, assume it's expired
  }
};

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      if (isTokenExpired(token)) {
        // Remove expired token
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(new Error('Token expired'));
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an expired token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear the token and redirect to login
      localStorage.removeItem('token');
      window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
      
      return Promise.reject(error);
    }

    // Handle other errors
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
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