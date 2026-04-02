import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="text-center">
        <div className="font-mono font-bold text-8xl text-navy-700 mb-6">404</div>
        <h1 className="font-display font-bold text-2xl mb-3">Page not found</h1>
        <p className="text-slate-muted mb-8">This page does not exist or has been moved.</p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <Shield size={16} /> Go Home
        </Link>
      </div>
    </div>
  );
}
