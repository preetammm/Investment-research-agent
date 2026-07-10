import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env'), override: true });

import { runExplainerAgent, AudienceMode } from '../backend/src/agents/explainerAgent';

const VALID_MODES: AudienceMode[] = ['simple', 'beginner', 'investor', 'analyst'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companyName, thesis, dossier, mode } = req.body;

    if (!companyName || !thesis || !dossier || !mode) {
      return res.status(400).json({ error: 'companyName, thesis, dossier, and mode are required.' });
    }

    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({ error: `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}` });
    }

    console.log(`[explain]: Generating "${mode}" explanation for "${companyName}"`);
    const narrative = await runExplainerAgent(companyName, thesis, dossier, mode);
    console.log(`[explain]: Done. Returned ${narrative.length} chars.`);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ narrative });
  } catch (error: any) {
    console.error(`[explain]: Error:`, error);
    return res.status(500).json({ error: error.message || 'Failed to generate explanation.' });
  }
}
