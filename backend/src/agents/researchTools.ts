import { callJSON } from '../lib/llm';
import { webSearch, SearchResult } from '../lib/search';
import { SourcedFact, CompanyDossier, StepEvent, StepId } from './types';

export async function callJSONWithRetry<T>(options: { system: string; user: string; maxTokens?: number }, retries = 3, delayMs = 2000): Promise<T> {
  try {
    return await callJSON<T>({ maxTokens: 2048, ...options });
  } catch (error: any) {
    const errorStr = String(error.message || error);
    if (retries > 0) {
      console.warn(`[llm-retry]: Call failed: "${errorStr}". Retrying in ${delayMs / 1000}s... (Retries left: ${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return callJSONWithRetry(options, retries - 1, delayMs * 2);
    }
    throw error;
  }
}


const SYSTEM_PROMPT_BASE = `You are an expert investment analyst.
Your task is to extract structured facts from the provided web search snippets about a company.

CRITICAL RULES:
1. Extract ONLY facts that are explicitly mentioned in the search snippets.
2. NEVER fill gaps, extrapolate, or use your own pre-training knowledge. If the search snippets do not contain information, return an empty list/result.
3. For each fact, map it to the exact 'sourceUrl' from the snippet where you found it.
4. Assign a 'confidence' score based on the reliability of the source snippet and specificity of the claim:
   - "high": Confirmed by multiple sources or official company reports.
   - "medium": Reported by reputable news sources/databases.
   - "low": Rumors, speculations, blogs, or self-reported/vague claims.
`;

const COMPANY_INFO_SYSTEM = `${SYSTEM_PROMPT_BASE}
You will receive web search results about a company's general overview, founding, leadership, and sector.
Extract key facts about leadership, founding details, headquarters, or business model.

You must return a JSON object with this exact shape:
{
  "facts": [
    {
      "label": "e.g. CEO, Founder, Founded Year, Headquarters, Business Model",
      "value": "Value of the fact",
      "sourceUrl": "The URL of the page containing this information",
      "confidence": "high" | "medium" | "low"
    }
  ]
}
`;

const FINANCIALS_SYSTEM = `${SYSTEM_PROMPT_BASE}
You will receive web search results about a company's funding, revenue, financials, and valuation.
Extract key financial facts, revenue numbers, valuation, funding stages, or key financial metrics.

You must return a JSON object with this exact shape:
{
  "facts": [
    {
      "label": "e.g. Valuation, Latest Funding Round, Annual Revenue (FY25), Key Investors",
      "value": "Value of the financial metric/fact",
      "sourceUrl": "The URL of the page containing this information",
      "confidence": "high" | "medium" | "low"
    }
  ]
}
`;

const NEWS_SYSTEM = `${SYSTEM_PROMPT_BASE}
You will receive web search results about a company's recent news, lawsuits, controversies, layoffs, or other notable current events.
Extract key news facts or potential warning signs.

You must return a JSON object with this exact shape:
{
  "facts": [
    {
      "label": "e.g. Recent Layoffs, Active Lawsuits, Regulatory Inquiries, Core Product Updates",
      "value": "Value or description of the news fact",
      "sourceUrl": "The URL of the page containing this information",
      "confidence": "high" | "medium" | "low"
    }
  ]
}
`;

const COMPETITOR_SYSTEM = `${SYSTEM_PROMPT_BASE}
You will receive web search results about a company's competitors, market share, and industry positioning.
Extract the names of its main competitors and any positioning facts.

You must return a JSON object with this exact shape:
{
  "competitors": ["Name of Competitor A", "Name of Competitor B"],
  "facts": [
    {
      "label": "e.g. Market Position, Primary Competitor, Competitive Advantage",
      "value": "Description of competitive landscape details",
      "sourceUrl": "The URL of the page containing this information",
      "confidence": "high" | "medium" | "low"
    }
  ]
}
`;

const MERGE_SYSTEM = `You are a senior investment research director.
Your task is to review all the gathered facts from 4 parallel research tools about a company and produce a consolidated final summary report.

Specifically, you must:
1. Determine if the company is public (true, false, or "unknown").
2. Write a concise, executive 2-3 sentence summary of the company.
3. Identify the sector (e.g., "Fintech", "Enterprise SaaS", "Consumer Tech", etc.).
4. Identify any red flags or risk signals by analyzing all facts, especially the news facts. For each red flag, create a SourcedFact, preserving its original sourceUrl and confidence level.
5. Identify any data gaps or missing information (e.g., "Missing official valuation", "No active leadership data found", etc.).

You must return a JSON object with this exact shape:
{
  "isPublic": true | false | "unknown",
  "summary": "string",
  "sector": "string",
  "redFlags": [
    {
      "label": "Label of the red flag (e.g., Pending Lawsuit, Executive Turnover)",
      "value": "Description of the risk",
      "sourceUrl": "The original URL if known, or omit if none",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "dataGaps": ["Gap 1", "Gap 2"]
}
`;

function formatSearchResults(results: SearchResult[]): string {
  return results
    .map((r, i) => `[Source ${i + 1}] Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}\n---`)
    .join('\n\n');
}

export async function companyInfoTool(companyName: string): Promise<SourcedFact[]> {
  const query = `"${companyName}" overview business model founded leadership sector`;
  console.log(`[infoTool]: Starting web search for query: "${query}"`);
  const searchResults = await webSearch(query, 3);
  console.log(`[infoTool]: Web search resolved with ${searchResults.length} results`);
  if (searchResults.length === 0) return [];

  console.log(`[infoTool]: Calling LLM...`);
  const response = await callJSONWithRetry<{ facts?: SourcedFact[] }>({
    system: COMPANY_INFO_SYSTEM,
    user: `Search results for "${companyName}":\n\n${formatSearchResults(searchResults)}`,
  });
  console.log(`[infoTool]: LLM resolved with ${response.facts?.length || 0} facts`);

  return response.facts || [];
}

export async function financialsTool(companyName: string): Promise<SourcedFact[]> {
  const query = `"${companyName}" funding revenue financials valuation`;
  console.log(`[financialsTool]: Starting web search for query: "${query}"`);
  const searchResults = await webSearch(query, 3);
  console.log(`[financialsTool]: Web search resolved with ${searchResults.length} results`);
  if (searchResults.length === 0) return [];

  console.log(`[financialsTool]: Calling LLM...`);
  const response = await callJSONWithRetry<{ facts?: SourcedFact[] }>({
    system: FINANCIALS_SYSTEM,
    user: `Search results for "${companyName}":\n\n${formatSearchResults(searchResults)}`,
  });
  console.log(`[financialsTool]: LLM resolved with ${response.facts?.length || 0} facts`);

  return response.facts || [];
}

export async function newsTool(companyName: string): Promise<SourcedFact[]> {
  const query = `"${companyName}" news 2026 lawsuit controversy layoffs`;
  console.log(`[newsTool]: Starting web search for query: "${query}"`);
  const searchResults = await webSearch(query, 3);
  console.log(`[newsTool]: Web search resolved with ${searchResults.length} results`);
  if (searchResults.length === 0) return [];

  console.log(`[newsTool]: Calling LLM...`);
  const response = await callJSONWithRetry<{ facts?: SourcedFact[] }>({
    system: NEWS_SYSTEM,
    user: `Search results for "${companyName}":\n\n${formatSearchResults(searchResults)}`,
  });
  console.log(`[newsTool]: LLM resolved with ${response.facts?.length || 0} facts`);

  return response.facts || [];
}

export interface CompetitorToolResult {
  competitors: string[];
  facts: SourcedFact[];
}

export async function competitorTool(companyName: string): Promise<CompetitorToolResult> {
  const query = `"${companyName}" competitors market share industry`;
  console.log(`[competitorTool]: Starting web search for query: "${query}"`);
  const searchResults = await webSearch(query, 3);
  console.log(`[competitorTool]: Web search resolved with ${searchResults.length} results`);
  if (searchResults.length === 0) return { competitors: [], facts: [] };

  console.log(`[competitorTool]: Calling LLM...`);
  const response = await callJSONWithRetry<CompetitorToolResult>({
    system: COMPETITOR_SYSTEM,
    user: `Search results for "${companyName}":\n\n${formatSearchResults(searchResults)}`,
  });
  console.log(`[competitorTool]: LLM resolved with ${response.competitors?.length || 0} competitors and ${response.facts?.length || 0} facts`);

  return {
    competitors: response.competitors || [],
    facts: response.facts || [],
  };
}

export async function runResearchTools(
  companyName: string,
  onStep: (event: StepEvent) => void
): Promise<CompanyDossier> {
  const stepIds: StepId[] = [
    'finding_company',
    'fetching_financials',
    'reading_news',
    'checking_competitors',
  ];

  // 1. Fire active events for all 4 tools immediately
  stepIds.forEach((step) => {
    onStep({ type: 'step', step, status: 'active' });
  });

  // Helper to run a tool, report completion, and return result
  const runAndReport = async <T>(step: StepId, toolFn: () => Promise<T>): Promise<T> => {
    console.time(`[timer]: ${step}`);
    try {
      const result = await toolFn();
      console.timeEnd(`[timer]: ${step}`);
      onStep({ type: 'step', step, status: 'done' });
      return result;
    } catch (err) {
      console.timeEnd(`[timer]: ${step}`);
      console.error(`Error in tool execution for step ${step}:`, err);
      onStep({ type: 'step', step, status: 'done' });
      throw err;
    }
  };

  // 2. Run all 4 tools in parallel (no stagger delays)
  const [infoFacts, financialFacts, newsFacts, competitorData] = await Promise.all([
    runAndReport('finding_company', () => companyInfoTool(companyName)),
    runAndReport('fetching_financials', () => financialsTool(companyName)),
    runAndReport('reading_news', () => newsTool(companyName)),
    runAndReport('checking_competitors', () => competitorTool(companyName)),
  ]);

  const isEmpty =
    infoFacts.length === 0 &&
    financialFacts.length === 0 &&
    newsFacts.length === 0 &&
    competitorData.competitors.length === 0 &&
    competitorData.facts.length === 0;

  // 3. Handle all empty case
  if (isEmpty) {
    return {
      companyName,
      isPublic: 'unknown',
      summary: `No public corporate information, news, or financial data could be found for "${companyName}".`,
      sector: 'unknown',
      leadership: [],
      financials: [],
      recentNews: [],
      competitors: [],
      redFlags: [],
      dataGaps: ['No web search results available'],
    };
  }

  // 4. Otherwise: fire merge step active, run merge LLM call, and then fire merge step done
  onStep({ type: 'step', step: 'merging_dossier', status: 'active' });

  const inputForMerge = {
    companyName,
    generalFacts: infoFacts,
    financialFacts,
    newsFacts,
    competitors: competitorData.competitors,
    competitorFacts: competitorData.facts,
  };

  interface MergeResult {
    isPublic: boolean | 'unknown';
    summary: string;
    sector: string;
    redFlags: SourcedFact[];
    dataGaps: string[];
  }

  console.time(`[timer]: merging_dossier`);
  const mergeResult = await callJSONWithRetry<MergeResult>({
    system: MERGE_SYSTEM,
    user: `Here are the gathered research facts about "${companyName}". Please analyze and merge them:\n\n${JSON.stringify(inputForMerge, null, 2)}`,
  });
  console.timeEnd(`[timer]: merging_dossier`);

  onStep({ type: 'step', step: 'merging_dossier', status: 'done' });

  return {
    companyName,
    isPublic: mergeResult.isPublic,
    summary: mergeResult.summary,
    sector: mergeResult.sector,
    leadership: infoFacts,
    financials: financialFacts,
    recentNews: newsFacts,
    competitors: competitorData.competitors,
    redFlags: mergeResult.redFlags || [],
    dataGaps: mergeResult.dataGaps || [],
  };
}
