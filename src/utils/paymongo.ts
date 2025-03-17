import axios from 'axios';

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';
const PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY;
const PAYMONGO_SECRET_KEY = import.meta.env.VITE_PAYMONGO_SECRET_KEY;

interface PaymentMethodData {
  type: 'gcash' | 'grab_pay' | 'card';
  details?: {
    card_number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
}

interface PaymentIntentData {
  amount: number;
  currency: string;
  payment_method_allowed: string[];
  payment_method_options?: {
    card?: {
      request_three_d_secure: 'any' | 'automatic';
    };
  };
  description?: string;
  statement_descriptor?: string;
  metadata?: Record<string, any>;
}

export const createPaymentMethod = async (data: PaymentMethodData) => {
  try {
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
          Authorization: `Basic ${btoa(PAYMONGO_PUBLIC_KEY || '')}`,
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
          Authorization: `Basic ${btoa(PAYMONGO_SECRET_KEY || '')}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export const attachPaymentIntent = async (paymentIntentId: string, paymentMethodId: string) => {
  try {
    const response = await axios.post(
      `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}/attach`,
      {
        data: {
          attributes: {
            payment_method: paymentMethodId,
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(PAYMONGO_SECRET_KEY || '')}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error attaching payment intent:', error);
    throw error;
  }
};

export const createSource = async (amount: number, type: 'gcash' | 'grab_pay') => {
  try {
    const response = await axios.post(
      `${PAYMONGO_API_URL}/sources`,
      {
        data: {
          attributes: {
            amount: Math.round(amount * 100),
            currency: 'PHP',
            type,
            redirect: {
              success: `${window.location.origin}/payment/success`,
              failed: `${window.location.origin}/payment/failed`,
            },
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(PAYMONGO_PUBLIC_KEY || '')}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error creating source:', error);
    throw error;
  }
}; 