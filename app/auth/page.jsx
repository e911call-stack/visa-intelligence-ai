'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase';
import { Shield, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import clsx from 'clsx';

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setMode('signin');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[500px] h-[500px] rounded-full bg-gold-400 opacity-5 blur-[100px]" />

      {/* Back link */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-slate-muted
                                 hover:text-slate-text transition-colors text-sm group">
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </Link>

      <div className="relative w-full max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gold-400 flex items-center justify-center">
              <Shield size={20} className="text-navy-900" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-xl">
              Visa<span className="text-gold-400">Intelligence</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="card border border-navy-500/70 p-8 rounded-2xl">
          {/* Mode tabs */}
          <div className="flex rounded-xl overflow-hidden border border-navy-500/50 mb-8">
            {['signin', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={clsx(
                  'flex-1 py-2.5 text-sm font-display font-semibold transition-all duration-200',
                  mode === m
                    ? 'bg-gold-400 text-navy-900'
                    : 'text-slate-muted hover:text-slate-text'
                )}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm text-slate-muted mb-2 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="input-field"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-slate-muted mb-2 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="input-field pr-11"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-muted hover:text-slate-text transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-xs text-slate-muted mt-1.5">Minimum 8 characters</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed py-3.5"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-sm text-slate-muted mt-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="text-gold-400 hover:text-gold-300 font-medium transition-colors"
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-slate-dim mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-gold-400" />
    </div>}>
      <AuthForm />
    </Suspense>
  );
}
