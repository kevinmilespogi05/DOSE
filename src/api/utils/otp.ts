import crypto from 'crypto';

export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let OTP = '';
  
  for (let i = 0; i < length; i++) {
    OTP += digits[crypto.randomInt(0, 10)];
  }
  
  return OTP;
};

export const generateMFASecret = (): string => {
  return crypto.randomBytes(20).toString('hex');
};

export const verifyOTP = (storedOTP: string, providedOTP: string): boolean => {
  return storedOTP === providedOTP;
}; 