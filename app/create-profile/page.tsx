'use client';

import { useState } from 'react';
import { PENDING_PROFILE_ID_KEY } from '@/lib/profile-draft';

export default function CreateProfile() {
  const [form, setForm] = useState({
    wallet: '',
    bio: '',
    games: '',
    music: '',
    forums: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const id =
      typeof window !== 'undefined'
        ? localStorage.getItem(PENDING_PROFILE_ID_KEY)
        : null;

    if (!id) {
      alert('No pending request. Submit an application from the home page first.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          wallet: form.wallet,
          bio: form.bio,
          games: form.games,
          music: form.music,
          forums: form.forums,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(
          typeof payload.error === 'string'
            ? payload.error
            : 'Could not save profile'
        );
        console.error(payload);
        return;
      }

      localStorage.removeItem(PENDING_PROFILE_ID_KEY);
      window.location.href = '/swipe';
    } catch (e) {
      alert('Network error');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-3">
        <h1 className="text-3xl font-bold">Create Profile</h1>

        <input
          placeholder="Wallet"
          className="w-full p-3 text-black"
          onChange={(e) => setForm({ ...form, wallet: e.target.value })}
        />

        <input
          placeholder="Bio"
          className="w-full p-3 text-black"
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />

        <input
          placeholder="Games (comma separated)"
          className="w-full p-3 text-black"
          onChange={(e) => setForm({ ...form, games: e.target.value })}
        />

        <input
          placeholder="Music"
          className="w-full p-3 text-black"
          onChange={(e) => setForm({ ...form, music: e.target.value })}
        />

        <input
          placeholder="Forums"
          className="w-full p-3 text-black"
          onChange={(e) => setForm({ ...form, forums: e.target.value })}
        />

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-white text-black py-3 font-bold"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </main>
  );
}
