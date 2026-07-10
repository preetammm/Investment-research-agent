import { motion } from 'framer-motion';
import type { RiskItem } from '../types/research';

interface RiskAnalysisProps {
  risks: RiskItem[];
}

const severityConfig: Record<RiskItem['severity'], { bg: string; text: string }> = {
  low: { bg: 'bg-watch-soft', text: 'text-watch' },
  medium: { bg: 'bg-invest-soft', text: 'text-invest' },
  high: { bg: 'bg-pass-soft', text: 'text-pass' },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const RiskAnalysis = ({ risks }: RiskAnalysisProps) => {
  // Don't render if no risks
  if (!risks || risks.length === 0) return null;

  return (
    <section className="w-full text-left space-y-6">
      {/* Section header */}
      <div className="border-b border-slate-light pb-3 font-mono text-[10px] tracking-widest text-ink-faint uppercase">
        RISK ANALYSIS
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="space-y-3"
      >
        {risks.map((risk, idx) => {
          const sev = severityConfig[risk.severity];
          return (
            <motion.div
              key={`${risk.category}-${idx}`}
              variants={rowVariants}
              className="flex flex-wrap items-start gap-3 py-3 border-b border-slate-light last:border-b-0"
            >
              {/* Category */}
              <span className="font-sans text-sm font-bold text-ink shrink-0 min-w-[140px]">
                {risk.category}
              </span>

              {/* Severity pill */}
              <span
                className={`px-2.5 py-0.5 rounded-sm font-mono text-[10px] tracking-wider uppercase font-bold shrink-0 ${sev.bg} ${sev.text}`}
              >
                {risk.severity}
              </span>

              {/* Detail */}
              <span className="text-sm text-ink-soft font-serif leading-relaxed flex-1 min-w-0">
                {risk.detail}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};
