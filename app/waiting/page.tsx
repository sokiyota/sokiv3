'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  PENDING_PROFILE_ID_KEY,
  isProfileDraftUuid,
} from '@/lib/profile-draft';

function goSwipe() {
  window.location.href = '/swipe';
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
          goSwipe();
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
            goSwipe();
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
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 gap-4">
      <p className="text-xl font-semibold text-center">Request sent</p>
      <p className="text-neutral-400 text-center max-w-md">
        Waiting for approval. You&apos;ll be redirected when your request is
        accepted.
      </p>
      {hint && (
        <p className="text-amber-200/90 text-sm text-center max-w-lg">{hint}</p>
      )}
    </main>
  );
}
