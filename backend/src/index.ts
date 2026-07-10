import dotenv from 'dotenv';
// Load environment variables at the very top of the entry point
// override: true ensures .env values take priority over system env vars
dotenv.config({ override: true });

import express from 'express';
import cors from 'cors';
import resolveRouter from './routes/resolve';
import researchRouter from './routes/research';
import explainRouter from './routes/explain';
import followupRouter from './routes/followup';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for Vite frontend (dynamic origin for local dev and Vercel production)
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter((url): url is string => Boolean(url))
 .map(url => url.replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    console.log(`[CORS] Origin: "${origin}" | Allowed: ${JSON.stringify(allowedOrigins)}`);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: Origin "${origin}" not in allowed list ${JSON.stringify(allowedOrigins)}`));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));

// Register API Routes
app.use('/api', resolveRouter);
app.use('/api', researchRouter);
app.use('/api', explainRouter);
app.use('/api', followupRouter);

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

