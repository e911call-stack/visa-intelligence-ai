'use client';
import Link from 'next/link';
import { Shield, Eye, CheckSquare, Compass, DollarSign, ArrowRight, Zap, Lock, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../hooks/useAuth';

const FEATURES = [
  {
    icon: Eye,
    title: 'Social Media Analysis',
    desc: 'AI scans online presence for risk signals that consular officers look for — without ever accessing your accounts.',
    color: '#60a5fa',
    weight: '25%',
  },
  {
    icon: Compass,
    title: 'Intent Detection',
    desc: 'The #1 factor in visa decisions. We evaluate your home-country ties and return probability using 12 behavioral signals.',
    color: '#c084fc',
    weight: '30%',
  },
  {
    icon: DollarSign,
    title: 'Financial Strength',
    desc: 'Income-to-destination cost analysis, asset evaluation, and funding source credibility — all context-adjusted for your nationality.',
    color: '#34d399',
    weight: '25%',
  },
  {
    icon: CheckSquare,
    title: 'Profile Consistency',
    desc: 'Cross-references every data point in your profile to surface contradictions before a real officer does.',
    color: '#fb923c',
    weight: '20%',
  },
];

const STEPS = [
  { num: '01', title: 'Enter Your Profile', desc: 'Fill in your background, finances, and travel history in our secure 5-step form. Takes about 5 minutes.' },
  { num: '02', title: 'AI Evaluates in Parallel', desc: '4 specialized AI modules analyze different risk dimensions simultaneously. Results in under 30 seconds.' },
  { num: '03', title: 'Read Your Report', desc: 'Get a scored breakdown with specific flags, approval probability, and an action plan to strengthen your case.' },
];

function AnimatedScore({ score, color }) {
  return (
    <div className="font-mono font-bold tabular-nums" style={{ color }}>
      {score}
    </div>
  );
}

export default function LandingPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-navy-900 overflow-x-hidden">
        <Navbar />

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center pt-20">
          {/* Background grid */}
          <div className="absolute inset-0 bg-grid opacity-40" />
          {/* Radial fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-navy-900" />
          {/* Gold glow blob */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-[600px] h-[400px] rounded-full opacity-8
                          bg-gold-400 blur-[120px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: text */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                              border border-gold-400/30 bg-gold-400/8">
                <Zap size={12} className="text-gold-400" />
                <span className="section-label text-[10px]">Powered by GPT-4o</span>
              </div>

              <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
                Know Your
                <br />
                <span className="text-gold-400">Visa Odds</span>
                <br />
                Before You Apply
              </h1>

              <p className="text-slate-muted text-lg leading-relaxed max-w-lg">
                Our AI evaluates your application across 4 critical dimensions —
                the same factors immigration officers actually assess — and gives
                you an actionable report in under 60 seconds.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth?mode=signup" className="btn-primary flex items-center justify-center gap-2 text-base">
                  Analyze My Profile Free
                  <ArrowRight size={16} />
                </Link>
                <a href="#how-it-works" className="btn-secondary flex items-center justify-center gap-2 text-base">
                  See How It Works
                </a>
              </div>

              <div className="flex items-center gap-6 pt-2">
                {[
                  { val: '4', label: 'AI Modules' },
                  { val: '<30s', label: 'Analysis Time' },
                  { val: '100%', label: 'Private & Secure' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="font-mono font-bold text-xl text-gold-400">{stat.val}</div>
                    <div className="text-xs text-slate-muted">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: mock score card */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 rounded-2xl bg-gold-400/5 blur-xl" />
              <div className="relative card border border-navy-500/70 space-y-5 p-7">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="section-label mb-1">Sample Assessment</p>
                    <p className="font-display font-bold text-lg">Nigerian → United States</p>
                    <p className="text-sm text-slate-muted">Business · Tourist Visa</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-4xl text-green-400">79</div>
                    <div className="text-xs text-slate-muted font-mono">/100</div>
                  </div>
                </div>

                {/* Module scores */}
                <div className="space-y-3">
                  {[
                    { label: 'Travel Intent', score: 78, color: '#c084fc' },
                    { label: 'Social Media', score: 80, color: '#60a5fa' },
                    { label: 'Financial', score: 72, color: '#34d399' },
                    { label: 'Consistency', score: 90, color: '#fb923c' },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-muted">{m.label}</span>
                        <span className="font-mono font-semibold" style={{ color: m.color }}>{m.score}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-navy-600 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${m.score}%`, backgroundColor: m.color, boxShadow: `0 0 8px ${m.color}60` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Verdict */}
                <div className="flex items-center justify-between pt-3 border-t border-navy-500/50">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="font-mono text-xs text-green-400 font-bold tracking-widest uppercase">Low Risk</span>
                  </div>
                  <div className="font-mono text-sm">
                    <span className="text-slate-muted">Approval: </span>
                    <span className="text-gold-400 font-bold">82%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="section-label mb-4">Analysis Engine</p>
              <h2 className="font-display font-bold text-4xl sm:text-5xl">
                Four Modules.<br />One Verdict.
              </h2>
              <p className="text-slate-muted mt-4 text-lg max-w-2xl mx-auto">
                Each dimension runs independently then feeds a weighted scoring model —
                the same logic real immigration officers apply.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title}
                    className="card border border-navy-500/50 hover:border-navy-400/70
                               hover:-translate-y-1 transition-all duration-300 group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                         style={{ backgroundColor: f.color + '18', border: `1px solid ${f.color}30` }}>
                      <Icon size={18} style={{ color: f.color }} />
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display font-bold text-base">{f.title}</h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded border"
                            style={{ color: f.color, borderColor: f.color + '40', backgroundColor: f.color + '10' }}>
                        {f.weight}
                      </span>
                    </div>
                    <p className="text-slate-muted text-sm leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-24 bg-navy-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="section-label mb-4">Process</p>
              <h2 className="font-display font-bold text-4xl sm:text-5xl">
                From input to insight<br />in under 60 seconds
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-8 left-[calc(16.67%-1px)] right-[calc(16.67%-1px)]
                              h-px bg-gradient-to-r from-transparent via-navy-500 to-transparent" />

              {STEPS.map((step, i) => (
                <div key={step.num} className="relative text-center">
                  <div className="w-16 h-16 rounded-2xl glass gold-border mx-auto mb-6
                                  flex items-center justify-center font-mono font-bold text-gold-400 text-lg">
                    {step.num}
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-slate-muted leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST SIGNALS ── */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: Lock, title: 'End-to-End Private', desc: 'Your data is never sold or shared. Each analysis is encrypted and accessible only to you.' },
                { icon: Shield, title: 'Built for Real Applicants', desc: 'Designed around actual consular assessment frameworks, not just generic AI scoring.' },
                { icon: Zap, title: 'Instant Results', desc: 'All four AI modules run in parallel. Your full report is ready in under 30 seconds.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="card border border-navy-500/40 text-center">
                    <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20
                                    flex items-center justify-center mx-auto mb-4">
                      <Icon size={18} className="text-gold-400" />
                    </div>
                    <h3 className="font-display font-bold text-base mb-2">{item.title}</h3>
                    <p className="text-slate-muted text-sm leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="card border border-gold-400/20 bg-gold-400/5 p-12 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-grid opacity-20" />
              <div className="relative">
                <p className="section-label mb-4">Get Started Free</p>
                <h2 className="font-display font-bold text-4xl mb-5">
                  Know before you apply.
                </h2>
                <p className="text-slate-muted text-lg mb-8 max-w-xl mx-auto">
                  Stop guessing and start optimizing. Get your first analysis free —
                  no credit card required.
                </p>
                <Link href="/auth?mode=signup"
                  className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
                  Analyze My Visa Profile
                  <ChevronRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-navy-700 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row
                          items-center justify-between gap-4 text-sm text-slate-muted">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-gold-400" />
              <span className="font-display font-semibold text-slate-text">VisaIntelligence</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <p className="text-xs text-center sm:text-right max-w-sm">
              AI-generated assessments are for informational purposes only.
              Consult a licensed immigration attorney for legal advice.
            </p>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
