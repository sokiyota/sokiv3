'use client';

import { useState } from 'react';
import { PENDING_PROFILE_ID_KEY } from '@/lib/profile-draft';

const ROLES = [
  {
    id: 'player',
    label: 'Player',
    hint: 'I play and join sessions',
  },
  {
    id: 'modder',
    label: 'Modder',
    hint: 'Mods, tweaks, builds',
  },
  {
    id: 'creator',
    label: 'Creator',
    hint: 'Content, art, ideas',
  },
] as const;

type RoleId = (typeof ROLES)[number]['id'];

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [formData, setFormData] = useState({
    contact: '',
    story: '',
    roleId: '' as '' | RoleId,
  });

  const handleSubmit = async () => {
    if (!formData.contact.trim() || !formData.story.trim()) {
      alert('Please fill in your contact and a short intro.');
      return;
    }
    if (!formData.roleId) {
      alert('Please choose a role.');
      return;
    }

    const roleLabel = ROLES.find((r) => r.id === formData.roleId)?.label ?? '';

    setIsSending(true);

    try {
      const res = await fetch('/api/send-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: formData.contact.trim(),
          story: formData.story.trim(),
          role: roleLabel,
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: string;
        missing?: string[];
        id?: string;
      };

      if (res.ok) {
        const profileId = typeof payload.id === 'string' ? payload.id : null;
        if (profileId) {
          localStorage.setItem(PENDING_PROFILE_ID_KEY, profileId);
        }

        setFormData({ contact: '', story: '', roleId: '' });
        setIsOpen(false);

        window.location.href = '/waiting';
      } else {
        const missing =
          Array.isArray(payload.missing) && payload.missing.length > 0
            ? ` Missing: ${payload.missing.join(', ')}.`
            : '';
        const hint =
          typeof payload.details === 'string'
            ? payload.details
            : typeof payload.error === 'string'
              ? payload.error
              : null;
        alert(
          hint
            ? `Request failed: ${hint}${missing}`
            : `Server error.${missing || ' Please try again.'}`
        );
      }
    } catch {
      alert('Network error. Check your connection.');
    }

    setIsSending(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-5 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[420px] w-[420px] rounded-full bg-violet-600/25 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-0 h-[380px] w-[380px] rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          sokiwrld
        </p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Private community
        </h1>
        <p className="mb-10 max-w-md text-sm leading-relaxed text-zinc-400">
          Request access with your contact, role, and a short story. We&apos;ll
          review it and unlock the space when you&apos;re approved.
        </p>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-2xl bg-white px-8 py-3.5 text-sm font-semibold text-zinc-950 shadow-[0_0_40px_-8px_rgba(255,255,255,0.35)] transition hover:bg-zinc-100 active:scale-[0.98]"
        >
          Request access
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setIsOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-title"
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 shadow-2xl shadow-black/50"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <h2
                id="request-title"
                className="text-lg font-semibold tracking-tight"
              >
                Access request
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
                aria-label="Close form"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            <div className="max-h-[min(85vh,720px)] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="contact"
                    className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500"
                  >
                    Contact
                  </label>
                  <input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                    placeholder="Telegram or Discord"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none ring-0 transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                <fieldset>
                  <legend className="mb-3 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Role
                  </legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {ROLES.map((role) => {
                      const selected = formData.roleId === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, roleId: role.id })
                          }
                          aria-pressed={selected}
                          className={`flex flex-col items-start rounded-xl border px-4 py-4 text-left transition sm:min-h-[140px] ${
                            selected
                              ? 'border-violet-400/70 bg-violet-500/10 shadow-[0_0_24px_-8px_rgba(139,92,246,0.45)]'
                              : 'border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className="text-sm font-semibold text-zinc-100">
                            {role.label}
                          </span>
                          <span className="mt-1.5 text-xs leading-snug text-zinc-500">
                            {role.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div>
                  <label
                    htmlFor="story"
                    className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500"
                  >
                    About you
                  </label>
                  <textarea
                    id="story"
                    value={formData.story}
                    onChange={(e) =>
                      setFormData({ ...formData, story: e.target.value })
                    }
                    placeholder="Who you are, what you care about, why you want in"
                    rows={5}
                    className="w-full resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSending}
                  className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-zinc-950 transition enabled:hover:bg-zinc-100 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSending ? 'Sending…' : 'Submit request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
