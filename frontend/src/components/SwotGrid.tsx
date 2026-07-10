import type { SwotAnalysis } from '../types/research';

interface SwotGridProps {
  swot: SwotAnalysis;
}

const quadrants: {
  key: keyof SwotAnalysis;
  title: string;
  borderColor: string;
}[] = [
  { key: 'strengths', title: 'Strengths', borderColor: 'border-invest' },
  { key: 'weaknesses', title: 'Weaknesses', borderColor: 'border-pass' },
  { key: 'opportunities', title: 'Opportunities', borderColor: 'border-watch' },
  { key: 'threats', title: 'Threats', borderColor: 'border-slate' },
];

export const SwotGrid = ({ swot }: SwotGridProps) => {
  return (
    <section className="w-full text-left space-y-6">
      {/* Section header */}
      <div className="border-b border-slate-light pb-3 font-mono text-[10px] tracking-widest text-ink-faint uppercase">
        SWOT
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quadrants.map((q) => {
          const items = swot[q.key];
          return (
            <div
              key={q.key}
              className={`border-l-4 ${q.borderColor} pl-5 py-2`}
            >
              <h4 className="font-mono text-xs tracking-wider text-ink-faint uppercase mb-3">
                {q.title}
              </h4>
              {items && items.length > 0 ? (
                <ul className="space-y-2">
                  {items.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-ink-soft font-serif leading-relaxed flex items-start gap-2"
                    >
                      <span className="text-ink-faint select-none mt-0.5 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-ink-faint italic">No data available</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
