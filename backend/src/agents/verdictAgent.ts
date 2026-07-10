import {
  CompanyDossier,
  BullBearCase,
  ScoreCard,
  RiskItem,
  SwotAnalysis,
  Recommendation,
  InvestmentThesis,
} from './types';
import { callJSONWithRetry } from './researchTools';
import { stripDossierForLLM } from '../lib/llm';

const VERDICT_SYSTEM = `You are the Investment Committee Chair at an elite venture capital and private equity firm.
Your task is to synthesize the Company Dossier and the Bull/Bear debate into a final, definitive investment thesis.

You must score the company across 5 core dimensions on a scale of 1 to 10 (where 10 is best, except for riskLevel where 10 is the riskiest/worst):
1. marketOpportunity: Size, growth rate, and demand dynamics of the target market.
2. financialHealth: Revenue scale, growth, unit economics, and funding history.
3. executionTeam: Founder quality, leadership experience, and execution history.
4. competitiveMoat: Barriers to entry, IP, network effects, and switching costs.
5. riskLevel: General risk profile (1 = safest, 10 = riskiest). Fold valuation concerns and macroeconomic sentiment directly into this score.

You must return a JSON object with this exact shape:
{
  "scores": {
    "marketOpportunity": 8, // 1 to 10
    "financialHealth": 7, // 1 to 10
    "executionTeam": 9, // 1 to 10
    "competitiveMoat": 8, // 1 to 10
    "riskLevel": 4 // 1 to 10 (10 is riskiest)
  },
  "risks": [
    {
      "category": "Competition" | "Regulation" | "Debt" | "Innovation" | "Market Conditions", // Must be exactly one of these strings
      "severity": "low" | "medium" | "high",
      "detail": "Specific detail about the risk."
    }
  ],
  "swot": {
    "strengths": ["Strength A", "Strength B"],
    "weaknesses": ["Weakness A", "Weakness B"],
    "opportunities": ["Opportunity A", "Opportunity B"],
    "threats": ["Threat A", "Threat B"]
  },
  "keyReasons": [
    "3-4 short, punchy investment justification phrases."
  ],
  "majorRisks": [
    "2-3 short, punchy risk factor phrases."
  ],
  "oneLineSummary": "A concise investment thesis summary. MUST be 22 words or fewer.",
  "biggestOpportunity": "One specific, complete sentence highlighting the single biggest opportunity.",
  "biggestRisk": "One specific, complete sentence highlighting the single biggest risk.",
  "narrative": "A 3-4 paragraph flowing corporate analyst-voice write-up. MUST be output as a standard JSON string value with raw newlines escaped as '\\n\\n'. Do NOT output literal unescaped newlines or unescaped double quotes within this string.
  RULES FOR NARRATIVE CONTENT:
  - Do NOT use bullet points or lists.
  - Do NOT write headers, titles, subheadings, or bolded labels (e.g. 'Strengths:', 'Market:', etc.).
  - Write in natural, professional, flowing paragraphs.
  - Use a balanced, sober, expert tone.
  - Reach a clear conclusion that is logically consistent with the scores."
}`;

export interface RawVerdictResponse {
  scores: ScoreCard;
  risks: RiskItem[];
  swot: SwotAnalysis;
  keyReasons: string[];
  majorRisks: string[];
  oneLineSummary: string;
  biggestOpportunity: string;
  biggestRisk: string;
  narrative: string;
}

