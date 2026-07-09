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
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: maxTokens,
      });

      const text = completion.choices[0]?.message?.content || '';
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
    return JSON.parse(cleaned) as T;
  } catch (parseError: any) {
    console.error(`Failed to parse JSON response. Raw text was:\n${rawText}\nCleaned text was:\n${cleaned}`);
    throw new Error(`LLM output could not be parsed as JSON: ${parseError.message}`);
  }
}
