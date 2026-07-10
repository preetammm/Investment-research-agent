import { useState, useCallback } from 'react';
import type { StepId, ResearchState } from '../types/research';
import { API_BASE_URL } from '../lib/config';

export type StepStatus = 'pending' | 'active' | 'done';

const INITIAL_STEPS: Record<StepId, StepStatus> = {
  finding_company: 'pending',
  fetching_financials: 'pending',
  reading_news: 'pending',
  checking_competitors: 'pending',
  merging_dossier: 'pending',
  identifying_risks: 'pending',
  evaluating_health: 'pending',
  building_thesis: 'pending',
  final_recommendation: 'pending',
};

export function useResearchStream() {
  const [steps, setSteps] = useState<Record<StepId, StepStatus>>(INITIAL_STEPS);
  const [researchState, setResearchState] = useState<ResearchState | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startResearch = useCallback(async (companyName: string) => {
    setIsStreaming(true);
    setError(null);
    setResearchState(null);
    setSteps({ ...INITIAL_STEPS });

    try {
      const response = await fetch(`${API_BASE_URL}/api/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // The last element is a partial line (or empty if it ended exactly on a newline)
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (!dataStr) continue;

            try {
              const event = JSON.parse(dataStr);
              if (event.type === 'step') {
                setSteps((prev) => ({
                  ...prev,
                  [event.step]: event.status,
                }));
              } else if (event.type === 'result') {
                setResearchState(event.state);
              } else if (event.type === 'error') {
                setError(event.error || 'An error occurred during research');
              }
            } catch (err) {
              console.error('Failed to parse SSE event line:', trimmed, err);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error in research stream:', err);
      setError(err.message || 'Failed to connect to the research stream');
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return {
    steps,
    researchState,
    isStreaming,
    error,
    startResearch,
  };
}
