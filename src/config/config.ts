import dotenv from 'dotenv';

// Only load .env file in Node.js environment
if (typeof process !== 'undefined') {
  dotenv.config();
}

// Helper function to get environment variables that works in both client and server
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Check Node.js environment first
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key] as string;
  }
  
  // Check Vite environment variables
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteKey = `VITE_${key}`;
    if (import.meta.env[viteKey]) {
      return import.meta.env[viteKey];
    }
  }
  
  return defaultValue;
};

const CONFIG = {
  JWT_SECRET: getEnvVar('JWT_SECRET', 'your_jwt_secret_here'),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: getEnvVar('PORT', '3000'),
  DB: {
    HOST: getEnvVar('DB_HOST', 'localhost'),
    USER: getEnvVar('DB_USER', 'root'),
    PASSWORD: getEnvVar('DB_PASSWORD', ''),
    NAME: getEnvVar('DB_NAME', 'project_db'),
  },
  PAYMONGO: {
    PUBLIC_KEY: getEnvVar('PAYMONGO_PUBLIC_KEY'),
    SECRET_KEY: getEnvVar('PAYMONGO_SECRET_KEY'),
    FRONTEND_URL: getEnvVar('FRONTEND_URL', 'http://localhost:5173')
  },
  API_URL: getEnvVar('API_URL', 'http://localhost:3000'),
  FRONTEND_URL: getEnvVar('FRONTEND_URL', 'http://localhost:5173')
};

// Only validate environment variables in Node.js environment
if (typeof process !== 'undefined') {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME'
  ];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      if (CONFIG.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variable: ${envVar}`);
      } else {
        console.warn(`Warning: Missing environment variable ${envVar}`);
      }
    }
  });
}

export default CONFIG;