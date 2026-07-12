import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

interface CallOptions {
  system: string;
  user: string;
  maxTokens?: number;
}

/**
 * Returns a new GoogleGenerativeAI client using the API key read from process.env at call time.
 */
function getGeminiClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is not defined');
  }
  return new GoogleGenerativeAI(key);
}

/**
 * Returns a new Groq client using the API key read from process.env at call time.
 */
function getGroqClient(): Groq {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY environment variable is not defined');
  }
  return new Groq({ apiKey: key });
}

/**
 * Calls the LLM provider to retrieve a plain text response.
 * Uses Gemini as primary and falls back to Groq if Gemini fails.
 */
async function callGeminiRaw(system: string, user: string, maxTokens?: number): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: system,
  });

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: maxTokens ? { maxOutputTokens: maxTokens } : undefined,
  });

  const text = response.response.text();
  if (!text) {
    throw new Error('Gemini returned an empty text response');
  }
  return text;
}

async function callGroqRaw(system: string, user: string, maxTokens?: number): Promise<string> {
  const groq = getGroqClient();
  let text = '';
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
    });
    text = completion.choices[0]?.message?.content || '';
  } catch (firstGroqError: any) {
    console.warn(`[groq-fallback]: Llama 3.3 failed, falling back to Llama 3.1 8B: ${firstGroqError.message || firstGroqError}`);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
    });
    text = completion.choices[0]?.message?.content || '';
  }

  if (!text) {
    throw new Error('Groq returned an empty response');
  }
  return text;
}

/**
 * Calls the LLM provider to retrieve a plain text response.
 * Uses Gemini as primary and falls back to Groq if Gemini fails.
 */
export async function callText(options: CallOptions): Promise<string> {
  const { system, user, maxTokens } = options;

  try {
    return await callGeminiRaw(system, user, maxTokens);
  } catch (geminiError: any) {
    const errorMsg = geminiError.message || String(geminiError);
    console.warn(`Gemini failed, falling back to Groq: ${errorMsg}`);

    try {
      return await callGroqRaw(system, user, maxTokens);
    } catch (groqError: any) {
      const groqErrorMsg = groqError.message || String(groqError);
      console.error(`Groq also failed: ${groqErrorMsg}`);
      throw new Error(
        `Both Gemini and Groq providers failed.\nGemini Error: ${errorMsg}\nGroq Error: ${groqErrorMsg}`
      );
    }
  }
}

