interface GoogleConfig {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope: string[];
}

const googleConfig: GoogleConfig = {
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  scope: ['profile', 'email']
};

export default googleConfig; 