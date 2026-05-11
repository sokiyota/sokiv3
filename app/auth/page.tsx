'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

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

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [profileData, setProfileData] = useState({
    contact: '',
    story: '',
    roleId: '' as '' | RoleId,
    experience: ''
  })
  
  const { signIn, signUp, user } = useAuth()
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        setError(error.message)
      } else if (isSignUp) {
        setError('Check your email to confirm your account')
      } else {
        // Successful login - will be redirected by middleware
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async () => {
    if (!profileData.contact.trim() || !profileData.story.trim()) {
      setError('Please fill in your contact and a short intro.')
      return
    }
    if (!profileData.roleId) {
      setError('Please choose a role.')
      return
    }

    const roleLabel = ROLES.find((r) => r.id === profileData.roleId)?.label ?? ''
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: profileData.contact.trim(),
          story: profileData.story.trim(),
          role: roleLabel,
          experience: profileData.experience.trim(),
          userId: user?.id
        }),
      })

      const payload = await res.json().catch(() => ({}))

      if (res.ok) {
        router.push('/waiting')
      } else {
        setError(payload.error || 'Failed to create profile')
      }
    } catch (err) {
      setError('Network error. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light mb-4 tracking-tight">
            {isSignUp ? 'Create account' : 'Sign in'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {isSignUp 
              ? 'Join the private community'
              : 'Welcome back to sokiwrld'
            }
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-8">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="minimal-input w-full px-4 py-4 text-sm"
              required
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="minimal-input w-full px-4 py-4 text-sm"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 px-4 py-3 border border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="minimal-button w-full py-4 text-sm font-medium"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create account' : 'Sign in')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="text-sm neon-glow-hover px-4 py-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {isSignUp 
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"
            }
          </button>
        </div>

        {!isSignUp && (
          <div className="mt-4 text-center">
            <a 
              href="/"
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              ← Back to request access
            </a>
          </div>
        )}

        {/* Profile Form for new users */}
        {showProfileForm && user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-2xl neon-border-subtle p-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <h2 className="text-xl font-light">
                  Complete your profile
                </h2>
                <button
                  type="button"
                  onClick={() => setShowProfileForm(false)}
                  className="text-2xl neon-glow-hover px-2 py-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  ×
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <input
                    type="text"
                    value={profileData.contact}
                    onChange={(e) => setProfileData({ ...profileData, contact: e.target.value })}
                    placeholder="Contact (Telegram/Discord)"
                    className="minimal-input w-full px-4 py-4 text-sm"
                  />
                </div>

                <div>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    Select your role
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {ROLES.map((role) => {
                      const selected = profileData.roleId === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setProfileData({ ...profileData, roleId: role.id })}
                          className={`p-4 text-left transition neon-border-subtle ${
                            selected ? 'neon-border' : ''
                          }`}
                          style={{
                            background: selected ? 'rgba(0, 209, 255, 0.05)' : 'transparent'
                          }}
                        >
                          <span className="text-sm font-medium">
                            {role.label}
                          </span>
                          <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                            {role.hint}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <textarea
                    value={profileData.story}
                    onChange={(e) => setProfileData({ ...profileData, story: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={6}
                    className="minimal-input w-full px-4 py-4 text-sm resize-none"
                  />
                </div>

                <div>
                  <textarea
                    value={profileData.experience}
                    onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                    placeholder="Experience (optional)"
                    rows={4}
                    className="minimal-input w-full px-4 py-4 text-sm resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleProfileSubmit}
                  disabled={loading}
                  className="neon-button w-full py-4 text-sm font-medium"
                >
                  {loading ? 'Creating profile...' : 'Submit for approval'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
