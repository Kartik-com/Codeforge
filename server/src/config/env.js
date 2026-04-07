import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'codeforge-default-secret',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Piston: Use a self-hosted instance URL, or leave as empty to skip Piston
  // Public emkc.org API was restricted in Feb 2026.
  // Self-host: https://github.com/engineer-man/piston
  pistonApiUrl: process.env.PISTON_API_URL || '',

  // Judge0 (RapidAPI) - optional fallback
  judge0ApiUrl: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
  judge0ApiKey: process.env.JUDGE0_API_KEY || process.env.RAPIDAPI_KEY || '',
  judge0Host: process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com',
};
