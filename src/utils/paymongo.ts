import axios from 'axios';
import { CLIENT_CONFIG } from '../config/client-config';

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';
const PAYMONGO_PUBLIC_KEY = CLIENT_CONFIG.PAYMONGO?.PUBLIC_KEY;
const PAYMONGO_SECRET_KEY = CLIENT_CONFIG.PAYMONGO?.SECRET_KEY;
const FRONTEND_URL = CLIENT_CONFIG.PAYMONGO?.FRONTEND_URL;

// Check if PayMongo is configured
const isPayMongoConfigured = Boolean(PAYMONGO_PUBLIC_KEY && PAYMONGO_SECRET_KEY && FRONTEND_URL);

interface PaymentMethodData {
  type: 'gcash' | 'grab_pay';
  details: {
    phone?: string;
    email?: string;
  };
}

interface PaymentIntentData {
  amount: number;
  payment_method_allowed: string[];
  payment_method_options?: {
    card?: {
      request_three_d_secure: 'any' | 'automatic';
    };
  };
  currency?: string;
  description?: string;
  statement_descriptor?: string;
  metadata?: Record<string, any>;
}

// Helper function to create base64 encoded authorization header
const createAuthHeader = (key: string) => {
  return btoa(key + ':');
};

// Create axios instance for PayMongo API
const paymongoApi = axios.create({
  baseURL: PAYMONGO_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add authorization header
paymongoApi.interceptors.request.use((config) => {
  // Use public key for sources and payment methods, secret key for everything else
  const isPublicEndpoint = config.url?.includes('/sources') || config.url?.includes('/payment_methods');
  const key = isPublicEndpoint ? PAYMONGO_PUBLIC_KEY : PAYMONGO_SECRET_KEY;
  
  if (key) {
    config.headers.Authorization = `Basic ${createAuthHeader(key)}`;
  }
  
  return config;
});

export const createPaymentMethod = async (data: PaymentMethodData) => {
  try {
    if (!PAYMONGO_PUBLIC_KEY) {
      const error = new Error('PayMongo public key is not configured');
      console.error(error.message);
      throw error;
    }

    const response = await paymongoApi.post('/payment_methods', {
      data: {
        attributes: {
          type: data.type,
          details: data.details,
        },
      }
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error creating payment method:', error.response?.data || error);
    throw error;
  }
};

export const createPaymentIntent = async (data: PaymentIntentData) => {
  try {
    if (!PAYMONGO_SECRET_KEY) {
      const error = new Error('PayMongo secret key is not configured');
      console.error(error.message);
      throw error;
    }

    const response = await paymongoApi.post('/payment_intents', {
      data: {
        attributes: {
          amount: Math.round(data.amount * 100), // Convert to smallest currency unit (centavos)
          payment_method_allowed: data.payment_method_allowed,
          payment_method_options: data.payment_method_options,
          currency: 'PHP',
          description: data.description,
          statement_descriptor: data.statement_descriptor,
          metadata: data.metadata,
        },
      }
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error creating payment intent:', error.response?.data || error);
    throw error;
  }
};

export const createSource = async (amount: number, type: 'gcash' | 'grab_pay') => {
  try {
    if (!PAYMONGO_PUBLIC_KEY) {
      const error = new Error('PayMongo public key is not configured');
      console.error(error.message);
      throw error;
    }

    if (!FRONTEND_URL) {
      const error = new Error('Frontend URL is not configured');
      console.error(error.message);
      throw error;
    }

    console.log('Creating source with:', {
      originalAmount: amount,
      convertedAmount: Math.round(amount * 100),
      type,
      publicKey: PAYMONGO_PUBLIC_KEY ? 'Set' : 'Not Set',
      frontendUrl: FRONTEND_URL
    });

    // PayMongo expects amount in centavos (smallest currency unit)
    // For example: PHP 100.00 should be sent as 10000
    const amountInCentavos = Math.round(amount * 100);

    const response = await paymongoApi.post('/sources', {
      data: {
        attributes: {
          amount: amountInCentavos,
          currency: 'PHP',
          type,
          redirect: {
            success: `${FRONTEND_URL}/payment/success`,
            failed: `${FRONTEND_URL}/payment/failed`,
          },
          billing: {
            name: 'Pharmacy Customer',
            email: 'customer@example.com',
          },
        },
      }
    });
    
    console.log('Source created successfully:', {
      sourceId: response.data.data.id,
      amount: amount,
      amountInCentavos: amountInCentavos
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error creating source:', error.response?.data || error.message);
    throw error;
  }
};

export const verifyPayment = async (sourceId: string) => {
  try {
    if (!PAYMONGO_SECRET_KEY) {
      const error = new Error('PayMongo secret key is not configured');
      console.error(error.message);
      throw error;
    }

    const response = await paymongoApi.get(`/sources/${sourceId}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error verifying payment:', error.response?.data || error);
    throw error;
  }
};

// Export config status to allow components to check if PayMongo is configured
export const payMongoStatus = {
  isConfigured: isPayMongoConfigured
}; 