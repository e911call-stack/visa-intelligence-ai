'use client';
import { useEffect, useState, useRef } from 'react';

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_RATIO = 0.75; // 270deg arc
const ARC_LENGTH = CIRCUMFERENCE * ARC_RATIO;

function getScoreColor(score) {
  if (score >= 70) return '#22c55e';   // green
  if (score >= 40) return '#F5B800';   // gold/amber
  return '#ef4444';                    // red
}

function getRiskLabel(score) {
  if (score >= 70) return { label: 'LOW RISK', color: '#22c55e' };
  if (score >= 40) return { label: 'MEDIUM RISK', color: '#F5B800' };
  return { label: 'HIGH RISK', color: '#ef4444' };
}

export default function ScoreGauge({ score = 0, size = 240, animate = true }) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score);
  const [filled, setFilled] = useState(animate ? 0 : score);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!animate || hasAnimated.current) return;
    hasAnimated.current = true;

    // Count up number
    let start = null;
    const duration = 1600;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(ease * score));
      setFilled(ease * score);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [score, animate]);

  const strokeColor = getScoreColor(displayed);
  const risk = getRiskLabel(displayed);

  // SVG arc calculation
  const offset = ARC_LENGTH - (filled / 100) * ARC_LENGTH;
  const cx = size / 2;
  const cy = size / 2;
  const rotation = 135; // start angle
  const strokeW = size * 0.055;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background glow */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle
            cx={cx} cy={cy} r={RADIUS}
            fill="none"
            stroke="rgba(28,45,74,0.7)"
            strokeWidth={strokeW}
            strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
          />

          {/* Fill */}
          <circle
            cx={cx} cy={cy} r={RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
            strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            filter="url(#glow)"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'stroke 0.5s ease',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center"
             style={{ transform: 'none' }}>
          <span
            className="font-mono font-bold tabular-nums leading-none"
            style={{ fontSize: size * 0.22, color: strokeColor }}
          >
            {displayed}
          </span>
          <span className="font-mono text-slate-muted uppercase tracking-widest"
                style={{ fontSize: size * 0.06 }}>
            / 100
          </span>
        </div>
      </div>

      {/* Risk badge */}
      <div
        className="flex items-center gap-2 px-4 py-1.5 rounded-full border font-mono text-xs font-semibold tracking-widest"
        style={{
          color: risk.color,
          borderColor: risk.color + '40',
          backgroundColor: risk.color + '12',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: risk.color }} />
        {risk.label}
      </div>
    </div>
  );
}
