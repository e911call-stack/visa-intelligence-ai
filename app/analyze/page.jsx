'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import { submitAnalysis } from '../../lib/api';
import {
  Globe, Briefcase, DollarSign, Plane, User, MessageSquare,
  Plus, Trash2, ChevronRight, ChevronLeft, Loader2, CheckCircle,
  ArrowLeft, Shield
} from 'lucide-react';
import clsx from 'clsx';

// ─── FORM DEFAULTS ────────────────────────────────────────────
const INITIAL_DATA = {
  nationality: '',
  destination_country: '',
  purpose_of_travel: 'tourism',
  employment_status: 'employed',
  income: { amount: '', currency: 'USD', frequency: 'monthly' },
  assets: { property: false, savings_usd: '', business_ownership: false },
  travel_history: [],
  profile_text: '',
  social_media_data: {
    platforms: [],
    posts_per_week: '',
    topics: [],
    public_profile: true,
    bio_snippet: '',
    flags: [],
  },
};

const STEPS = [
  { id: 1, label: 'Basic Info', icon: Globe },
  { id: 2, label: 'Employment', icon: Briefcase },
  { id: 3, label: 'Travel History', icon: Plane },
  { id: 4, label: 'Your Profile', icon: User },
  { id: 5, label: 'Social Media', icon: MessageSquare },
];

