import { useState, useRef, useEffect } from 'react';
import type { ResearchState } from '../types/research';
import { apiPost } from '../lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface QATurn {
  question: string;
  answer: string;
}

interface FollowUpChatProps {
  researchState: ResearchState;
}

export const FollowUpChat = ({ researchState }: FollowUpChatProps) => {
  const [turns, setTurns] = useState<QATurn[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new turns are added
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  const handleSubmit = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    setInput('');
    setError(null);
    setIsLoading(true);

    // Build history from all prior turns
    const history: ChatMessage[] = turns.flatMap((turn) => [
      { role: 'user' as const, content: turn.question },
      { role: 'assistant' as const, content: turn.answer },
    ]);

    try {
      const data = await apiPost('/api/followup', { question, researchState, history });
      setTurns((prev) => [...prev, { question, answer: data.answer }]);
    } catch (err: any) {
      setError(err.message || 'Failed to get follow-up answer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="w-full text-left space-y-5">
      {/* Section header */}
      <div className="border-b border-slate-light pb-3 font-mono text-[10px] tracking-widest text-ink-faint uppercase">
        ASK A FOLLOW-UP
      </div>

      {/* Conversation history */}
      {turns.length > 0 && (
        <div className="space-y-5">
          {turns.map((turn, idx) => (
            <div key={idx} className="space-y-2">
              <p className="text-sm font-sans font-medium text-ink">
                <span className="font-mono text-[10px] text-ink-faint mr-2">Q{idx + 1}:</span>
                {turn.question}
              </p>
              <p className="text-sm font-serif text-ink-soft leading-relaxed pl-5 border-l border-slate-light">
                {turn.answer}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="font-mono text-[10px] tracking-wider text-ink-faint animate-pulse pl-5">
          ANALYZING…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-pass font-mono text-xs">
          ERROR: {error}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about this research…"
          disabled={isLoading}
          className="flex-1 bg-transparent border border-slate-light px-4 py-2.5 font-sans text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-invest transition-colors rounded-sm disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase border border-slate-light text-ink-faint hover:border-ink-faint hover:text-ink transition-colors cursor-pointer rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Ask
        </button>
      </div>

      <div ref={bottomRef} />
    </section>
  );
};
