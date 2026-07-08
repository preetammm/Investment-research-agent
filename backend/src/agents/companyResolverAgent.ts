import { callJSON } from '../lib/llm';

export interface ResolutionResult {
  status: 'confirmed' | 'ambiguous' | 'unrecognized';
  correctedName: string;
  alternatives: string[];
}

const SYSTEM_PROMPT = `You are an expert financial and corporate researcher.
Your task is to identify and resolve a company name from a user's input, which may contain spelling errors, abbreviations, shorthand, or incorrect casing.

Analyze the input and classify the resolution status as one of:
1. "confirmed": The input is an obvious match or has a minor typo of one specific, well-known company (e.g., "Amazn" -> "Amazon", "appl" -> "Apple", "msft" -> "Microsoft", "tsla" -> "Tesla").
2. "ambiguous": The input could reasonably refer to two or more distinct, well-known companies (e.g., "Titan" -> "Titan Company" vs "Titan Watches" vs "Titan Cement", or "Alpha" -> "Alphabet" vs "Alpha Metallurgical Resources"). In this case, list 2 to 3 distinct possible company names.
3. "unrecognized": The input is complete gibberish, unrecognized, or does not resemble any known company name closely enough to suggest options (e.g., "xyzqqqnotacompany").

You must return a JSON object with this exact shape:
{
  "status": "confirmed" | "ambiguous" | "unrecognized",
  "correctedName": "The exact full name of the resolved company (use empty string if status is 'unrecognized')",
  "alternatives": ["Alternative Company A", "Alternative Company B"] // Array of 2 to 3 distinct alternative company names. ONLY populate if status is "ambiguous". Otherwise, keep empty.
}

Do not perform web searches. Resolve this strictly using your internal knowledge of corporate entities.`;

/**
 * Resolves a raw user input into a confirmed, ambiguous, or unrecognized company name.
 */
export async function resolveCompanyName(rawInput: string): Promise<ResolutionResult> {
  const trimmedInput = rawInput.trim();
  if (!trimmedInput) {
    return {
      status: 'unrecognized',
      correctedName: '',
      alternatives: [],
    };
  }

  const result = await callJSON<ResolutionResult>({
    system: SYSTEM_PROMPT,
    user: `Please resolve the following company name: "${trimmedInput}"`,
  });

  return {
    status: result.status || 'unrecognized',
    correctedName: result.correctedName || '',
    alternatives: result.alternatives || [],
  };
}
