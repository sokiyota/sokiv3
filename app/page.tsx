'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        if (profile.is_approved) {
          router.push('/forums');
        } else {
          router.push('/waiting');
        }
      } else {
        router.push('/auth');
      }
    }
  }, [user, profile, loading, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-16" style={{ background: 'var(--color-bg)' }}>
      <div className="text-center max-w-lg">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
          sokiwrld
        </p>
        <h1 className="mb-6 text-4xl font-light tracking-tight">
          SOKIWRLD
        </h1>
        <p className="mb-12 text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Exclusive community platform
        </p>

        <button
          onClick={() => window.location.href = '/apply'}
          className="neon-button px-12 py-4 text-lg font-medium"
          style={{ minWidth: '200px' }}
        >
          Apply for Access
        </button>
      </div>
    </main>
  );
}
