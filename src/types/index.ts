export interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  price: number;
  stock: number;
  expiryDate: string;
  category: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
}

export interface Sale {
  id: string;
  medicineId: string;
  quantity: number;
  totalAmount: number;
  date: string;
  customerName: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
}

export interface ProductFilters {
  search: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  sortBy: 'price_asc' | 'price_desc' | 'rating' | 'name';
}

export type Category = {
  id: string;
  name: string;
  count: number;
};