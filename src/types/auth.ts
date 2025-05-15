import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const mfaTokenSchema = z.object({
  token: z.string().length(6, 'Code must be exactly 6 digits').regex(/^\d+$/, 'Code must contain only numbers')
});

export const backupCodeSchema = z.object({
  code: z.string().length(8, 'Backup code must be 8 characters')
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type MFACredentials = z.infer<typeof mfaTokenSchema>;
export type BackupCodeCredentials = z.infer<typeof backupCodeSchema>;

export interface LoginResponse {
  token?: string;
  requiresMFA?: boolean;
  email?: string;
  message?: string;
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
  requiresMFA?: boolean;
}

export interface MFASetupResponse {
  secret: string;
  qrCode: string;
}

export interface MFAEnableResponse {
  message: string;
  backupCodes: string[];
}

export interface MFAStatus {
  isEnabled: boolean;
}

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>; 