'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { Shield, Menu, X, ChevronRight, LogOut, LayoutDashboard } from 'lucide-react';
import clsx from 'clsx';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? 'glass border-b border-navy-500/60 py-3'
        : 'bg-transparent py-5'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gold-400 flex items-center justify-center
                          group-hover:bg-gold-300 transition-colors">
            <Shield size={16} className="text-navy-900" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-slate-text tracking-tight">
            Visa<span className="text-gold-400">Intelligence</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {!user && (
            <>
              <a href="#features" className="btn-ghost text-sm">Features</a>
              <a href="#how-it-works" className="btn-ghost text-sm">How It Works</a>
            </>
          )}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="w-24 h-9 rounded-lg bg-navy-700 animate-pulse" />
          ) : user ? (
            <>
              <Link href="/dashboard" className="btn-ghost text-sm flex items-center gap-2">
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <Link href="/analyze" className="btn-primary text-sm py-2">
                New Analysis
              </Link>
              <button onClick={handleSignOut} className="btn-ghost text-sm text-slate-muted">
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" className="btn-ghost text-sm">Sign In</Link>
              <Link href="/auth?mode=signup" className="btn-primary text-sm py-2 flex items-center gap-1.5">
                Get Started <ChevronRight size={14} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-navy-700 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-navy-500/60 px-4 py-4 space-y-2">
          {user ? (
            <>
              <Link href="/dashboard" className="block py-2 text-slate-text hover:text-gold-400 transition-colors">Dashboard</Link>
              <Link href="/analyze" className="block py-2 text-slate-text hover:text-gold-400 transition-colors">New Analysis</Link>
              <button onClick={handleSignOut} className="block py-2 text-slate-muted">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/auth" className="block py-2 text-slate-text">Sign In</Link>
              <Link href="/auth?mode=signup" className="block py-2 text-gold-400 font-medium">Get Started →</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
