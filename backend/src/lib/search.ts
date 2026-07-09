export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

/**
 * Performs a web search using the Tavily API.
 * Never throws an error; instead logs a warning and returns an empty array on failure.
 */
export async function webSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn('[search]: TAVILY_API_KEY environment variable is missing. Skipping search.');
    return [];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        max_results: maxResults,
      }),
    });

    if (!response.ok) {
      console.warn(`[search]: Tavily API returned status ${response.status} ${response.statusText}`);
      return [];
    }

    const data = (await response.json()) as any;
    if (!data.results || !Array.isArray(data.results)) {
      console.warn('[search]: Tavily API returned unexpected format:', data);
      return [];
    }

    return data.results.map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      content: result.content || '',
    }));
  } catch (error) {
    console.warn('[search]: Failed to call Tavily API:', error);
    return [];
  }
}
