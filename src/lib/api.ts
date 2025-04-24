import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 and 403 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
    const response = await api.post('/auth/login', data);
    localStorage.setItem('token', response.data.token);
    return response.data;
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