import { motion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import type { ScoreCard } from '../types/research';

interface EvidenceDashboardProps {
  scores: ScoreCard;
}

const DIMENSIONS: { key: keyof ScoreCard; label: string; invert?: boolean }[] = [
  { key: 'marketOpportunity', label: 'Market Opportunity' },
  { key: 'financialHealth', label: 'Financial Health' },
  { key: 'executionTeam', label: 'Execution' },
  { key: 'competitiveMoat', label: 'Moat' },
  { key: 'riskLevel', label: 'Risk', invert: true },
];

export const EvidenceDashboard = ({ scores }: EvidenceDashboardProps) => {
  // Build radar data — invert risk so higher = better on chart
  const radarData = DIMENSIONS.map((d) => ({
    dimension: d.label,
    value: d.invert ? 10 - scores[d.key] : scores[d.key],
  }));

  // Build progress bar data — show raw scores for all, except risk which is inverted
  const barData = DIMENSIONS.map((d) => {
    const raw = scores[d.key];
    const display = d.invert ? 10 - raw : raw;
    return {
      label: d.label,
      // Percentage out of 10
      pct: Math.round((display / 10) * 100),
      raw: display,
    };
  });

  return (
    <section className="w-full text-left space-y-6">
      {/* Section header */}
      <div className="border-b border-slate-light pb-3 font-mono text-[10px] tracking-widest text-ink-faint uppercase">
        EVIDENCE DASHBOARD
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        {/* Radar chart */}
        <div className="w-full md:w-1/2 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#E7EAF0" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 11, fill: '#4A4E57', fontFamily: 'Inter, sans-serif' }}
              />
              <PolarRadiusAxis
                domain={[0, 10]}
                tickCount={6}
                tick={{ fontSize: 9, fill: '#8A8D96' }}
                axisLine={false}
              />
              <Radar
                name="Scores"
                dataKey="value"
                stroke="#B8873D"
                fill="#B8873D"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Progress bars */}
        <div className="w-full md:w-1/2 space-y-4">
          {barData.map((item, idx) => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-ink-soft font-sans">
                  {item.label}
                  {DIMENSIONS[idx].invert && (
                    <span className="text-ink-faint text-[10px] ml-1">(inverted)</span>
                  )}
                </span>
                <span className="font-mono text-xs text-ink-faint">{item.raw}/10</span>
              </div>
              <div className="w-full h-2 bg-slate-light rounded-sm overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                  className="h-full bg-invest rounded-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
