import dotenv from 'dotenv';

// Only load .env file in Node.js environment
if (typeof process !== 'undefined') {
  dotenv.config();
}

const CONFIG = {
  JWT_SECRET: process?.env?.JWT_SECRET || 'your_jwt_secret_here',
  NODE_ENV: process?.env?.NODE_ENV || 'development',
  PORT: process?.env?.PORT || 3000,
  DB: {
    HOST: process?.env?.DB_HOST || 'localhost',
    USER: process?.env?.DB_USER || 'root',
    PASSWORD: process?.env?.DB_PASSWORD || '',
    NAME: process?.env?.DB_NAME || 'project_db',
  },
  PAYMONGO: {
    PUBLIC_KEY: process.env.PAYMONGO_PUBLIC_KEY || process.env.VITE_PAYMONGO_PUBLIC_KEY,
    SECRET_KEY: process.env.PAYMONGO_SECRET_KEY || process.env.VITE_PAYMONGO_SECRET_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
  }
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