import { Router, Request, Response } from 'express';
import { runExplainerAgent, AudienceMode } from '../agents/explainerAgent';

const router = Router();

const VALID_MODES: AudienceMode[] = ['simple', 'beginner', 'investor', 'analyst'];

/**
 * POST /api/explain
 * Rewrites the thesis narrative for a specific audience mode.
 */
router.post('/explain', async (req: Request, res: Response): Promise<any> => {
  const { companyName, thesis, dossier, mode } = req.body;

  if (!companyName || !thesis || !dossier || !mode) {
    return res.status(400).json({ error: 'companyName, thesis, dossier, and mode are required.' });
  }

  if (!VALID_MODES.includes(mode)) {
    return res.status(400).json({ error: `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}` });
  }

  try {
    console.log(`[explain]: Generating "${mode}" explanation for "${companyName}"`);
    const narrative = await runExplainerAgent(companyName, thesis, dossier, mode);
    console.log(`[explain]: Done. Returned ${narrative.length} chars.`);
    return res.json({ narrative });
  } catch (error: any) {
    console.error(`[explain]: Error:`, error);
    return res.status(500).json({ error: error.message || 'Failed to generate explanation.' });
  }
});

export default router;
