# Pharmacy Management System - Technical Verification Script

## 1. Non-Angular Verification

"First, let me demonstrate that our application is built with React, not Angular."

**Open package.json**
```json
"dependencies": {
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.0",
  "react-hook-form": "^7.51.0",
  "sweetalert2": "^11.10.5"
  // No Angular dependencies
}
```

"As you can see in our package.json, we're using React 18 with supporting libraries. There are no Angular packages like @angular/core or @angular/material present."

**Open src/main.tsx**
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

"Our main.tsx file uses React's modern createRoot method to mount the application, which is specific to React 18."

**Browser Console Check**
"Let me open the browser console and type `window.ng` to check for Angular's global namespace..."
[Demonstrates console returning undefined]
"It returns undefined, confirming Angular is not present in our application."

## 2. React Framework Implementation

"Now let's look at our React implementation in more detail."

**App.tsx Structure**
```tsx
export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
```

"Our App component uses React Router for navigation and wraps the application with context providers for authentication and shopping cart state management."

**Route Configuration**
```tsx
<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<PublicRoute element={<LoginForm />} />} />
  <Route path="/register" element={<PublicRoute element={<RegisterForm />} />} />
  
  {/* Admin Routes */}
  <Route path="/admin" element={<AdminRoute element={<AdminDashboard />} />} />
  <Route path="/admin/medicines" element={<AdminRoute element={<MedicineList />} />} />
  <Route path="/admin/prescriptions" element={<AdminRoute element={<PrescriptionManagement />} />} />
  
  {/* User Routes */}
  <Route path="/shop" element={<UserRoute element={<Shop />} />} />
  <Route path="/cart" element={<UserRoute element={<Cart />} />} />
  <Route path="/prescriptions" element={<UserRoute element={<Prescriptions />} />} />
</Routes>
```

"Our routing is organized with proper route guards to control access based on authentication status and user roles."

## 3. Form Validation with React Hook Form and SweetAlert2

"We use React Hook Form with Zod for robust form validation and SweetAlert2 for user-friendly notifications. Here's our updated login form implementation:"

**LoginForm.tsx**
```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginSchema, type LoginFormData } from '../../types/auth';
import { showError } from '../../utils/alerts';
import FormErrors from '../common/FormErrors';

const LoginForm = () => {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (error) {
      console.error('Login failed:', error);
      showError('Authentication Failed', 'Please check your credentials and try again.');
    }
  };
  
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="text-center mb-4">Login</h2>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    id="email"
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    {...register('email')}
                  />
                  <FormErrors errors={errors.email} />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    id="password"
                    type="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    {...register('password')}
                  />
                  <FormErrors errors={errors.password} />
                </div>
                
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Logging in...' : 'Login'}
                  </button>
                </div>
              </form>
              
              <div className="mt-3 text-center">
                <p>Don't have an account? <Link to="/register">Register</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Alert Utilities (utils/alerts.ts)**
```tsx
import Swal from 'sweetalert2';

export const showSuccess = (title: string, message: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    confirmButtonColor: '#4CAF50',
  });
};

export const showError = (title: string, message: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonColor: '#F44336',
  });
};

export const showWarning = (title: string, message: string) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
    confirmButtonColor: '#FF9800',
  });
};

export const showConfirm = (title: string, message: string) => {
  return Swal.fire({
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
  });
};
```

**FormErrors Component (components/common/FormErrors.tsx)**
```tsx
import React from 'react';
import { FieldError } from 'react-hook-form';

interface FormErrorsProps {
  errors: FieldError | undefined;
}

const FormErrors: React.FC<FormErrorsProps> = ({ errors }) => {
  if (!errors) return null;
  
  return (
    <div className="invalid-feedback d-block">
      {errors.message}
    </div>
  );
};

export default FormErrors;
```

**Validation Schema (auth.ts)**
```tsx
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
```

"This demonstrates our enhanced form validation using Zod schemas with React Hook Form and SweetAlert2 for user-friendly notifications."

## 4. Authentication Context

"Our application uses a React context for authentication management:"

**AuthContext.tsx**
```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User, AuthResponse, LoginCredentials, RegisterData } from '../types';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { showSuccess } from '../utils/alerts';

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

  // Login implementation
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setIsAuthenticated(true);
      
      showSuccess('Login Successful', `Welcome back, ${user.email}!`);
      
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/shop', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed');
    }
  };
```

"This context provides authentication state and methods throughout our application, now with enhanced feedback using SweetAlert2."

## 5. API Integration

"Let's examine our API architecture:"

**API Client Configuration (api.ts)**
```tsx
import axios from 'axios';
import { showError } from '../utils/alerts';

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
      showError('Session Expired', 'Your session has expired. Please log in again.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**API Server Implementation (server.ts)**
```typescript
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { testConnection, pool } from '../config/database';
import { query, execute, withTransaction, queryPaginated } from '../utils/db';
import CONFIG from '../config/config';

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, CONFIG.JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user from database
    const users = await query(
      'SELECT id, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});
```
"These code examples demonstrate our Express backend with JWT authentication and our frontend API client with Axios, now with improved error handling using SweetAlert2."

## 6. Summary

"To conclude, I've demonstrated that our Pharmacy Management System is:

1. Built with React, not Angular, as shown in package.json, main.tsx, and browser verification
2. Implements React routing and context for state management
3. Uses React Hook Form with Zod for form validation
4. Integrates SweetAlert2 for improved user experience and feedback
5. Has proper authentication flows with JWT
6. Features a well-structured Express backend API
7. Includes comprehensive error handling at frontend and backend levels with user-friendly notifications

Our system successfully meets all the technical requirements and demonstrates proper implementation of modern web development practices with React and Express." 