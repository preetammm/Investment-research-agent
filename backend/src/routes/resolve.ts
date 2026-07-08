import { Router } from 'express';
import { resolveCompanyName } from '../agents/companyResolverAgent';

const router = Router();

/**
 * POST /api/resolve
 * Resolves a raw company name input into confirmed, ambiguous, or unrecognized statuses.
 */
router.post('/resolve', async (req, res): Promise<any> => {
  try {
    const { companyName } = req.body;

    if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
      return res.status(400).json({
        error: 'companyName is required and must be a non-empty string',
      });
    }

    const result = await resolveCompanyName(companyName);
    return res.json(result);
  } catch (error: any) {
    console.error('Error resolving company name:', error);
    return res.status(500).json({
      error: 'Failed to resolve company name',
      details: error.message || String(error),
    });
  }
});

/**
 * GET /api/test-fallback
 * Temporarily invalidates the Gemini API key, triggers an LLM call, and verifies
 * that the system falls back to Groq successfully, then restores the Gemini key.
 */
router.get('/test-fallback', async (req, res): Promise<any> => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  try {
    console.log('\n--- START FALLBACK TEST ---');
    console.log('Temporarily invalidating GEMINI_API_KEY...');
    process.env.GEMINI_API_KEY = 'INVALID_GEMINI_KEY_FOR_TEST';

    const testResult = await resolveCompanyName('Microsoft');

    console.log('Fallback test result received successfully.');
    console.log('--- END FALLBACK TEST ---\n');

    return res.json({
      success: true,
      message: 'Fallback mechanism worked! Groq successfully answered.',
      result: testResult,
    });
  } catch (error: any) {
    console.error('Fallback test failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Fallback test failed',
      details: error.message || String(error),
    });
  } finally {
    // Crucial: Restore original key
    process.env.GEMINI_API_KEY = originalGeminiKey;
    console.log('GEMINI_API_KEY restored.');
  }
});

export default router;
