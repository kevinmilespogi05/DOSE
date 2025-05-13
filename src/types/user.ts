import { z } from 'zod';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  bio: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  created_at: string;
  updated_at: string;
}

export const userProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50).optional(),
  last_name: z.string().min(1, 'Last name is required').max(50).optional(),
  phone_number: z.string().regex(/^\+?[\d\s-]{8,20}$/, 'Invalid phone number format').optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional()
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>; 