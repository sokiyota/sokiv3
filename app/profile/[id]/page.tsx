'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createAdminClient } from '@/lib/supabase-admin'

interface Profile {
  id: string
  contact: string
  story: string
  role: string | null
  experience: string | null
  is_approved: boolean
  music: string | null
  games: string | null
  bio: string | null
  soki_balance: number
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user, profile: currentUserProfile } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    music: '',
    games: '',
    bio: ''
  })
  const [saving, setSaving] = useState(false)

  const profileId = params.id as string
  const isOwnProfile = user?.id === profileId

  useEffect(() => {
    fetchProfile()
  }, [profileId])

  const fetchProfile = async () => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        router.push('/forums')
        return
      }

      setProfile(data)
      setEditForm({
        music: data.music || '',
        games: data.games || '',
        bio: data.bio || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      router.push('/forums')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (profile) {
      setEditForm({
        music: profile.music || '',
        games: profile.games || '',
        bio: profile.bio || ''
      })
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const supabase = createAdminClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          music: editForm.music || null,
          games: editForm.games || null,
          bio: editForm.bio || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) {
        console.error('Error updating profile:', error)
        alert('Failed to update profile')
        return
      }

      setProfile({
        ...profile,
        music: editForm.music || null,
        games: editForm.games || null,
        bio: editForm.bio || null,
        updated_at: new Date().toISOString()
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Profile not found</p>
          <button
            onClick={() => router.push('/forums')}
            className="px-4 py-2 bg-violet-600 rounded-lg hover:bg-violet-700 transition"
          >
            Back to Forums
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Left Column - Avatar & Basic Info */}
          <div className="lg:col-span-1">
            <div className="neon-border-subtle p-8 sticky top-8">
              {/* Avatar */}
              <div className="text-center mb-8">
                <div 
                  className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl font-light"
                  style={{
                    background: 'rgba(0, 209, 255, 0.1)',
                    color: 'var(--color-neon)'
                  }}
                >
                  {profile.contact.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-light mb-2">{profile.contact}</h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Role Badge */}
              {profile.role && (
                <div className="text-center mb-8">
                  <span className="role-badge">
                    {profile.role}
                  </span>
                </div>
              )}

              {/* SOKI Balance */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  SOKI Points
                </h3>
                <div className="neon-border p-4 text-center">
                  <span className="text-2xl font-light neon-text">
                    {profile.soki_balance || 0}
                  </span>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Balance
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Contact
                </h3>
                <p className="text-sm">{profile.contact}</p>
              </div>

              {/* Navigation */}
              <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <nav className="space-y-3">
                  <button
                    onClick={() => router.push('/forums')}
                    className="w-full text-left px-4 py-3 neon-border-subtle neon-glow-hover text-sm"
                  >
                    Forums
                  </button>
                  {isOwnProfile && (
                    <button
                      onClick={() => router.push('/profile/' + user?.id)}
                      className="w-full text-left px-4 py-3 neon-border-subtle neon-glow-hover text-sm"
                    >
                      My Profile
                    </button>
                  )}
                </nav>
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Characteristics */}
          <div className="lg:col-span-3 space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-light mb-2">Profile</h1>
                {isOwnProfile && !isEditing && (
                  <button
                    onClick={handleEdit}
                    className="neon-button px-6 py-3 text-sm font-medium mt-4"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* About */}
            <div className="neon-border-subtle p-8">
              <h2 className="text-xl font-light mb-4">About</h2>
              <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {profile.story}
              </p>
            </div>

            {/* Experience */}
            {profile.experience && (
              <div className="neon-border-subtle p-8">
                <h2 className="text-xl font-light mb-4">Experience</h2>
                <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {profile.experience}
                </p>
              </div>
            )}

            {/* Editable Fields */}
            {(isEditing || profile.music || profile.games || profile.bio) && (
              <div className="neon-border-subtle p-8">
                <h2 className="text-xl font-light mb-6">Characteristics</h2>
                
                {isEditing ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                        Music
                      </label>
                      <textarea
                        value={editForm.music}
                        onChange={(e) => setEditForm({ ...editForm, music: e.target.value })}
                        placeholder="What music are you into?"
                        rows={4}
                        className="minimal-input w-full px-4 py-4 text-sm resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                        Games
                      </label>
                      <textarea
                        value={editForm.games}
                        onChange={(e) => setEditForm({ ...editForm, games: e.target.value })}
                        placeholder="What games do you play?"
                        rows={4}
                        className="minimal-input w-full px-4 py-4 text-sm resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                        Bio
                      </label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        placeholder="Tell us more about yourself..."
                        rows={5}
                        className="minimal-input w-full px-4 py-4 text-sm resize-none"
                      />
                    </div>
                    
                    <div className="flex gap-4 pt-6">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="neon-button px-6 py-3 text-sm font-medium"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="minimal-button px-6 py-3 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {profile.music && (
                      <div>
                        <h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                          Music
                        </h3>
                        <p className="leading-relaxed">{profile.music}</p>
                      </div>
                    )}
                    
                    {profile.games && (
                      <div>
                        <h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                          Games
                        </h3>
                        <p className="leading-relaxed">{profile.games}</p>
                      </div>
                    )}
                    
                    {profile.bio && (
                      <div>
                        <h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                          Bio
                        </h3>
                        <p className="leading-relaxed">{profile.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
