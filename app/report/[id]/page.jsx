'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '../../../hooks/useAuth';
import Navbar from '../../../components/Navbar';
import ScoreGauge from '../../../components/ScoreGauge';
import BreakdownCards from '../../../components/BreakdownCards';
import { FlagsPanel, RecommendationsPanel } from '../../../components/ReportPanels';
import { getReport } from '../../../lib/api';
import {
  ArrowLeft, Download, RefreshCw, Loader2, AlertTriangle,
  FileText, CheckCircle, Shield, Info, Clipboard, Clock
} from 'lucide-react';
import clsx from 'clsx';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="btn-ghost text-xs flex items-center gap-1.5 py-1.5">
      {copied ? <CheckCircle size={13} className="text-green-400" /> : <Clipboard size={13} />}
      {copied ? 'Copied' : 'Copy ID'}
    </button>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
        <Icon size={15} className="text-gold-400" />
      </div>
      <div>
        <h2 className="font-display font-bold text-lg">{title}</h2>
        {subtitle && <p className="text-xs text-slate-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

function ReportContent({ params }) {
  const { id } = use(params);
  const { user, loading: authLoading, token } = useAuth();
  const router = useRouter();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
  }, [user, authLoading]);

  const fetchReport = async () => {
    if (!token || !id) return;
    try {
      const data = await getReport(id, token);

      if (data.status === 'processing' || data.status === 'pending') {
        setPolling(true);
        setTimeout(fetchReport, 3000); // Poll every 3 seconds
        return;
      }

      setPolling(false);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [token, id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-gold-400 mx-auto mb-4" />
          <p className="text-slate-muted font-mono text-sm">
            {polling ? 'Analyzing your profile…' : 'Loading report…'}
          </p>
          {polling && (
            <p className="text-slate-dim text-xs mt-2">AI modules running in parallel</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card border border-red-500/30 bg-red-500/5 text-center p-10 max-w-md">
          <AlertTriangle size={32} className="text-red-400 mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">Failed to Load</h2>
          <p className="text-slate-muted text-sm mb-6">{error}</p>
          <div className="flex justify-center gap-3">
            <button onClick={fetchReport} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw size={14} /> Retry
            </button>
            <Link href="/dashboard" className="btn-ghost text-sm">← Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const { result, report: reportData, applicant_summary } = report;

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-slate-muted
                         hover:text-slate-text transition-colors mb-4 group">
              <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
              Dashboard
            </Link>
            <p className="section-label mb-2">Assessment Report</p>
            <h1 className="font-display font-bold text-3xl">
              {applicant_summary?.nationality || '—'} → {applicant_summary?.destination_country || '—'}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-slate-muted flex items-center gap-1.5">
                <Clock size={11} />
                {new Date(report.created_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </span>
              <CopyButton text={id} />
            </div>
          </div>

          <Link href="/analyze" className="btn-secondary text-sm shrink-0 hidden sm:flex items-center gap-2">
            <FileText size={14} /> New Analysis
          </Link>
        </div>

        {/* ─── HERO SCORE ─── */}
        <div className="card border border-navy-500/60 mb-6 p-8">
          <div className="grid md:grid-cols-3 gap-8 items-center">

            {/* Gauge */}
            <div className="flex justify-center">
              <ScoreGauge score={result?.overall_score ?? 0} size={200} animate />
            </div>

            {/* Summary stats */}
            <div className="md:col-span-2 space-y-5">
              <div>
                <p className="section-label mb-2">Visa Approval Probability</p>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono font-bold text-5xl text-gold-400">
                    {result?.approval_probability ?? 0}%
                  </span>
                  <span className="text-slate-muted text-sm">estimated approval chance</span>
                </div>
                <div className="h-2 rounded-full bg-navy-600 overflow-hidden mt-3">
                  <div
                    className="h-full rounded-full bg-gold-400 transition-all duration-1000"
                    style={{ width: `${result?.approval_probability ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Overall Score', val: `${result?.overall_score ?? 0}/100`, mono: true },
                  { label: 'Confidence', val: `${result?.confidence ?? 0}%`, mono: true },
                  { label: 'Purpose', val: applicant_summary?.purpose_of_travel || '—', mono: false },
                  { label: 'Employment', val: applicant_summary?.employment_status?.replace('_',' ') || '—', mono: false },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-slate-muted mb-0.5">{item.label}</p>
                    <p className={clsx('font-semibold capitalize', item.mono ? 'font-mono text-gold-400' : 'text-slate-text')}>
                      {item.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Flags count */}
              {result?.flags?.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-400">
                  <AlertTriangle size={14} />
                  {result.flags.length} risk flag{result.flags.length !== 1 ? 's' : ''} identified
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── AI SUMMARY ─── */}
        {reportData && (
          <div className="card border border-navy-500/60 mb-6">
            <SectionTitle icon={FileText} title="Executive Summary" subtitle="AI-generated assessment" />
            <p className="text-slate-muted leading-relaxed text-sm">
              {reportData.executive_summary}
            </p>
            {reportData.strength_summary && (
              <div className="mt-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <p className="text-xs font-mono text-green-400 uppercase tracking-wider mb-1">What Is Working in Your Favor</p>
                <p className="text-sm text-slate-text">{reportData.strength_summary}</p>
              </div>
            )}
          </div>
        )}

        {/* ─── SCORE BREAKDOWN ─── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
              <Shield size={15} className="text-gold-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Module Breakdown</h2>
              <p className="text-xs text-slate-muted">Weighted scores from each analysis module</p>
            </div>
          </div>
          <BreakdownCards breakdown={result?.breakdown} />
        </div>

        {/* ─── KEY RISKS ─── */}
        {reportData?.key_risks?.length > 0 && (
          <div className="card border border-navy-500/60 mb-6">
            <SectionTitle icon={AlertTriangle} title="Key Risk Factors" subtitle="Issues requiring attention" />
            <div className="space-y-3">
              {reportData.key_risks.map((risk, i) => {
                const severityColors = {
                  critical: 'text-red-400 border-red-400/30 bg-red-400/5',
                  high:     'text-orange-400 border-orange-400/30 bg-orange-400/5',
                  medium:   'text-amber-400 border-amber-400/30 bg-amber-400/5',
                  low:      'text-blue-400 border-blue-400/30 bg-blue-400/5',
                };
                const cls = severityColors[risk.severity] || severityColors.medium;
                return (
                  <div key={i} className={clsx('p-4 rounded-xl border', cls)}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-display font-semibold text-sm">{risk.risk}</p>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 opacity-70">
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-muted leading-relaxed mb-2">{risk.description}</p>
                    {risk.mitigation && (
                      <div className="flex items-start gap-2 text-xs">
                        <CheckCircle size={12} className="mt-0.5 shrink-0 opacity-60" />
                        <span className="opacity-80">{risk.mitigation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── FLAGS ─── */}
        <div className="card border border-navy-500/60 mb-6">
          <SectionTitle
            icon={AlertTriangle}
            title="Risk Flags"
            subtitle={`${result?.flags?.length ?? 0} signals identified across all modules`}
          />
          <FlagsPanel flags={result?.flags ?? []} />
        </div>

        {/* ─── RECOMMENDATIONS ─── */}
        <div className="card border border-navy-500/60 mb-6">
          <SectionTitle
            icon={CheckCircle}
            title="Recommendations"
            subtitle="Actions to strengthen your application"
          />
          <RecommendationsPanel
            recommendations={
              reportData?.recommendations?.length
                ? reportData.recommendations
                : result?.recommendations ?? []
            }
          />
        </div>

        {/* ─── NEXT STEPS ─── */}
        {reportData?.next_steps?.length > 0 && (
          <div className="card border border-gold-400/20 bg-gold-400/4 mb-6">
            <SectionTitle icon={CheckCircle} title="Immediate Next Steps" />
            <ol className="space-y-2">
              {reportData.next_steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="font-mono text-gold-400 font-bold shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  <span className="text-slate-text">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ─── DISCLAIMER ─── */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-navy-800/50 border border-navy-500/30">
          <Info size={14} className="text-slate-muted shrink-0 mt-0.5" />
          <p className="text-xs text-slate-muted leading-relaxed">
            {reportData?.disclaimer ||
              'This assessment is AI-generated and for informational purposes only. Consult a licensed immigration attorney for legal advice.'}
          </p>
        </div>

        {/* ─── ACTIONS ─── */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-8 border-t border-navy-700">
          <Link href="/analyze" className="btn-primary flex items-center justify-center gap-2">
            <FileText size={15} /> Run New Analysis
          </Link>
          <Link href="/dashboard" className="btn-secondary flex items-center justify-center gap-2">
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage({ params }) {
  return (
    <AuthProvider>
      <div className="bg-navy-900 min-h-screen">
        <Navbar />
        <ReportContent params={params} />
      </div>
    </AuthProvider>
  );
}
