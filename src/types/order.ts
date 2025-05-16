export type OrderStatus = 
  | 'pending_payment'
  | 'payment_submitted'
  | 'payment_approved'
  | 'processing'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  medicine_id: number;
  medicine_name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  user_id: number;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
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