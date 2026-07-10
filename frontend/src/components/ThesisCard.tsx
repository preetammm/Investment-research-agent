import { motion } from 'framer-motion';
import type { Recommendation } from '../types/research';

interface ThesisCardProps {
  companyName: string;
  recommendation: Recommendation;
  confidence: number;
  oneLineSummary: string;
}

export const ThesisCard = ({
  companyName,
  recommendation,
  confidence,
  oneLineSummary,
}: ThesisCardProps) => {
  // Map recommendation to theme-specific colors
  const colorMap = {
    Invest: {
      text: 'text-invest',
      border: 'border-invest',
      bg: 'bg-invest-soft',
    },
    Watch: {
      text: 'text-watch',
      border: 'border-watch',
      bg: 'bg-watch-soft',
    },
    Pass: {
      text: 'text-pass',
      border: 'border-pass',
      bg: 'bg-pass-soft',
    },
  };

  const theme = colorMap[recommendation] || colorMap.Pass;

  // Stamped animation variants
  const stampVariants = {
    hidden: { scale: 2.2, rotate: -25, opacity: 0 },
    visible: {
      scale: 1,
      rotate: -3,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1], // easeOutExpo
      },
    },
  };

  return (
    <div className="w-full bg-paper border border-slate-light p-8 rounded-sm shadow-sm flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 text-left select-none relative overflow-hidden">
      {/* Decorative vertical accent bar matching retro-editorial style */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-1.5 ${
          recommendation === 'Invest'
            ? 'bg-invest'
            : recommendation === 'Watch'
            ? 'bg-watch'
            : 'bg-pass'
        }`}
      />

      {/* Stamp container */}
      <div className="flex-shrink-0 relative">
        <motion.div
          variants={stampVariants}
          initial="hidden"
          animate="visible"
          className={`w-28 h-28 rounded-full border-4 border-double flex flex-col items-center justify-center font-mono font-bold text-sm tracking-widest uppercase select-none ${theme.border} ${theme.bg} ${theme.text}`}
        >
          {/* Inner ring for classic stamp aesthetic */}
          <div
            className={`w-24 h-24 rounded-full border border-dashed flex flex-col items-center justify-center ${theme.border}`}
          >
            <span>{recommendation}</span>
            <span className="text-[8px] tracking-normal mt-0.5">VERDICT</span>
          </div>
        </motion.div>
      </div>

      {/* Narrative overview */}
      <div className="flex-grow space-y-3">
        <div className="font-mono text-[10px] tracking-widest text-ink-faint uppercase">
          {companyName} // INVESTMENT_THESIS
        </div>

        <h3 className="font-serif italic text-2xl md:text-3xl text-ink leading-tight">
          "{oneLineSummary}"
        </h3>

        <div className="flex items-center space-x-2 pt-1">
          <span className="font-mono text-xs text-ink-faint">CONFIDENCE_RATING:</span>
          <span className={`font-mono text-xs font-bold ${theme.text}`}>{confidence}%</span>
          <div className="w-24 h-1.5 bg-slate-light rounded-sm overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full ${
                recommendation === 'Invest'
                  ? 'bg-invest'
                  : recommendation === 'Watch'
                  ? 'bg-watch'
                  : 'bg-pass'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
