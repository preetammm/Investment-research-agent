import { motion } from 'framer-motion';

interface StoryReportProps {
  narrative: string;
}

export const StoryReport = ({ narrative }: StoryReportProps) => {
  // Split narrative by double newlines into distinct paragraphs
  const paragraphs = narrative
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Stagger animation container config for scroll triggers
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.25,
      },
    },
  };

  const paragraphVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const, // easeOutExpo
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      className="w-full bg-paper border border-slate-light p-8 rounded-sm shadow-sm text-left select-none space-y-6"
    >
      <div className="border-b border-slate-light pb-3 font-mono text-[10px] tracking-widest text-ink-faint uppercase">
        ANALYST_NARRATIVE // DEEP_DIVE
      </div>

      <div className="space-y-5">
        {paragraphs.map((para, idx) => (
          <motion.p
            key={idx}
            variants={paragraphVariants}
            className={`font-serif text-base md:text-lg text-ink-soft leading-relaxed ${
              idx === 0
                ? 'first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:text-ink first-letter:leading-none'
                : ''
            }`}
          >
            {para}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
};
