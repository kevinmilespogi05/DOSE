import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    NAME: process.env.DB_NAME || 'project_db',
  }
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    if (CONFIG.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${envVar}`);
    } else {
      console.warn(`Warning: Missing environment variable ${envVar}`);
    }
  }
});

export default CONFIG;