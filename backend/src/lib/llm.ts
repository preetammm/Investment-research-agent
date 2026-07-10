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
export async function callText(options: CallOptions): Promise<string> {
  const { system, user, maxTokens } = options;

  // 1. Try Gemini
  try {
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
  } catch (geminiError: any) {
    const errorMsg = geminiError.message || String(geminiError);
    console.warn(`Gemini failed, falling back to Groq: ${errorMsg}`);

    // 2. Fallback to Groq
    try {
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
    } catch (groqError: any) {
      const groqErrorMsg = groqError.message || String(groqError);
      console.error(`Groq also failed: ${groqErrorMsg}`);
      throw new Error(
        `Both Gemini and Groq providers failed.\nGemini Error: ${errorMsg}\nGroq Error: ${groqErrorMsg}`
      );
    }
  }
}

/**
 * Calls the LLM provider to retrieve a structured JSON response.
 * Requests a JSON object, cleans any markdown formatting fences, and parses the result.
 */
export async function callJSON<T>(options: CallOptions): Promise<T> {
  const { system, user, maxTokens } = options;

  // Instruct the model to output only raw JSON
  const jsonSystem = `${system}\n\nIMPORTANT: You must return your output strictly in JSON format. Do not include any explanations, markdown code block backticks (e.g. \`\`\`json), or preamble. Return ONLY a valid JSON string.`;

  const rawText = await callText({
    system: jsonSystem,
    user,
    maxTokens,
  });

  // Strip reasoning blocks (e.g., <think>...</think>) if present
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // Strip code block fences if the LLM output includes them
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/^```(?:json)?\n?/i, '');
  cleaned = cleaned.replace(/\n?```$/i, '');
  cleaned = cleaned.trim();

  try {
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

    return JSON.parse(sanitized) as T;
  } catch (parseError: any) {
    console.error(`Failed to parse JSON response. Raw text was:\n${rawText}\nCleaned text was:\n${cleaned}`);
    throw new Error(`LLM output could not be parsed as JSON: ${parseError.message}`);
  }
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


