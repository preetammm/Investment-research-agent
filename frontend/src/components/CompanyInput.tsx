import { useState, type FormEvent } from 'react';
import { motion, type Variants, AnimatePresence } from 'framer-motion';

export const CompanyInput = () => {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'confirmed' | 'ambiguous' | 'unrecognized'>('idle');
  const [resolvedName, setResolvedName] = useState('');
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const query = companyName.trim();
    if (!query || loading) return;

    setLoading(true);
    setStatus('idle');
    setErrorMessage('');
    setResolvedName('');
    setAlternatives([]);

    try {
      const response = await fetch('http://localhost:4000/api/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: query }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`);
      }

      const data = await response.json();
      setStatus(data.status);
      setResolvedName(data.correctedName);
      setAlternatives(data.alternatives);

      if (data.status === 'confirmed') {
        // Show brief searching state then proceed
        setTimeout(() => {
          console.log(`Would proceed to research ${data.correctedName}`);
          setStatus('idle');
          setCompanyName('');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error resolving company name:', err);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setStatus('unrecognized');
    } finally {
      setLoading(false);
    }
  };

  const handleSelection = (name: string) => {
    console.log(`Would proceed to research ${name}`);
    setStatus('idle');
    setCompanyName('');
  };

  // Animation variants for staggered fade-up
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as const, // Smooth easeOutExpo curves
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center select-none">
      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="max-w-xl w-full flex flex-col items-center space-y-10"
      >
        {/* Label: DOSSIER */}
        <motion.div
          variants={itemVariants}
          className="font-mono text-xs uppercase tracking-[0.25em] text-ink-faint"
        >
          Dossier
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="font-serif italic text-4xl md:text-5xl text-ink leading-[1.2] font-medium"
        >
          Give it a company.<br />It builds the case.
        </motion.h1>

        {/* Underlined text Input */}
        <motion.div
          variants={itemVariants}
          className="w-full relative pt-2"
        >
          <input
            id="company-name-input"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={loading || status === 'confirmed'}
            placeholder="e.g. Zerodha, Notion, Reliance..."
            className="w-full bg-transparent border-b border-slate-light text-center font-sans text-lg md:text-xl py-3 text-ink placeholder-ink-faint focus:outline-none focus:border-ink transition-colors duration-300 disabled:opacity-50"
          />
        </motion.div>

        {/* Investigate Button */}
        <motion.div variants={itemVariants} className="flex flex-col items-center space-y-6 w-full">
          <button
            type="submit"
            disabled={loading || !companyName.trim() || status === 'confirmed'}
            className="bg-ink hover:bg-ink-soft disabled:opacity-50 text-paper font-mono text-xs uppercase tracking-[0.15em] py-3.5 px-8 border border-transparent transition-all duration-300 active:scale-[0.98] select-none flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-paper/30 border-t-paper rounded-full animate-spin"></span>
                <span>Investigating</span>
              </>
            ) : (
              <span>Investigate</span>
            )}
          </button>

          {/* Feedback & Interaction UI Panel */}
          <AnimatePresence mode="wait">
            {status === 'confirmed' && (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-mono text-xs uppercase tracking-wider text-watch bg-watch-soft py-3 px-6 border border-watch/20 w-full rounded-sm"
              >
                ✓ Searching for <span className="font-bold">{resolvedName}</span>...
              </motion.div>
            )}

            {status === 'ambiguous' && (
              <motion.div
                key="ambiguous"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center space-y-4 pt-6 border-t border-slate-light"
              >
                <p className="font-sans text-sm text-ink-soft">
                  {resolvedName
                    ? <>Did you mean <span className="italic font-serif text-ink font-semibold">{resolvedName}</span> or one of these?</>
                    : <>Did you mean one of these companies?</>
                  }
                </p>
                <div className="flex flex-wrap justify-center gap-3 w-full">
                  {resolvedName && (
                    <button
                      type="button"
                      onClick={() => handleSelection(resolvedName)}
                      className="bg-paper hover:bg-slate-light text-ink border border-ink/10 font-mono text-xs py-2.5 px-4 transition-all duration-300 hover:border-ink rounded-sm cursor-pointer"
                    >
                      {resolvedName}
                    </button>
                  )}
                  {alternatives.map((alt) => (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => handleSelection(alt)}
                      className="bg-paper hover:bg-slate-light text-ink border border-ink/10 font-mono text-xs py-2.5 px-4 transition-all duration-300 hover:border-ink rounded-sm cursor-pointer"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {status === 'unrecognized' && (
              <motion.div
                key="unrecognized"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-mono text-xs text-pass bg-pass-soft py-3 px-6 border border-pass/20 w-full rounded-sm"
              >
                ✗ {errorMessage || "Couldn't recognize that company name — try checking the spelling"}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.form>
    </div>
  );
};

