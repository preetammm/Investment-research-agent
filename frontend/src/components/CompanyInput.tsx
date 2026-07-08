import { useState, type FormEvent } from 'react';
import { motion, type Variants } from 'framer-motion';

export const CompanyInput = () => {
  const [companyName, setCompanyName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    console.log('Investigating company:', companyName);
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
            placeholder="e.g. Zerodha, Notion, Reliance..."
            className="w-full bg-transparent border-b border-slate-light text-center font-sans text-lg md:text-xl py-3 text-ink placeholder-ink-faint focus:outline-none focus:border-ink transition-colors duration-300"
          />
        </motion.div>

        {/* Investigate Button */}
        <motion.div variants={itemVariants}>
          <button
            type="submit"
            className="bg-ink hover:bg-ink-soft text-paper font-mono text-xs uppercase tracking-[0.15em] py-3.5 px-8 border border-transparent transition-all duration-300 active:scale-[0.98] select-none"
          >
            Investigate
          </button>
        </motion.div>
      </motion.form>
    </div>
  );
};
