/**
 * Frontend Configuration
 * Reads VITE_API_URL from Vite's environment variables,
 * falling back to localhost:4000 for local development.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