function tryCleanAndParse<T>(rawText: string): T {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/^```(?:json)?\n?/i, '');
  cleaned = cleaned.replace(/\n?```$/i, '');
  cleaned = cleaned.trim();

  // Strip single-line and multi-line comments while preserving URLs and strings
  cleaned = cleaned.replace(/("([^"\\]|\\.)*")|(\/\*[\s\S]*?\*\/)|(\/\/.*)/g, (match, g1) => {
    if (g1) return match;
    return '';
  });

  cleaned = cleaned.trim();

  // Sanitize unescaped newlines in JSON string literals
  let sanitized = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (escape) {
      sanitized += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      sanitized += char;
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      sanitized += char;
      continue;
    }
    if (inString && (char === '\n' || char === '\r')) {
      if (char === '\n') {
        sanitized += '\\n';
      }
      continue;
    }
    sanitized += char;
  }

  // Attempt standard parse first
  try {
    return JSON.parse(sanitized) as T;
  } catch (initialError: any) {
    console.warn(`[tryCleanAndParse] Initial JSON parse failed: "${initialError.message}". Attempting repairs...`);
    
    let repaired = sanitized.trim();

    // Specific repair for Verdict Agent's "narrative" field which is the last property in the JSON schema
    if (repaired.includes('"narrative"')) {
      try {
        const narrativeMatch = repaired.match(/"narrative"\s*:\s*([\s\S]*)/i);
        if (narrativeMatch) {
          let narrativeValue = narrativeMatch[1].trim();
          
          // Remove closing object bracket if present at the end
          if (narrativeValue.endsWith('}')) {
            narrativeValue = narrativeValue.slice(0, -1).trim();
          }
          
          // Strip leading and trailing quotes from the narrative text
          if (narrativeValue.startsWith('"')) {
            narrativeValue = narrativeValue.substring(1);
          }
          if (narrativeValue.endsWith('"')) {
            narrativeValue = narrativeValue.slice(0, -1);
          }
          
          // Clean up newlines and quotes inside the narrative
          // 1. Normalize existing escapes to plain text to avoid double escaping
          narrativeValue = narrativeValue.replace(/\\n/g, '\n').replace(/\\"/g, '"');
          // 2. Escape double quotes and newlines properly for JSON
          narrativeValue = narrativeValue.replace(/"/g, '\\"').replace(/\n/g, '\\n');
          
          // Re-assemble the JSON prefix with the newly repaired narrative
          const narrativeIndex = repaired.indexOf(narrativeMatch[0]);
          const prefix = repaired.substring(0, narrativeIndex) + '"narrative": ';
          repaired = prefix + '"' + narrativeValue + '"\n}';
        }
      } catch (repError) {
        console.warn(`[tryCleanAndParse] Narrative repair helper failed:`, repError);
      }
    }

    // Attempt to parse again after the narrative-specific repair
    try {
      return JSON.parse(repaired) as T;
    } catch (narrativeRepairError: any) {
      console.warn(`[tryCleanAndParse] Parse failed after narrative repair: "${narrativeRepairError.message}". Trying generic bracket/brace balancing...`);
      
      // Generic repair for unclosed strings/brackets
      let genericRepaired = repaired.trim();
      
      // Re-evaluate inString state on repaired text
      let repairInString = false;
      let repairEscape = false;
      for (let i = 0; i < genericRepaired.length; i++) {
        const char = genericRepaired[i];
        if (repairEscape) { repairEscape = false; continue; }
        if (char === '\\') { repairEscape = true; continue; }
        if (char === '"') { repairInString = !repairInString; }
      }
      
      if (repairInString) {
        genericRepaired += '"';
      }
      
      // Balance braces and brackets
      let openBraces = (genericRepaired.match(/\{/g) || []).length;
      let closeBraces = (genericRepaired.match(/\}/g) || []).length;
      let openBrackets = (genericRepaired.match(/\[/g) || []).length;
      let closeBrackets = (genericRepaired.match(/\]/g) || []).length;

      if (openBrackets > closeBrackets) {
        genericRepaired += ']';
      }
      if (openBraces > closeBraces) {
        genericRepaired += '}';
      }

      try {
        return JSON.parse(genericRepaired) as T;
      } catch (genericRepairError) {
        // Fall back to throwing the initial parse error
        throw initialError;
      }
    }
  }
}

/**
 * Calls the LLM provider to retrieve a structured JSON response.
 * Requests a JSON object, cleans any markdown formatting fences, and parses the result.
 */
export async function callJSON<T>(options: CallOptions): Promise<T> {
  const { system, user, maxTokens } = options;
  const jsonSystem = `${system}\n\nIMPORTANT: You must return your output strictly in JSON format. Do not include any explanations, markdown code block backticks (e.g. \`\`\`json), or preamble. Return ONLY a valid JSON string.`;

  let geminiError: any = null;

  // 1. Try Gemini
  try {
    const rawText = await callGeminiRaw(jsonSystem, user, maxTokens);
    try {
      return tryCleanAndParse<T>(rawText);
    } catch (parseError: any) {
      console.error(`[callJSON] Gemini JSON parse failed: ${parseError.message}.\n=== RAW GEMINI TEXT ===\n${rawText}\n=== END RAW ===`);
      console.warn(`[callJSON] Attempting Gemini JSON repair retry...`);
      const retrySystem = `${jsonSystem}\n\nYour previous response was not valid JSON. Return ONLY a complete, valid JSON object with no truncation.`;
      const retryRawText = await callGeminiRaw(retrySystem, user, maxTokens);
      try {
        return tryCleanAndParse<T>(retryRawText);
      } catch (retryParseError: any) {
        console.error(`[callJSON] Gemini JSON repair retry also failed: ${retryParseError.message}.\n=== RAW RETRY TEXT ===\n${retryRawText}\n=== END RAW ===`);
        geminiError = new Error(`Gemini JSON parse failed on both attempts. Initial: ${parseError.message}. Retry: ${retryParseError.message}`);
      }
    }
  } catch (apiError: any) {
    geminiError = apiError;
    console.warn(`[callJSON] Gemini API call failed: ${apiError.message || apiError}`);
  }

  // 2. Fallback to Groq
  console.warn(`[callJSON] Gemini failed to return valid JSON. Falling back to Groq...`);
  let groqError: any = null;

  try {
    const rawText = await callGroqRaw(jsonSystem, user, maxTokens);
    try {
      return tryCleanAndParse<T>(rawText);
    } catch (parseError: any) {
      console.error(`[callJSON] Groq JSON parse failed: ${parseError.message}.\n=== RAW GROQ TEXT ===\n${rawText}\n=== END RAW ===`);
      console.warn(`[callJSON] Attempting Groq JSON repair retry...`);
      const retrySystem = `${jsonSystem}\n\nYour previous response was not valid JSON. Return ONLY a complete, valid JSON object with no truncation.`;
      const retryRawText = await callGroqRaw(retrySystem, user, maxTokens);
      try {
        return tryCleanAndParse<T>(retryRawText);
      } catch (retryParseError: any) {
        console.error(`[callJSON] Groq JSON repair retry also failed: ${retryParseError.message}.\n=== RAW RETRY TEXT ===\n${retryRawText}\n=== END RAW ===`);
        groqError = new Error(`Groq JSON parse failed on both attempts. Initial: ${parseError.message}. Retry: ${retryParseError.message}`);
      }
    }
  } catch (apiError: any) {
    groqError = apiError;
    console.error(`[callJSON] Groq API call failed: ${apiError.message || apiError}`);
  }

  throw new Error(
    `Both Gemini and Groq JSON calls failed.\nGemini Error: ${geminiError?.message || geminiError}\nGroq Error: ${groqError?.message || groqError}`
  );
}

/**
 * A single message in a multi-turn chat conversation.
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Calls the LLM provider with a full multi-turn conversation history.
 * Uses Gemini as primary and falls back to Groq if Gemini fails.
 * This is the mechanism that gives the chat "memory" — the full history
 * is resent every call since the model retains nothing between requests.
 */
export async function callChat(options: {
  system: string;
  history: ChatMessage[];
  maxTokens?: number;
}): Promise<string> {
  const { system, history, maxTokens } = options;

  // 1. Try Gemini
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: system,
    });

    // Convert ChatMessage[] to Gemini's content format
    const contents = history.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await model.generateContent({
      contents,
      generationConfig: maxTokens ? { maxOutputTokens: maxTokens } : undefined,
    });

    const text = response.response.text();
    if (!text) {
      throw new Error('Gemini returned an empty chat response');
    }
    return text;
  } catch (geminiError: any) {
    const errorMsg = geminiError.message || String(geminiError);
    console.warn(`[callChat] Gemini failed, falling back to Groq: ${errorMsg}`);

    // 2. Fallback to Groq
    try {
      const groq = getGroqClient();

      // Convert ChatMessage[] to Groq's message format
      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: system },
        ...history.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ];

      let text = '';
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages,
          max_tokens: maxTokens,
        });
        text = completion.choices[0]?.message?.content || '';
      } catch (firstGroqError: any) {
        console.warn(`[callChat] Llama 3.3 failed, falling back to Llama 3.1 8B: ${firstGroqError.message || firstGroqError}`);
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages,
          max_tokens: maxTokens,
        });
        text = completion.choices[0]?.message?.content || '';
      }

      if (!text) {
        throw new Error('Groq returned an empty chat response');
      }
      return text;
    } catch (groqError: any) {
      const groqErrorMsg = groqError.message || String(groqError);
      console.error(`[callChat] Groq also failed: ${groqErrorMsg}`);
      throw new Error(
        `Both Gemini and Groq providers failed.\nGemini Error: ${errorMsg}\nGroq Error: ${groqErrorMsg}`
      );
    }
  }
}

/**
 * Strips non-essential, highly verbose fields (like sourceUrl and confidence)
 * from a dossier to dramatically reduce prompt token counts for LLM calls.
 */
export function stripDossierForLLM(dossier: any): any {
  if (!dossier || typeof dossier !== 'object') return dossier;

  const stripFact = (f: any) => {
    if (!f || typeof f !== 'object') return f;
    // Retain only label and value
    return {
      label: f.label,
      value: f.value,
    };
  };

  return {
    ...dossier,
    leadership: Array.isArray(dossier.leadership) ? dossier.leadership.map(stripFact) : undefined,
    financials: Array.isArray(dossier.financials) ? dossier.financials.map(stripFact) : undefined,
    recentNews: Array.isArray(dossier.recentNews) ? dossier.recentNews.map(stripFact) : undefined,
    redFlags: Array.isArray(dossier.redFlags) ? dossier.redFlags.map(stripFact) : undefined,
  };
}

/**
 * Strips non-essential verbose fields from the entire research state for follow-up chat calls.
 */
export function stripResearchStateForLLM(state: any): any {
  if (!state || typeof state !== 'object') return state;

  return {
    ...state,
    dossier: stripDossierForLLM(state.dossier),
  };
}


