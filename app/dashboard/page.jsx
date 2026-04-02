'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import { listAnalyses, deleteAnalysis } from '../../lib/api';
import {
  Plus, FileText, Trash2, ChevronRight, Loader2, AlertTriangle,
  TrendingUp, Clock, BarChart3, Shield
} from 'lucide-react';
import clsx from 'clsx';

function getRiskColor(level) {
  if (level === 'low') return { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' };
  if (level === 'medium') return { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' };
  return { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' };
}

function AnalysisCard({ analysis, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const { token } = useAuth();
  const risk = getRiskColor(analysis.risk_level);

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this analysis? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteAnalysis(analysis.id, token);
      onDelete(analysis.id);
    } catch { setDeleting(false); }
  };

  const createdAt = new Date(analysis.created_at);
  const dateStr = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <Link href={`/report/${analysis.id}`}
      className="card border border-navy-500/50 hover:border-navy-400/70
                 hover:-translate-y-0.5 transition-all duration-200 group block">
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-display font-semibold text-slate-text truncate">
              {analysis.nationality || '—'} → {analysis.destination_country || '—'}
            </p>
            {analysis.status === 'processing' && (
              <Loader2 size={13} className="text-gold-400 animate-spin shrink-0" />
            )}
            {analysis.status === 'failed' && (
              <AlertTriangle size={13} className="text-red-400 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-muted">
            <Clock size={11} />
            <span>{dateStr} at {timeStr}</span>
          </div>
        </div>

        {/* Score + risk */}
        {analysis.overall_score != null ? (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="font-mono font-bold text-2xl text-gold-400">
                {analysis.overall_score}
              </div>
              <div className="text-xs text-slate-muted font-mono">/100</div>
            </div>
            {analysis.risk_level && (
              <span className={clsx(
                'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border',
                risk.text, risk.bg, risk.border
              )}>
                {analysis.risk_level}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-muted capitalize shrink-0">{analysis.status}</span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <ChevronRight size={16} className="text-slate-muted group-hover:text-gold-400
                                              group-hover:translate-x-0.5 transition-all" />
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-muted
                       hover:text-red-400 transition-colors ml-1"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Approval bar */}
      {analysis.approval_probability != null && (
        <div className="mt-4 pt-4 border-t border-navy-500/40">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-muted">Approval probability</span>
            <span className="font-mono text-gold-400 font-bold">{analysis.approval_probability}%</span>
          </div>
          <div className="h-1 rounded-full bg-navy-600 overflow-hidden">
            <div
              className="h-full rounded-full bg-gold-400"
              style={{ width: `${analysis.approval_probability}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}

function DashboardContent() {
  const { user, loading: authLoading, token } = useAuth();
  const router = useRouter();

  const [analyses, setAnalyses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
  }, [user, authLoading]);

  const fetchAnalyses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await listAnalyses(token, page);
      setAnalyses(data.data || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => { fetchAnalyses(); }, [fetchAnalyses]);

  const handleDelete = (id) => setAnalyses((prev) => prev.filter((a) => a.id !== id));

  // Stats
  const completed = analyses.filter((a) => a.overall_score != null);
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, a) => s + a.overall_score, 0) / completed.length)
    : null;
  const avgProb = completed.length
    ? Math.round(completed.reduce((s, a) => s + (a.approval_probability || 0), 0) / completed.length)
    : null;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gold-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="section-label mb-2">Your Account</p>
            <h1 className="font-display font-bold text-3xl">Dashboard</h1>
            <p className="text-slate-muted mt-1 text-sm">{user?.email}</p>
          </div>
          <Link href="/analyze" className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            New Analysis
          </Link>
        </div>

        {/* Stats row */}
        {completed.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: FileText, label: 'Total Analyses', val: pagination?.total ?? analyses.length },
              { icon: BarChart3, label: 'Avg Score', val: avgScore != null ? `${avgScore}/100` : '—' },
              { icon: TrendingUp, label: 'Avg Approval', val: avgProb != null ? `${avgProb}%` : '—' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="card border border-navy-500/50 text-center">
                  <Icon size={16} className="text-gold-400 mx-auto mb-2" />
                  <div className="font-mono font-bold text-xl text-slate-text">{s.val}</div>
                  <div className="text-xs text-slate-muted mt-0.5">{s.label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-gold-400" />
          </div>
        ) : error ? (
          <div className="card border border-red-500/30 bg-red-500/5 text-center py-12">
            <AlertTriangle size={24} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-medium">{error}</p>
            <button onClick={fetchAnalyses} className="btn-ghost mt-4 text-sm">Retry</button>
          </div>
        ) : analyses.length === 0 ? (
          <div className="card border border-navy-500/40 text-center py-16">
            <Shield size={40} className="text-navy-500 mx-auto mb-4" />
            <h3 className="font-display font-bold text-xl mb-2">No analyses yet</h3>
            <p className="text-slate-muted mb-6">Run your first visa assessment to see results here.</p>
            <Link href="/analyze" className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> Start Your First Analysis
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((a) => (
              <AnalysisCard key={a.id} analysis={a} onDelete={handleDelete} />
            ))}

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-ghost text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="flex items-center px-4 text-sm text-slate-muted font-mono">
                  {page} / {pagination.total_pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                  disabled={page === pagination.total_pages}
                  className="btn-ghost text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <div className="bg-navy-900 min-h-screen">
        <Navbar />
        <DashboardContent />
      </div>
    </AuthProvider>
  );
}
