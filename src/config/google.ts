interface GoogleConfig {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope: string[];
}

const googleConfig: GoogleConfig = {
  clientID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  callbackURL: import.meta.env.VITE_GOOGLE_CALLBACK_URL || 'http://localhost:5173/api/auth/google/callback',
  scope: ['profile', 'email']
};

export default googleConfig; 