export async function runVerdictAgent(
  dossier: CompanyDossier,
  debate: BullBearCase
): Promise<{
  scores: ScoreCard;
  risks: RiskItem[];
  swot: SwotAnalysis;
  keyReasons: string[];
  majorRisks: string[];
  oneLineSummary: string;
  biggestOpportunity: string;
  biggestRisk: string;
  narrative: string;
}> {
  // ── DIAGNOSTIC: log what the fallback guard sees ──
  console.log(`[verdictAgent] ── FALLBACK GUARD CHECK ──`);
  console.log(`[verdictAgent]   dossier.summary: "${dossier.summary?.slice(0, 120)}..."`);
  console.log(`[verdictAgent]   dossier.dataGaps: ${JSON.stringify(dossier.dataGaps)}`);
  console.log(`[verdictAgent]   includes 'No web search results available': ${dossier.dataGaps.includes('No web search results available')}`);
  console.log(`[verdictAgent]   summary falsy: ${!dossier.summary}`);
  console.log(`[verdictAgent]   summary includes 'No public corporate information': ${dossier.summary?.includes('No public corporate information')}`);

  // Graceful empty fallback
  if (
    dossier.dataGaps.includes('No web search results available') ||
    !dossier.summary ||
    dossier.summary.includes('No public corporate information')
  ) {
    console.warn(`[verdictAgent] ⚠️  FALLBACK TRIGGERED — returning default empty scores. This means the dossier was considered empty.`);
    return {
      scores: {
        marketOpportunity: 1,
        financialHealth: 1,
        executionTeam: 1,
        competitiveMoat: 1,
        riskLevel: 10,
      },
      risks: [],
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      keyReasons: [],
      majorRisks: ['No corporate data could be found.'],
      oneLineSummary: 'No corporate search results available.',
      biggestOpportunity: 'None identified.',
      biggestRisk: 'Absence of verifiable information.',
      narrative: 'Due to the complete absence of web search results and corporate data, no qualitative or quantitative assessment can be formulated for this company. The investment recommendation is automatically set to Pass.',
    };
  }

  console.log(`[verdictAgent] ✓ Fallback NOT triggered — proceeding to LLM call.`);

  const result = await callJSONWithRetry<RawVerdictResponse>({
    system: VERDICT_SYSTEM,
    user: `Please analyze the following Company Dossier and Bull/Bear Debate to formulate the final verdict.

Dossier:
${JSON.stringify(stripDossierForLLM(dossier), null, 2)}

Debate:
${JSON.stringify(debate, null, 2)}`,
  });

  // ── DIAGNOSTIC: log the parsed verdict result ──
  console.log(`[verdictAgent] ── RAW PARSED LLM RESULT ──`);
  console.log(`[verdictAgent]   scores: ${JSON.stringify(result.scores)}`);
  console.log(`[verdictAgent]   risks (${result.risks?.length || 0}): ${JSON.stringify(result.risks)}`);
  console.log(`[verdictAgent]   swot.strengths: ${JSON.stringify(result.swot?.strengths)}`);
  console.log(`[verdictAgent]   swot.weaknesses: ${JSON.stringify(result.swot?.weaknesses)}`);
  console.log(`[verdictAgent]   swot.opportunities: ${JSON.stringify(result.swot?.opportunities)}`);
  console.log(`[verdictAgent]   swot.threats: ${JSON.stringify(result.swot?.threats)}`);
  console.log(`[verdictAgent]   oneLineSummary: "${result.oneLineSummary}"`);

  return result;
}

/**
 * Derives the recommendation and confidence scorecard from numerical ratings in code.
 */
export function deriveRecommendation(scores: ScoreCard): {
  rec: Recommendation;
  confidence: number;
} {
  const mo = scores.marketOpportunity || 1;
  const fh = scores.financialHealth || 1;
  const et = scores.executionTeam || 1;
  const cm = scores.competitiveMoat || 1;
  const rl = scores.riskLevel || 10;

  // Formula: composite = marketOpportunity*0.25 + financialHealth*0.25 + executionTeam*0.2 + competitiveMoat*0.2 + (10-riskLevel)*0.1
  const composite = mo * 0.25 + fh * 0.25 + et * 0.2 + cm * 0.2 + (10 - rl) * 0.1;

  let rec: Recommendation = 'Pass';
  if (composite >= 7.0) {
    rec = 'Invest';
  } else if (composite >= 5.0) {
    rec = 'Watch';
  }

  // confidence = round(clamp(composite*10, 35, 95))
  const rawConfidence = composite * 10;
  const clampedConfidence = Math.min(Math.max(rawConfidence, 35), 95);
  const confidence = Math.round(clampedConfidence);

  return { rec, confidence };
}
