import axios from 'axios';
import { CLIENT_CONFIG } from '../config/client-config';

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';
const PAYMONGO_PUBLIC_KEY = CLIENT_CONFIG.PAYMONGO.PUBLIC_KEY;
const PAYMONGO_SECRET_KEY = CLIENT_CONFIG.PAYMONGO.SECRET_KEY;

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

export const createPaymentMethod = async (data: PaymentMethodData) => {
  try {
    if (!PAYMONGO_PUBLIC_KEY) {
      throw new Error('PayMongo public key is not configured');
    }

    const response = await axios.post(
      `${PAYMONGO_API_URL}/payment_methods`,
      {
        data: {
          attributes: {
            type: data.type,
            details: data.details,
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(PAYMONGO_PUBLIC_KEY)}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error creating payment method:', error);
    throw error;
  }
};

export const createPaymentIntent = async (data: PaymentIntentData) => {
  try {
    if (!PAYMONGO_SECRET_KEY) {
      throw new Error('PayMongo secret key is not configured');
    }

    const response = await axios.post(
      `${PAYMONGO_API_URL}/payment_intents`,
      {
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
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(PAYMONGO_SECRET_KEY)}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export const createSource = async (amount: number, type: 'gcash' | 'grab_pay') => {
  try {
    if (!PAYMONGO_PUBLIC_KEY) {
      throw new Error('PayMongo public key is not configured');
    }

    if (!CLIENT_CONFIG.PAYMONGO.FRONTEND_URL) {
      throw new Error('Frontend URL is not configured');
    }

    const response = await axios.post(
      `${PAYMONGO_API_URL}/sources`,
      {
        data: {
          attributes: {
            amount: Math.round(amount * 100),
            currency: 'PHP',
            type,
            redirect: {
              success: `${CLIENT_CONFIG.PAYMONGO.FRONTEND_URL}/payment/success`,
              failed: `${CLIENT_CONFIG.PAYMONGO.FRONTEND_URL}/payment/failed`,
            },
            billing: {
              name: 'Pharmacy Customer',
              email: 'customer@example.com',
            },
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(PAYMONGO_PUBLIC_KEY)}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error creating source:', error);
    throw error;
  }
};

export const verifyPayment = async (sourceId: string) => {
  try {
    if (!PAYMONGO_SECRET_KEY) {
      throw new Error('PayMongo secret key is not configured');
    }

    const response = await axios.get(
      `${PAYMONGO_API_URL}/sources/${sourceId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(PAYMONGO_SECRET_KEY)}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
}; 