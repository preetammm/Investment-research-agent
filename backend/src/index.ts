import dotenv from 'dotenv';
// Load environment variables at the very top of the entry point
// override: true ensures .env values take priority over system env vars
dotenv.config({ override: true });

import express from 'express';
import cors from 'cors';
import resolveRouter from './routes/resolve';
import researchRouter from './routes/research';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for Vite frontend (dynamic origin for local dev and Vercel production)
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., Postman, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production since Vercel handles same-origin
    }
  },
  credentials: true
}));

app.use(express.json());

// Register Resolve and Research API Routes
app.use('/api', resolveRouter);
app.use('/api', researchRouter);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
  
  // Environment verification check
  const requiredEnvVars = ['GEMINI_API_KEY', 'GROQ_API_KEY', 'TAVILY_API_KEY'];
  console.log('\n--- Environment Verification Check ---');
  requiredEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      console.log(`✓ ${varName} loaded`);
    } else {
      console.log(`✗ ${varName} missing`);
    }
  });
  console.log('-------------------------------------\n');
});

