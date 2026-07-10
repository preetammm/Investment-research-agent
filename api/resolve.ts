import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env'), override: true });

import { resolveCompanyName } from '../backend/src/agents/companyResolverAgent';

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
    const { companyName } = req.body;

    if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
      return res.status(400).json({
        error: 'companyName is required and must be a non-empty string',
      });
    }

    const result = await resolveCompanyName(companyName);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error resolving company name:', error);
    return res.status(500).json({
      error: 'Failed to resolve company name',
      details: error.message || String(error),
    });
  }
}
