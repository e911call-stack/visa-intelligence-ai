'use client';
import { AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const MODULE_COLORS = {
  social:      'text-blue-400 bg-blue-400/10 border-blue-400/20',
  financial:   'text-amber-400 bg-amber-400/10 border-amber-400/20',
  intent:      'text-purple-400 bg-purple-400/10 border-purple-400/20',
  consistency: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const PRIORITY_CONFIG = {
  urgent:    { label: 'Urgent',    cls: 'text-red-400 bg-red-400/10 border-red-400/30' },
  important: { label: 'Important', cls: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  optional:  { label: 'Optional',  cls: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
};

export function FlagsPanel({ flags = [] }) {
  if (!flags.length) {
    return (
      <div className="card border border-green-500/20 bg-green-500/5">
        <div className="flex items-center gap-3">
          <CheckCircle size={20} className="text-green-400 shrink-0" />
          <div>
            <p className="font-display font-semibold text-green-400">No flags raised</p>
            <p className="text-sm text-slate-muted">Your profile did not trigger any significant risk indicators.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {flags.map((f, i) => {
        const moduleStyle = MODULE_COLORS[f.module] || 'text-slate-muted bg-navy-700 border-navy-500';
        return (
          <div key={i}
            className="flex items-start gap-3 p-4 rounded-xl border border-red-500/15 bg-red-500/5
                       hover:border-red-500/25 transition-colors">
            <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-text leading-relaxed">{f.flag}</p>
            </div>
            <span className={clsx('shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider', moduleStyle)}>
              {f.module}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function RecommendationsPanel({ recommendations = [] }) {
  // Handle both string[] and {priority, action, reason}[]
  const normalized = recommendations.map((r) =>
    typeof r === 'string'
      ? { priority: 'important', action: r, reason: '' }
      : r
  );

  if (!normalized.length) {
    return (
      <div className="card border border-navy-500/60 text-slate-muted text-sm">
        No specific recommendations at this time.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {normalized.map((rec, i) => {
        const cfg = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.important;
        return (
          <div key={i}
            className="flex items-start gap-3 p-4 rounded-xl border border-navy-500/50
                       bg-navy-800/40 hover:border-navy-400/50 transition-colors group">
            <ChevronRight size={16} className="text-gold-400 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-text font-medium leading-relaxed">{rec.action}</p>
              {rec.reason && (
                <p className="text-xs text-slate-muted mt-1">{rec.reason}</p>
              )}
            </div>
            <span className={clsx('shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded border', cfg.cls)}>
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
