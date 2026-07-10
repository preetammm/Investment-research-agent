import { motion } from 'framer-motion';
import type { StepId } from '../types/research';
import type { StepStatus } from '../hooks/useResearchStream';

interface InvestigationFlowProps {
  steps: Record<StepId, StepStatus>;
  companyName: string;
}

interface StepConfig {
  id: StepId;
  label: string;
}

const STEPS: StepConfig[] = [
  { id: 'finding_company', label: 'Finding company information' },
  { id: 'fetching_financials', label: 'Fetching financial metrics' },
  { id: 'reading_news', label: 'Reading latest news' },
  { id: 'checking_competitors', label: 'Checking the competitive landscape' },
  { id: 'merging_dossier', label: 'Merging into final dossier' },
  { id: 'identifying_risks', label: 'Identifying risk vectors' },
  { id: 'evaluating_health', label: 'Evaluating financial and moat health' },
  { id: 'building_thesis', label: 'Synthesizing investment thesis' },
  { id: 'final_recommendation', label: 'Formulating final recommendation' },
];

export const InvestigationFlow = ({ steps, companyName }: InvestigationFlowProps) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-xl mx-auto bg-paper border border-slate-light p-6 sm:p-8 text-left font-sans select-none rounded-sm shadow-sm"
    >
      {/* Dossier header metadata */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-slate-light pb-4 mb-6 font-mono text-[10px] tracking-widest text-ink-faint">
        <span>CASE FILE: #{companyName.toUpperCase().replace(/\s+/g, '_')}_INVESTIGATION</span>
        <span>STATUS: IN_PROGRESS</span>
      </div>

      <h2 className="font-serif italic text-2xl text-ink mb-6">
        Running background check on <span className="font-sans font-bold not-italic">{companyName}</span>...
      </h2>

      <div className="space-y-6">
        {STEPS.map((step, idx) => {
          const status = steps[step.id] || 'pending';

          return (
            <motion.div
              key={step.id}
              variants={itemVariants}
              className="flex items-center space-x-4"
            >
              {/* Status Circle indicator */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center relative">
                {status === 'pending' && (
                  <div className="w-4.5 h-4.5 rounded-full border border-ink/20 bg-transparent transition-all duration-300" />
                )}
                {status === 'active' && (
                  <>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-invest/20 animate-ping"></span>
                    <div className="relative w-4 h-4 rounded-full bg-invest flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-paper" />
                    </div>
                  </>
                )}
                {status === 'done' && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-5 h-5 rounded-full bg-watch/10 text-watch flex items-center justify-center font-bold text-xs"
                  >
                    ✓
                  </motion.div>
                )}
              </div>

              {/* Step label */}
              <div className="flex-grow">
                <span
                  className={`font-mono text-xs uppercase tracking-wider transition-colors duration-300 ${
                    status === 'active'
                      ? 'text-ink font-bold'
                      : status === 'done'
                      ? 'text-ink-soft line-through decoration-slate-light'
                      : 'text-ink-faint'
                  }`}
                >
                  {idx + 1}. {step.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
