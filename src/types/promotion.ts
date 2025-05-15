export interface Promotion {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  banner_url: string | null;
  promotion_type: 'general' | 'flash_sale' | 'seasonal' | 'product_specific' | 'category_specific';
  start_date: string;
  end_date: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  is_featured: boolean;
  is_active: boolean;
  applicable_products: number[] | null; // Array of product IDs
  terms_conditions: TermsConditions | null;
  created_at: string;
  updated_at: string;
}

export interface TermsConditions {
  minimum_purchase?: number;
  maximum_discount?: number;
  usage_limit?: number;
  user_type?: 'all' | 'new' | 'existing';
  payment_method?: string[];
  shipping_method?: string[];
  excluded_products?: number[];
  additional_terms?: string[];
}

export interface PromotionFormData {
  title: string;
  description: string;
  image_url?: string;
  banner_url?: string;
  promotion_type: 'general' | 'flash_sale' | 'seasonal' | 'product_specific' | 'category_specific';
  start_date: string;
  end_date: string;
  discount_percentage?: number;
  discount_amount?: number;
  is_featured: boolean;
  is_active: boolean;
  applicable_products?: number[];
  terms_conditions?: Partial<TermsConditions>;
} 