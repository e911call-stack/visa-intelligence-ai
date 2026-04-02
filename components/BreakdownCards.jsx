'use client';
import { useEffect, useState } from 'react';
import { Eye, CheckSquare, Compass, DollarSign } from 'lucide-react';
import clsx from 'clsx';

const MODULES = {
  social:      { label: 'Social Media',  icon: Eye,         weight: '25%', desc: 'Online presence risk signals' },
  financial:   { label: 'Financial',      icon: DollarSign,  weight: '25%', desc: 'Funding strength & assets' },
  intent:      { label: 'Travel Intent',  icon: Compass,     weight: '30%', desc: 'Return probability signals' },
  consistency: { label: 'Consistency',    icon: CheckSquare, weight: '20%', desc: 'Application truthfulness' },
};

function getBarColor(score) {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#F5B800';
  return '#ef4444';
}

function ScoreBar({ score, delay = 0 }) {
  const [width, setWidth] = useState(0);
  const color = getBarColor(score);

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), delay + 200);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div className="relative h-1.5 rounded-full bg-navy-600 overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full rounded-full"
        style={{
          width: `${width}%`,
          backgroundColor: color,
          transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
          boxShadow: `0 0 8px ${color}60`,
        }}
      />
    </div>
  );
}

export default function BreakdownCards({ breakdown }) {
  if (!breakdown) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Object.entries(MODULES).map(([key, meta], i) => {
        const data = breakdown[key];
        if (!data) return null;
        const Icon = meta.icon;
        const score = data.score ?? 0;
        const color = getBarColor(score);

        return (
          <div key={key}
            className="card border border-navy-500/60 hover:border-navy-400/60
                       transition-all duration-300 group"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: color + '18', border: `1px solid ${color}30` }}>
                  <Icon size={16} style={{ color }} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm text-slate-text">{meta.label}</p>
                  <p className="text-xs text-slate-muted">{meta.desc}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-xl" style={{ color }}>
                  {score}
                </span>
                <span className="font-mono text-slate-muted text-xs">/100</span>
              </div>
            </div>

            {/* Bar */}
            <ScoreBar score={score} delay={i * 100} />

            {/* Meta */}
            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="text-slate-muted font-mono">Weight: {meta.weight}</span>
              <span className="font-mono" style={{ color }}>
                +{data.weighted ?? Math.round(score * parseFloat(meta.weight) / 100)}pts
              </span>
            </div>

            {/* Extra info per module */}
            {key === 'intent' && data.recommended_visa_duration && (
              <div className="mt-3 pt-3 border-t border-navy-500/40 text-xs text-slate-muted">
                Suggested duration: <span className="text-slate-text capitalize">{data.recommended_visa_duration}</span>
              </div>
            )}
            {key === 'financial' && data.strength && (
              <div className="mt-3 pt-3 border-t border-navy-500/40 text-xs text-slate-muted">
                Financial strength: <span className="text-slate-text capitalize">{data.strength}</span>
              </div>
            )}
            {key === 'social' && data.data_availability && (
              <div className="mt-3 pt-3 border-t border-navy-500/40 text-xs text-slate-muted">
                Data availability: <span className="text-slate-text capitalize">{data.data_availability}</span>
              </div>
            )}
            {key === 'consistency' && (
              <div className="mt-3 pt-3 border-t border-navy-500/40 text-xs text-slate-muted">
                Inconsistencies: <span className={clsx(
                  data.inconsistencies_count > 0 ? 'text-amber-400' : 'text-green-400'
                )}>{data.inconsistencies_count}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
