'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function VerificationPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.push('/auth')
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" 
               style={{ borderTopColor: 'var(--color-neon)' }}></div>
          <p>Loading...</p>
        </div>
      </main>
    )
  }

  if (!user || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center max-w-lg">
          <h1 className="text-3xl font-light mb-4">Session Required</h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Please sign in to continue
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="neon-button px-8 py-3 text-sm font-medium"
          >
            Sign In
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--color-bg)' }}>
      <div className="text-center max-w-2xl">
        {/* Lock Icon */}
        <div className="mb-8">
          <div 
            className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl"
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid var(--color-neon)',
              boxShadow: '0 0 30px var(--color-neon-glow)'
            }}
          >
            🔒
          </div>
        </div>

        <h1 className="text-5xl font-light mb-4">Identity under verification</h1>
        <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          Welcome to SOKIWRLD
        </p>

        <div className="neon-border-subtle p-8 mb-8">
          <h2 className="text-2xl font-light mb-4">Application Status</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full" style={{ background: 'var(--color-neon)' }}></div>
              <div>
                <p className="text-sm font-medium">Your application is pending review</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Submitted: {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <div>
                <p className="text-sm font-medium">Awaiting commander approval</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Your access request is being reviewed by community administrators
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            This page will automatically redirect when your application is approved.
            <br />
            Please be patient while our team reviews your submission.
          </p>
        </div>
      </div>
    </main>
  )
}