const PURPOSES = ['tourism', 'business', 'study', 'work', 'medical', 'transit', 'family', 'other'];
const EMPLOYMENT_STATUSES = ['employed', 'self_employed', 'unemployed', 'student', 'retired', 'other'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NGN', 'INR', 'PKR', 'EGP', 'AED', 'SAR', 'GHS', 'KES', 'ZAR', 'BRL', 'MXN', 'JPY', 'CNY', 'KRW'];
const PLATFORMS = ['LinkedIn', 'Twitter/X', 'Instagram', 'Facebook', 'TikTok', 'YouTube', 'Reddit'];

// ─── STEP COMPONENTS ─────────────────────────────────────────

function StepBasicInfo({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm text-slate-muted mb-2 font-medium">Nationality *</label>
          <input
            className="input-field"
            placeholder="e.g. Nigerian, Indian, Brazilian"
            value={data.nationality}
            onChange={(e) => onChange('nationality', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-muted mb-2 font-medium">Destination Country *</label>
          <input
            className="input-field"
            placeholder="e.g. United States, United Kingdom"
            value={data.destination_country}
            onChange={(e) => onChange('destination_country', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-muted mb-2 font-medium">Purpose of Travel *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PURPOSES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange('purpose_of_travel', p)}
              className={clsx(
                'py-2.5 px-3 rounded-lg border text-sm font-medium capitalize transition-all duration-150',
                data.purpose_of_travel === p
                  ? 'border-gold-400/60 bg-gold-400/10 text-gold-400'
                  : 'border-navy-500/50 text-slate-muted hover:border-navy-400/60 hover:text-slate-text'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepEmployment({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-slate-muted mb-3 font-medium">Employment Status *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {EMPLOYMENT_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange('employment_status', s)}
              className={clsx(
                'py-2.5 px-3 rounded-lg border text-sm font-medium capitalize transition-all duration-150',
                data.employment_status === s
                  ? 'border-gold-400/60 bg-gold-400/10 text-gold-400'
                  : 'border-navy-500/50 text-slate-muted hover:border-navy-400/60 hover:text-slate-text'
              )}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-muted mb-2 font-medium">Income *</label>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <input
              type="number"
              className="input-field"
              placeholder="Amount"
              min="0"
              value={data.income.amount}
              onChange={(e) => onChange('income', { ...data.income, amount: e.target.value })}
            />
          </div>
          <select
            className="select-field"
            value={data.income.currency}
            onChange={(e) => onChange('income', { ...data.income, currency: e.target.value })}
          >
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-3 mt-3">
          {['monthly', 'annual'].map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => onChange('income', { ...data.income, frequency: freq })}
              className={clsx(
                'flex-1 py-2 rounded-lg border text-sm capitalize transition-all',
                data.income.frequency === freq
                  ? 'border-gold-400/60 bg-gold-400/10 text-gold-400'
                  : 'border-navy-500/50 text-slate-muted hover:border-navy-400/50'
              )}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-muted mb-3 font-medium">Assets</label>
        <div className="space-y-3">
          {[
            { key: 'property', label: 'I own property in my home country' },
            { key: 'business_ownership', label: 'I own a business' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => onChange('assets', { ...data.assets, [key]: !data.assets[key] })}
                className={clsx(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                  data.assets[key]
                    ? 'border-gold-400 bg-gold-400'
                    : 'border-navy-400 group-hover:border-navy-300'
                )}
              >
                {data.assets[key] && <CheckCircle size={12} className="text-navy-900" />}
              </div>
              <span className="text-sm text-slate-text">{label}</span>
            </label>
          ))}
          <div>
            <label className="block text-xs text-slate-muted mb-1.5">Savings (USD equivalent)</label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 15000"
              min="0"
              value={data.assets.savings_usd}
              onChange={(e) => onChange('assets', { ...data.assets, savings_usd: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepTravelHistory({ data, onChange }) {
  const history = data.travel_history || [];

  const addEntry = () => {
    onChange('travel_history', [
      ...history,
      { country: '', year: new Date().getFullYear() - 1, duration_days: '', visa_type: 'tourist', refused: false }
    ]);
  };

  const updateEntry = (i, field, val) => {
    const updated = history.map((entry, idx) => idx === i ? { ...entry, [field]: val } : entry);
    onChange('travel_history', updated);
  };

  const removeEntry = (i) => {
    onChange('travel_history', history.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-4">
      <p className="text-slate-muted text-sm">
        List all countries you have visited in the last 10 years. Include any visa refusals.
      </p>

      {history.length === 0 ? (
        <div className="card border border-navy-500/40 text-center py-8 border-dashed">
          <Plane size={24} className="text-navy-500 mx-auto mb-3" />
          <p className="text-slate-muted text-sm mb-4">No travel history added</p>
          <button type="button" onClick={addEntry} className="btn-secondary text-sm">
            <Plus size={14} className="inline mr-1" /> Add First Trip
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry, i) => (
            <div key={i} className="card border border-navy-500/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-muted">Trip #{i + 1}</span>
                <button type="button" onClick={() => removeEntry(i)}
                  className="text-slate-muted hover:text-red-400 transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-muted mb-1">Country</label>
                  <input className="input-field text-sm py-2" placeholder="e.g. France"
                    value={entry.country}
                    onChange={(e) => updateEntry(i, 'country', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-muted mb-1">Year</label>
                  <input type="number" className="input-field text-sm py-2"
                    min="1970" max={new Date().getFullYear()}
                    value={entry.year}
                    onChange={(e) => updateEntry(i, 'year', parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-muted mb-1">Duration (days)</label>
                  <input type="number" className="input-field text-sm py-2" placeholder="14"
                    value={entry.duration_days}
                    onChange={(e) => updateEntry(i, 'duration_days', parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-muted mb-1">Visa Type</label>
                  <select className="select-field text-sm py-2"
                    value={entry.visa_type}
                    onChange={(e) => updateEntry(i, 'visa_type', e.target.value)}>
                    {['tourist', 'business', 'student', 'work', 'transit', 'schengen', 'other'].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={entry.refused}
                  onChange={(e) => updateEntry(i, 'refused', e.target.checked)}
                  className="w-4 h-4 accent-amber-400" />
                <span className="text-sm text-amber-400">Visa was refused / denied</span>
              </label>
            </div>
          ))}
          <button type="button" onClick={addEntry} className="btn-ghost text-sm w-full border border-dashed border-navy-500/50 rounded-xl py-3">
            <Plus size={14} className="inline mr-1" /> Add Another Trip
          </button>
        </div>
      )}
    </div>
  );
}

function StepProfile({ data, onChange }) {
  const count = data.profile_text.length;
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-slate-muted mb-2 font-medium">
          Tell Us About Yourself *
        </label>
        <p className="text-xs text-slate-dim mb-3">
          Describe your situation honestly: your job, family, reasons for traveling, return plans, and any supporting details.
          The more specific, the more accurate your assessment.
        </p>
        <div className="relative">
          <textarea
            className="input-field resize-none"
            rows={8}
            placeholder="Example: I am a senior software engineer at TechCorp Nigeria Ltd. I'm traveling to the US for a 2-week conference in San Francisco. I have a return flight booked for July 20th, my wife and two children remain in Lagos, and I own a home in Lekki. I have previously visited the UK and France and returned on schedule..."
            value={data.profile_text}
            onChange={(e) => onChange('profile_text', e.target.value)}
            minLength={10}
            maxLength={3000}
          />
          <div className={clsx(
            'absolute bottom-3 right-3 text-xs font-mono',
            count < 50 ? 'text-red-400' : count > 2500 ? 'text-amber-400' : 'text-slate-dim'
          )}>
            {count}/3000
          </div>
        </div>
        {count > 0 && count < 50 && (
          <p className="text-xs text-red-400 mt-1.5">Please provide at least 50 characters for an accurate assessment</p>
        )}
      </div>
    </div>
  );
}

function StepSocialMedia({ data, onChange }) {
  const social = data.social_media_data;
  const togglePlatform = (p) => {
    const current = social.platforms || [];
    const updated = current.includes(p) ? current.filter((x) => x !== p) : [...current, p];
    onChange('social_media_data', { ...social, platforms: updated });
  };

  return (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-navy-700/50 border border-navy-500/40 text-sm text-slate-muted">
        Social media data is <strong className="text-slate-text">optional</strong>.
        If skipped, we apply a neutral score. Providing it helps us give you a more accurate assessment.
      </div>

      <div>
        <label className="block text-sm text-slate-muted mb-3 font-medium">Active Platforms</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PLATFORMS.map((p) => {
            const active = (social.platforms || []).includes(p);
            return (
              <button key={p} type="button" onClick={() => togglePlatform(p)}
                className={clsx(
                  'py-2 px-3 rounded-lg border text-sm transition-all',
                  active
                    ? 'border-gold-400/60 bg-gold-400/10 text-gold-400'
                    : 'border-navy-500/50 text-slate-muted hover:border-navy-400/50'
                )}>
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm text-slate-muted mb-2 font-medium">Posts per week (avg)</label>
          <input type="number" className="input-field" placeholder="3" min="0"
            value={social.posts_per_week}
            onChange={(e) => onChange('social_media_data', { ...social, posts_per_week: parseInt(e.target.value) || '' })} />
        </div>
        <div>
          <label className="block text-sm text-slate-muted mb-2 font-medium">Profile visibility</label>
          <div className="flex gap-3">
            {[true, false].map((v) => (
              <button key={String(v)} type="button"
                onClick={() => onChange('social_media_data', { ...social, public_profile: v })}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg border text-sm transition-all',
                  social.public_profile === v
                    ? 'border-gold-400/60 bg-gold-400/10 text-gold-400'
                    : 'border-navy-500/50 text-slate-muted hover:border-navy-400/50'
                )}>
                {v ? 'Public' : 'Private'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-muted mb-2 font-medium">
          Bio / Recent post content <span className="text-slate-dim">(optional)</span>
        </label>
        <textarea
          className="input-field resize-none"
          rows={4}
          placeholder="Paste your Twitter bio, LinkedIn headline, or a recent post that gives context about you..."
          value={social.bio_snippet}
          onChange={(e) => onChange('social_media_data', { ...social, bio_snippet: e.target.value })}
          maxLength={500}
        />
      </div>

      <div>
        <label className="block text-sm text-slate-muted mb-2 font-medium">Content topics <span className="text-slate-dim">(comma separated)</span></label>
        <input
          className="input-field"
          placeholder="e.g. technology, travel, family, finance"
          value={(social.topics || []).join(', ')}
          onChange={(e) => {
            const topics = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
            onChange('social_media_data', { ...social, topics });
          }}
        />
      </div>
    </div>
  );
}

// ─── MAIN FORM COMPONENT ─────────────────────────────────────

function AnalyzeContent() {
  const { user, loading: authLoading, token } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
  }, [user, authLoading]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.nationality.trim()) return 'Please enter your nationality';
      if (!formData.destination_country.trim()) return 'Please enter the destination country';
    }
    if (step === 2) {
      if (!formData.income.amount || Number(formData.income.amount) < 0) return 'Please enter a valid income';
    }
    if (step === 4) {
      if (formData.profile_text.length < 10) return 'Please provide a profile description (min 10 characters)';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => Math.min(5, s + 1));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);

    // Clean up payload
    const payload = {
      ...formData,
      income: {
        ...formData.income,
        amount: Number(formData.income.amount),
      },
      assets: {
        ...formData.assets,
        savings_usd: formData.assets.savings_usd ? Number(formData.assets.savings_usd) : 0,
      },
      travel_history: formData.travel_history.map((t) => ({
        ...t,
        duration_days: t.duration_days ? Number(t.duration_days) : undefined,
      })).filter((t) => t.country),
    };

    // Remove social if no data provided
    const hasSocial = formData.social_media_data.platforms.length > 0 ||
                      formData.social_media_data.bio_snippet.trim();
    if (!hasSocial) {
      delete payload.social_media_data;
    }

    try {
      const result = await submitAnalysis(payload, token);
      router.push(`/report/${result.analysis_id}`);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
      setSubmitting(false);
    }
  };

  const stepComponents = {
    1: <StepBasicInfo data={formData} onChange={updateField} />,
    2: <StepEmployment data={formData} onChange={updateField} />,
    3: <StepTravelHistory data={formData} onChange={updateField} />,
    4: <StepProfile data={formData} onChange={updateField} />,
    5: <StepSocialMedia data={formData} onChange={updateField} />,
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={28} className="animate-spin text-gold-400" />
    </div>;
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-muted
                                              hover:text-slate-text transition-colors mb-6 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>
          <p className="section-label mb-2">Visa Assessment</p>
          <h1 className="font-display font-bold text-3xl">New Analysis</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 shrink-0">
                <div className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  active ? 'bg-gold-400 text-navy-900 font-bold' :
                  done ? 'bg-green-400/15 text-green-400 border border-green-400/30' :
                  'bg-navy-700 text-slate-muted'
                )}>
                  {done ? <CheckCircle size={11} /> : <Icon size={11} />}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={clsx('w-6 h-px shrink-0', done ? 'bg-green-400/40' : 'bg-navy-600')} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <div className="card border border-navy-500/60 p-7">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-navy-500/40">
            {(() => { const Icon = STEPS[step-1].icon; return <Icon size={18} className="text-gold-400" />; })()}
            <div>
              <h2 className="font-display font-bold text-lg">{STEPS[step-1].label}</h2>
              <p className="text-xs text-slate-muted">Step {step} of {STEPS.length}</p>
            </div>
          </div>

          {stepComponents[step]}

          {/* Error */}
          {error && (
            <div className="mt-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-5 border-t border-navy-500/40">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="btn-ghost flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {step < STEPS.length ? (
              <button type="button" onClick={handleNext} className="btn-primary flex items-center gap-2">
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary flex items-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    Run Analysis
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Privacy note */}
        <p className="text-center text-xs text-slate-dim mt-6">
          🔒 Your data is encrypted and never shared with third parties.
        </p>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <AuthProvider>
      <div className="bg-navy-900 min-h-screen">
        <Navbar />
        <AnalyzeContent />
      </div>
    </AuthProvider>
  );
}
