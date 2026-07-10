import { CompanyDossier, BullBearCase } from './types';
import { callJSONWithRetry } from './researchTools';

const BULL_BEAR_SYSTEM = `You are a panel of two elite investment analysts debating a company's investment potential.
- Analyst 1 (The Bull) argues strongly to INVEST, highlighting opportunities, growth, moats, and strengths.
- Analyst 2 (The Bear) argues strongly to PASS or WATCH, highlighting risks, headwinds, valuation concerns, weaknesses, and key flags.

CRITICAL CONSTRAINTS:
1. Both analysts must base their arguments ONLY on the facts present in the provided Company Dossier. Do NOT introduce external facts, news, or make up statistics.
2. Every point must reference the specific dossier fact it leans on in the "basedOn" field. Keep this reference concise and clear.
3. Every point must have a severity rating of 1 to 5 (1 = minor/lowest impact, 5 = critical/highest impact).
4. For both the Bull and Bear cases, output between 3 to 5 points.
5. Sort points in BOTH the bullCase and bearCase arrays by severity in descending order.

You must return a JSON object with this exact shape:
{
  "bullCase": [
    {
      "point": "Short, punchy sentence explaining the bull argument.",
      "basedOn": "The specific dossier fact this is based on.",
      "severity": 4
    }
  ],
  "bearCase": [
    {
      "point": "Short, punchy sentence explaining the bear argument.",
      "basedOn": "The specific dossier fact this is based on.",
      "severity": 5
    }
  ]
}`;

export async function runBullBearAgent(dossier: CompanyDossier): Promise<BullBearCase> {
  // Handle empty dossier case gracefully
  if (
    dossier.dataGaps.includes('No web search results available') ||
    !dossier.summary ||
    dossier.summary.includes('No public corporate information')
  ) {
    return { bullCase: [], bearCase: [] };
  }

  const result = await callJSONWithRetry<BullBearCase>({
    system: BULL_BEAR_SYSTEM,
    user: `Here is the Company Dossier for "${dossier.companyName}":\n\n${JSON.stringify(dossier, null, 2)}`,
  });

  // Ensure sorting by severity descending
  const bullCase = Array.isArray(result.bullCase) ? result.bullCase : [];
  const bearCase = Array.isArray(result.bearCase) ? result.bearCase : [];

  bullCase.sort((a, b) => (b.severity || 0) - (a.severity || 0));
  bearCase.sort((a, b) => (b.severity || 0) - (a.severity || 0));

  return {
    bullCase,
    bearCase,
  };
}
