import { Router, Request, Response } from 'express';
import { callChat, ChatMessage } from '../lib/llm';

const router = Router();

const FOLLOWUP_SYSTEM = `You are a senior investment research analyst engaged in a follow-up conversation about a company that was just analyzed.

You have access to the full research state provided below. Answer the user's question using ONLY the information in this research state and the conversation history so far. If the user's question references something from an earlier turn, use that context.

If the research does not cover a topic the user asks about, say so plainly — do NOT guess or invent facts. Be concise, professional, and helpful. Use 2-5 sentences unless the question requires more detail.`;

/**
 * POST /api/followup
 * Multi-turn follow-up chat grounded in the research state.
 */
router.post('/followup', async (req: Request, res: Response): Promise<any> => {
  const { question, researchState, history } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'question is required and must be a non-empty string.' });
  }

  if (!researchState) {
    return res.status(400).json({ error: 'researchState is required.' });
  }

  try {
    // Build system prompt with embedded research context
    const system = `${FOLLOWUP_SYSTEM}

RESEARCH STATE:
${JSON.stringify(researchState, null, 2)}`;

    // Take last 6 messages of prior history to stay within context limits
    const priorHistory: ChatMessage[] = Array.isArray(history)
      ? history.slice(-6)
      : [];

    // Append the new user question
    const fullHistory: ChatMessage[] = [
      ...priorHistory,
      { role: 'user', content: question },
    ];

    console.log(`[followup]: Question: "${question.slice(0, 80)}..." | History turns: ${priorHistory.length}`);
    const answer = await callChat({ system, history: fullHistory });
    console.log(`[followup]: Answer generated (${answer.length} chars)`);

    return res.json({ answer });
  } catch (error: any) {
    console.error(`[followup]: Error:`, error);
    return res.status(500).json({ error: error.message || 'Failed to generate follow-up answer.' });
  }
});

export default router;
