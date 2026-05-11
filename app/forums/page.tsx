'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'

interface ForumCategory {
  id: string
  name: string
  description: string
  postCount: number
  lastActivity: string
}

export default function ForumsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [categories] = useState<ForumCategory[]>([
    {
      id: 'general',
      name: 'General Discussion',
      description: 'General topics and community discussions',
      postCount: 42,
      lastActivity: '2 hours ago'
    },
    {
      id: 'gaming',
      name: 'Gaming',
      description: 'Talk about games, sessions, and collaborations',
      postCount: 28,
      lastActivity: '5 hours ago'
    },
    {
      id: 'creative',
      name: 'Creative Works',
      description: 'Share your creative projects and get feedback',
      postCount: 15,
      lastActivity: '1 day ago'
    },
    {
      id: 'tech',
      name: 'Tech & Development',
      description: 'Technical discussions, modding, and development',
      postCount: 19,
      lastActivity: '3 hours ago'
    }
  ])

  useEffect(() => {
    if (!loading && (!user || !profile || !profile.is_approved)) {
      router.push('/auth')
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading forums...</p>
        </div>
      </main>
    )
  }

  if (!user || !profile || !profile.is_approved) {
    return null // Will redirect
  }

  return (
    <main style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-light mb-2">Forums</h1>
              <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                Community discussion space
              </p>
            </div>
            <nav className="flex items-center gap-8">
              <Link
                href={`/profile/${user.id}`}
                className="neon-glow-hover px-4 py-2 text-sm"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  // TODO: Implement logout
                  router.push('/auth')
                }}
                className="minimal-button px-4 py-2 text-sm"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/forums/${category.id}`}
              className="neon-border-subtle p-8 neon-glow-hover block transition-all duration-300"
              style={{
                background: 'transparent',
                transform: 'translateY(0)'
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl transition-all duration-300"
                  style={{
                    background: 'rgba(0, 209, 255, 0.05)',
                    color: 'var(--color-neon)'
                  }}
                >
                  {category.id === 'general' && '💬'}
                  {category.id === 'gaming' && '🎮'}
                  {category.id === 'creative' && '🎨'}
                  {category.id === 'tech' && '⚙️'}
                </div>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {category.postCount} posts
                </span>
              </div>
              
              <h3 className="text-xl font-light mb-3 neon-text">
                {category.name}
              </h3>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {category.description}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Last activity: {category.lastActivity}
              </p>
            </Link>
          ))}
        </div>

        {/* Welcome Section */}
        <div className="mt-16 neon-border-subtle p-12">
          <h2 className="text-3xl font-light mb-6">Welcome to sokiwrld</h2>
          <p className="text-lg mb-8 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            This is your space to connect with other community members, share ideas, 
            and collaborate on projects. Explore the categories and join the conversation.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href={`/profile/${user.id}`}
              className="neon-button px-8 py-4 text-sm font-medium"
            >
              Edit Profile
            </Link>
            <button className="minimal-button px-8 py-4 text-sm font-medium">
              Guidelines
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
