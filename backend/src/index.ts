import dotenv from 'dotenv';
// Load environment variables at the very top of the entry point
dotenv.config();

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for Vite frontend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

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

