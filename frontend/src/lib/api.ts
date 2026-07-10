import { API_BASE_URL } from './config';

/**
 * Robust fetch wrapper for the Render backend.
 *
 * Handles:
 * - Render free-tier cold starts (can take 30-60s to spin up)
 * - Network timeouts with configurable duration
 * - Automatic retries with exponential backoff
 * - Clear, user-friendly error messages
 */

interface FetchOptions extends RequestInit {
  /** Timeout in milliseconds. Default: 60000 (60s) to handle Render cold starts */
  timeoutMs?: number;
  /** Number of retry attempts. Default: 2 */
  retries?: number;
}

/**
 * Custom error class that distinguishes between different failure modes
 * so the UI can show helpful messages.
 */
export class ApiError extends Error {
  public status: number;
  public isTimeout: boolean;
  public isNetworkError: boolean;

  constructor(
    message: string,
    { status = 0, isTimeout = false, isNetworkError = false } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isTimeout = isTimeout;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Fetch with an AbortController-based timeout.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Main API fetch function.  Retries on network errors and timeouts.
 * Returns the parsed JSON body on success.
 * Throws ApiError on failure with clear context.
 */
export async function apiFetch<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeoutMs = 60_000, retries = 2, ...fetchInit } = options;
  const url = `${API_BASE_URL}${path}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchInit, timeoutMs);

      if (!response.ok) {
        // Server responded with an error — don't retry these (they're not transient)
        const body = await response.text();
        let detail = '';
        try {
          detail = JSON.parse(body)?.error || body;
        } catch {
          detail = body;
        }
        throw new ApiError(
          detail || `Server error: ${response.status} ${response.statusText}`,
          { status: response.status }
        );
      }

      return response as unknown as T; // caller decides: .json() or ReadableStream
    } catch (err: any) {
      // If it's a non-retryable ApiError (server returned 4xx/5xx), rethrow immediately
      if (err instanceof ApiError && err.status >= 400) {
        throw err;
      }

      // Timeout
      if (err.name === 'AbortError') {
        lastError = new ApiError(
          'The server is taking too long to respond. It may be waking up — please try again in a moment.',
          { isTimeout: true }
        );
      }
      // Network failure (backend unreachable, DNS, CORS, etc.)
      else if (err instanceof TypeError && err.message.includes('fetch')) {
        lastError = new ApiError(
          'Unable to reach the server. Please check your connection or try again shortly.',
          { isNetworkError: true }
        );
      }
      // Anything else unexpected
      else if (!(err instanceof ApiError)) {
        lastError = new ApiError(err.message || 'An unexpected error occurred.', {
          isNetworkError: true,
        });
      } else {
        lastError = err;
      }

      // Wait before retrying (exponential backoff: 1s, 3s)
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.warn(
          `[apiFetch] Attempt ${attempt + 1} failed for ${path}. Retrying in ${delay}ms...`,
          err.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  throw lastError || new ApiError('Request failed after multiple attempts.');
}

/**
 * Convenience wrapper for JSON POST requests.
 */
export async function apiPost<T = any>(
  path: string,
  body: Record<string, any>,
  options: FetchOptions = {}
): Promise<T> {
  const response = await apiFetch<Response>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...options,
  });

  return response.json() as Promise<T>;
}

/**
 * Ping the backend health endpoint to wake up Render.
 * Silently succeeds or fails — no user-facing impact.
 */
export async function warmUpBackend(): Promise<void> {
  try {
    await fetchWithTimeout(
      `${API_BASE_URL}/api/health`,
      { method: 'GET' },
      10_000
    );
    console.log('[warmup] Backend is awake.');
  } catch {
    console.warn('[warmup] Backend may be cold-starting. First request may be slow.');
  }
}
