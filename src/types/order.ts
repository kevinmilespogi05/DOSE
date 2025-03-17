export interface OrderItem {
  medicine_id: string;
  quantity: number;
  price_per_unit: number;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
  items?: OrderItem[];
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  reference_number: string;
  payment_proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
  user?: {
    id: string;
    name: string;
    email: string;
  };
} 