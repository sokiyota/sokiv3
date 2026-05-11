'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import {
  PENDING_PROFILE_ID_KEY,
  isProfileDraftUuid,
} from '@/lib/profile-draft';

function goToForums() {
  window.location.href = '/forums';
}

export default function WaitingPage() {
  const router = useRouter();
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(PENDING_PROFILE_ID_KEY);
    if (!isProfileDraftUuid(raw)) {
      router.replace('/');
      return;
    }

    const id = raw;
    let cancelled = false;

    const checkApproved = async () => {
      try {
        const res = await fetch(
          `/api/profile-approval?id=${encodeURIComponent(id)}`
        );
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as { is_approved?: boolean };
        if (body.is_approved === true && !cancelled) {
          goToForums();
        }
      } catch {
        // ignore; realtime may still fire
      }
    };

    void checkApproved();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkApproved();
    };
    document.addEventListener('visibilitychange', onVisible);
    const poll = window.setInterval(() => void checkApproved(), 30_000);

    const channel = supabase
      .channel(`profile-wait:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const row = payload.new as { is_approved?: boolean } | undefined;
          if (row?.is_approved === true && !cancelled) {
            goToForums();
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Realtime subscribe:', status, err);
          if (!cancelled) {
            setHint(
              'Could not connect to Realtime. In Supabase, add table `profiles` to the `supabase_realtime` publication and ensure anon has SELECT on it (or refresh after approval).'
            );
          }
        }
      });

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16" style={{ background: 'var(--color-bg)' }}>
      <div className="text-center max-w-lg">
        {/* Pulsing Neon Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="pulse-dot"></div>
        </div>

        <h1 className="text-3xl font-light mb-4">Awaiting commander's approval</h1>
        <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          Your request has been received and is currently under review.
          <br />
          You will be redirected automatically when approved.
        </p>

        {hint && (
          <div className="neon-border-subtle p-6 mb-8">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {hint}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="minimal-button px-8 py-3 text-sm font-medium"
          >
            Check Status
          </button>
          
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            This page will automatically refresh when your request is approved
          </div>
        </div>
      </div>
    </main>
  );
}
