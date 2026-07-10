import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env'), override: true });

import { graph } from '../backend/src/agents/graph';

export const config = {
  maxDuration: 60, // Allow up to 60 seconds for the research pipeline
};

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

  const { companyName } = req.body;

  if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
    return res.status(400).json({ error: 'companyName is required and must be a non-empty string' });
  }

  // Set SSE response headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  console.log(`[sse]: Starting research pipeline for "${companyName}"`);

  try {
    const onStep = (event: any) => {
      console.log(`[sse]: Sending event:`, event);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const finalState = await graph.invoke(
      { companyName },
      { configurable: { onStep } }
    );

    if (finalState.error) {
      throw new Error(finalState.error);
    }

    // Send the final result event carrying the complete final state
    const finalEvent = { type: 'result', state: finalState };
    console.log(`[sse]: Sending final result for "${companyName}"`);
    res.write(`data: ${JSON.stringify(finalEvent)}\n\n`);
  } catch (error: any) {
    console.error(`[sse]: Error during research for "${companyName}":`, error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || String(error) })}\n\n`);
  } finally {
    console.log(`[sse]: Ending stream for "${companyName}"`);
    res.end();
  }
}
