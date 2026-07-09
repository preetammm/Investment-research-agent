import { Router, Request, Response } from 'express';
import { runResearchTools } from '../agents/researchTools';

const router = Router();

/**
 * POST /api/research
 * Streams the progress of company research via Server-Sent Events (SSE).
 */
router.post('/research', async (req: Request, res: Response): Promise<any> => {
  const { companyName } = req.body;

  if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
    return res.status(400).json({ error: 'companyName is required and must be a non-empty string' });
  }

  // Set SSE response headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Flush headers if the compression middleware or custom setting is present
  res.flushHeaders();

  console.log(`[sse]: Starting research pipeline for "${companyName}"`);

  try {
    const dossier = await runResearchTools(companyName, (event) => {
      console.log(`[sse]: Sending event:`, event);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    // Send the final result event
    const finalEvent = { type: 'result', dossier };
    console.log(`[sse]: Sending final result for "${companyName}"`);
    res.write(`data: ${JSON.stringify(finalEvent)}\n\n`);
  } catch (error: any) {
    console.error(`[sse]: Error during research for "${companyName}":`, error);
    // Send error event
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || String(error) })}\n\n`);
  } finally {
    console.log(`[sse]: Ending stream for "${companyName}"`);
    res.end();
  }
});

export default router;
