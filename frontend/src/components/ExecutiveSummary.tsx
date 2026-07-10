import { motion } from 'framer-motion';
import type { InvestmentThesis, Recommendation } from '../types/research';

interface ExecutiveSummaryProps {
  companyName: string;
  thesis: InvestmentThesis;
}

const recColorMap: Record<Recommendation, { text: string; border: string }> = {
  Invest: { text: 'text-invest', border: 'border-invest' },
  Watch: { text: 'text-watch', border: 'border-watch' },
  Pass: { text: 'text-pass', border: 'border-pass' },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export const ExecutiveSummary = ({ companyName, thesis }: ExecutiveSummaryProps) => {
  const colors = recColorMap[thesis.recommendation] || recColorMap.Pass;

  return (
    <section className="w-full text-left">
      {/* 2px top border to visually distinguish as a bookend summary */}
      <div className="border-t-2 border-ink pt-6 space-y-6">
        {/* Header */}
        <div>
          <div className="font-mono text-[10px] tracking-widest text-ink-faint uppercase">
            EXECUTIVE SUMMARY — {companyName}
          </div>
          <p className="font-serif italic text-xs text-ink-faint mt-1">
            The 30-second version, if that's all you need
          </p>
        </div>

        {/* Grid content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="space-y-5"
        >
          {/* Row 1: Recommendation + Confidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={itemVariants} className="space-y-1">
              <span className="font-mono text-[10px] tracking-widest text-ink-faint uppercase block">
                Recommendation
              </span>
              <span className={`font-serif italic text-3xl ${colors.text}`}>
                {thesis.recommendation}
              </span>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1">
              <span className="font-mono text-[10px] tracking-widest text-ink-faint uppercase block">
                Confidence
              </span>
              <span className="font-mono text-3xl text-ink font-bold">
                {thesis.confidence}%
              </span>
            </motion.div>
          </div>

          {/* Row 2: Biggest Opportunity */}
          <motion.div variants={itemVariants} className="space-y-1">
            <span className="font-mono text-[10px] tracking-widest text-ink-faint uppercase block">
              Biggest Opportunity
            </span>
            <p className="font-serif text-base text-ink-soft leading-relaxed">
              {thesis.biggestOpportunity}
            </p>
          </motion.div>

          {/* Row 3: Biggest Risk */}
          <motion.div variants={itemVariants} className="space-y-1">
            <span className="font-mono text-[10px] tracking-widest text-ink-faint uppercase block">
              Biggest Risk
            </span>
            <p className="font-serif text-base text-ink-soft leading-relaxed">
              {thesis.biggestRisk}
            </p>
          </motion.div>

          {/* Row 4: Overall conclusion — separated by top border */}
          <motion.div
            variants={itemVariants}
            className="border-t border-slate-light pt-4 space-y-1"
          >
            <span className="font-mono text-[10px] tracking-widest text-ink-faint uppercase block">
              Overall Conclusion
            </span>
            <p className="font-serif italic text-lg text-ink leading-snug">
              "{thesis.oneLineSummary}"
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
