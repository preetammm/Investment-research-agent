import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InvestmentThesis, CompanyDossier } from '../types/research';
import { apiPost } from '../lib/api';

type AudienceMode = 'simple' | 'beginner' | 'investor' | 'analyst';

interface ExplainButtonProps {
  companyName: string;
  thesis: InvestmentThesis;
  dossier: CompanyDossier;
}

const MODE_OPTIONS: { mode: AudienceMode; label: string }[] = [
  { mode: 'simple', label: 'Explain it simply' },
  { mode: 'beginner', label: "I'm new to investing" },
  { mode: 'investor', label: 'I know the basics' },
  { mode: 'analyst', label: 'Give it to me straight' },
];

export const ExplainButton = ({ companyName, thesis, dossier }: ExplainButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<AudienceMode | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeSelect = async (mode: AudienceMode) => {
    setActiveMode(mode);
    setNarrative(null);
    setError(null);
    setIsLoading(true);

    try {
      const data = await apiPost('/api/explain', { companyName, thesis, dossier, mode });
      setNarrative(data.narrative);
    } catch (err: any) {
      setError(err.message || 'Failed to generate explanation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full text-left space-y-6">
      {/* Section header */}
      <div className="border-b border-slate-light pb-3 font-mono text-[10px] tracking-widest text-ink-faint uppercase">
        EXPLAIN THIS TO ME
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 font-mono text-xs tracking-wider text-ink-faint hover:text-ink transition-colors cursor-pointer group"
      >
        <span className="w-5 h-5 rounded-full border border-ink-faint group-hover:border-ink flex items-center justify-center text-[10px] font-bold transition-colors">
          ?
        </span>
        <span className="uppercase tracking-widest">Explain this to me</span>
      </button>

      {/* Expandable panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
            className="overflow-hidden"
          >
            {/* Mode pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.mode}
                  onClick={() => handleModeSelect(opt.mode)}
                  className={`px-3 py-1.5 rounded-sm font-mono text-[10px] tracking-wider uppercase border transition-colors cursor-pointer ${
                    activeMode === opt.mode
                      ? 'border-invest bg-invest-soft text-invest font-bold'
                      : 'border-slate-light text-ink-faint hover:border-ink-faint hover:text-ink-soft'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="font-mono text-[10px] tracking-wider text-ink-faint animate-pulse py-4">
                REWRITING FOR THIS AUDIENCE…
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-pass font-mono text-xs py-2">
                ERROR: {error}
              </div>
            )}

            {/* Narrative result */}
            <AnimatePresence mode="wait">
              {narrative && !isLoading && (
                <motion.div
                  key={activeMode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="font-serif text-base text-ink-soft leading-relaxed border-l-2 border-invest pl-5 py-2"
                >
                  {narrative}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
