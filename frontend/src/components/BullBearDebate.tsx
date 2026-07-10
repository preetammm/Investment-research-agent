import type { BullBearCase, DebatePoint } from '../types/research';

interface BullBearDebateProps {
  debate: BullBearCase;
}

const PointsList = ({
  points,
  accentColor,
}: {
  points: DebatePoint[];
  accentColor: string;
}) => (
  <div className="space-y-5">
    {points.map((p, idx) => (
      <div key={idx} className="space-y-1">
        <p className={`text-sm font-serif leading-relaxed ${accentColor}`}>
          {p.point}
        </p>
        <p className="font-mono text-[10px] text-ink-faint leading-snug">
          — {p.basedOn}
        </p>
      </div>
    ))}
  </div>
);

export const BullBearDebate = ({ debate }: BullBearDebateProps) => {
  const hasBull = debate.bullCase && debate.bullCase.length > 0;
  const hasBear = debate.bearCase && debate.bearCase.length > 0;

  if (!hasBull && !hasBear) return null;

  return (
    <section className="w-full text-left space-y-6">
      {/* Section header */}
      <div className="border-b border-slate-light pb-3 font-mono text-[10px] tracking-widest text-ink-faint uppercase">
        BULL VS. BEAR
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Bull Case */}
        <div>
          <h4 className="font-serif italic text-lg text-invest mb-4">
            The case for
          </h4>
          {hasBull ? (
            <PointsList points={debate.bullCase} accentColor="text-ink-soft" />
          ) : (
            <p className="text-xs text-ink-faint italic">No bull case provided</p>
          )}
        </div>

        {/* Bear Case */}
        <div>
          <h4 className="font-serif italic text-lg text-pass mb-4">
            The case against
          </h4>
          {hasBear ? (
            <PointsList points={debate.bearCase} accentColor="text-ink-soft" />
          ) : (
            <p className="text-xs text-ink-faint italic">No bear case provided</p>
          )}
        </div>
      </div>
    </section>
  );
};
