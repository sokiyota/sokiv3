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

export default function ApplyPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    contact: '',
    background: '',
    experience: '',
    motivation: '',
    roleId: '' as '' | RoleId,
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.contact.trim() || !formData.background.trim() || !formData.motivation.trim()) {
      setError('Please fill in all required fields')
      return
    }
    
    if (!formData.roleId) {
      setError('Please select a role')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const roleLabel = ROLES.find((r) => r.id === formData.roleId)?.label ?? ''
      
      const res = await fetch('/api/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: formData.contact.trim(),
          story: formData.background.trim(),
          experience: formData.experience.trim(),
          role: roleLabel,
          userId: user?.id
        }),
      })

      const payload = await res.json()

      if (res.ok) {
        router.push('/waiting')
      } else {
        setError(payload.error || 'Failed to submit application')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    router.push('/auth')
    return null
  }

  return (
    <main style={{ background: 'var(--color-bg)' }}>
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-light mb-4 tracking-tight">
              SUPREME
            </h1>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              SOKIWRLD Membership Application
            </p>
          </div>

          {/* Application Form */}
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Contact Information */}
            <div className="neon-border-subtle p-8">
              <h2 className="text-2xl font-light mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    Contact Method
                  </label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="Telegram username or Discord handle"
                    className="minimal-input w-full px-4 py-4 text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Background */}
            <div className="neon-border-subtle p-8">
              <h2 className="text-2xl font-light mb-6">Your Background</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    Coding & Gaming Background
                  </label>
                  <textarea
                    value={formData.background}
                    onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                    placeholder="Tell us about your experience in coding, game development, modding, or any relevant technical background..."
                    rows={6}
                    className="minimal-input w-full px-4 py-4 text-sm resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="neon-border-subtle p-8">
              <h2 className="text-2xl font-light mb-6">Primary Role</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ROLES.map((role) => {
                  const selected = formData.roleId === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, roleId: role.id })}
                      className={`p-6 text-left transition-all duration-300 ${
                        selected 
                          ? 'neon-border' 
                          : 'neon-border-subtle neon-glow-hover'
                      }`}
                      style={{
                        background: selected ? 'rgba(0, 209, 255, 0.05)' : 'transparent'
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                          style={{
                            background: selected ? 'var(--color-neon)' : 'transparent',
                            border: selected ? '1px solid var(--color-neon)' : '1px solid var(--color-border)'
                          }}
                        >
                          {selected && '✓'}
                        </div>
                        <div>
                          <span className="text-lg font-medium">{role.label}</span>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {role.hint}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience */}
            <div className="neon-border-subtle p-8">
              <h2 className="text-2xl font-light mb-6">Relevant Experience</h2>
              
              <div>
                <textarea
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="Specific projects, achievements, or experiences that make you a strong candidate..."
                  rows={4}
                  className="minimal-input w-full px-4 py-4 text-sm resize-none"
                />
              </div>
            </div>

            {/* Motivation */}
            <div className="neon-border-subtle p-8">
              <h2 className="text-2xl font-light mb-6">Why SOKIWRLD?</h2>
              
              <div>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                  placeholder="What motivates you to join this community? What do you hope to contribute or gain?"
                  rows={4}
                  className="minimal-input w-full px-4 py-4 text-sm resize-none"
                  required
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="neon-border p-6 text-center">
                <p className="text-sm" style={{ color: 'var(--color-neon)' }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="neon-button px-12 py-4 text-lg font-medium"
                style={{ minWidth: '200px' }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/auth')}
              className="text-sm neon-glow-hover"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
