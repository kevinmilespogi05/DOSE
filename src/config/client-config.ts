export const CLIENT_CONFIG = {
  PAYMONGO: {
    PUBLIC_KEY: import.meta.env.VITE_PAYMONGO_PUBLIC_KEY,
    SECRET_KEY: import.meta.env.VITE_PAYMONGO_SECRET_KEY,
    FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'
  }
}; 