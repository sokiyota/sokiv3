'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createAdminClient } from '@/lib/supabase-admin'

interface Post {
  id: string
  title: string
  content: string
  author_id: string
  author_contact: string
  category: string
  created_at: string
  updated_at: string
  comment_count: number
}

interface Comment {
  id: string
  post_id: string
  author_id: string
  author_contact: string
  content: string
  parent_id: string | null
  created_at: string
  replies: Comment[]
}

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [newPost, setNewPost] = useState({ title: '', content: '' })
  const [showNewPost, setShowNewPost] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(true)

  const category = params.category as string

  useEffect(() => {
    if (!loading && (!user || !profile || !profile.is_approved)) {
      router.push('/auth')
      return
    }
    fetchPosts()
  }, [category, loading, user, profile])

  const fetchPosts = async () => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(contact),
          comment_count:comments(count)
        `)
        .eq('category', category)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
      } else {
        setPosts(data || [])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return

    try {
      const supabase = createAdminClient()
      const { error } = await supabase
        .from('posts')
        .insert({
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          author_id: user!.id,
          category
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating post:', error)
        alert('Failed to create post')
        return
      }

      setNewPost({ title: '', content: '' })
      setShowNewPost(false)
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post')
    }
  }

  const renderComments = (comments: Comment[], depth = 0) => {
    return comments.map(comment => (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8' : ''}`}>
        <div className="border-l-2" style={{ borderColor: 'var(--color-border)', marginLeft: depth > 0 ? '2rem' : '0' }}>
          <div className="pl-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium" 
                   style={{ background: 'rgba(0, 209, 255, 0.1)', color: 'var(--color-neon)' }}>
                {comment.author_contact.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">{comment.author_contact}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                  {comment.content}
                </div>
              </div>
            </div>
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              {renderComments(comment.replies, depth + 1)}
            </div>
          )}
        </div>
      </div>
    ))
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" 
               style={{ borderTopColor: 'var(--color-neon)' }}></div>
          <p>Loading discussions...</p>
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
              <h1 className="text-4xl font-light mb-2 capitalize">{category}</h1>
              <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                Community discussions
              </p>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/profile/' + user.id)}
                className="neon-glow-hover px-4 py-2 text-sm"
              >
                Profile
              </button>
              <button
                onClick={() => setShowNewPost(!showNewPost)}
                className="neon-button px-4 py-2 text-sm font-medium"
              >
                New Post
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* New Post Form */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-3xl neon-border-subtle p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light">Create New Post</h2>
              <button
                onClick={() => setShowNewPost(false)}
                className="text-2xl neon-glow-hover px-2 py-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                ×
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Post title..."
                  className="minimal-input w-full px-4 py-4 text-lg font-light"
                />
              </div>
              <div>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="What's on your mind?"
                  rows={8}
                  className="minimal-input w-full px-4 py-4 text-sm resize-none"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleCreatePost}
                  disabled={!newPost.title.trim() || !newPost.content.trim()}
                  className="neon-button px-6 py-3 text-sm font-medium"
                >
                  Post
                </button>
                <button
                  onClick={() => setShowNewPost(false)}
                  className="minimal-button px-6 py-3 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {posts.map(post => (
            <div key={post.id} className="neon-border-subtle">
              {/* Post Header */}
              <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium" 
                         style={{ background: 'rgba(0, 209, 255, 0.1)', color: 'var(--color-neon)' }}>
                      {post.author_contact.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium">{post.author_contact}</span>
                      <span className="text-sm ml-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="neon-glow-hover px-3 py-1 text-sm"
                  >
                    {selectedPost?.id === post.id ? 'Hide' : 'View'} Comments ({post.comment_count})
                  </button>
                </div>
                <h2 className="text-xl font-light mt-4 mb-3">{post.title}</h2>
              </div>

              {/* Post Content */}
              <div className="p-6">
                <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                  {post.content}
                </div>
              </div>

              {/* Comments Section */}
              {selectedPost?.id === post.id && (
                <div className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="p-6">
                    <h3 className="text-lg font-light mb-6">Comments</h3>
                    <PostComments postId={post.id} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

// Comments Component
function PostComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles(contact)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching comments:', error)
      } else {
        // Build nested comment structure
        const nestedComments = buildCommentTree(data || [])
        setComments(nestedComments)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const buildCommentTree = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map()
    const rootComments: Comment[] = []

    // Create map of all comments
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Build tree structure
    flatComments.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.replies.push(commentMap.get(comment.id)!)
        }
      } else {
        rootComments.push(commentMap.get(comment.id)!)
      }
    })

    return rootComments
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return

    try {
      const supabase = createAdminClient()
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: newComment.trim(),
          parent_id: null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating comment:', error)
        alert('Failed to post comment')
        return
      }

      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Error creating comment:', error)
      alert('Failed to post comment')
    }
  }

  const renderComments = (comments: Comment[], depth = 0) => {
    return comments.map(comment => (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8' : ''}`}>
        <div className="border-l-2" style={{ borderColor: 'var(--color-border)', marginLeft: depth > 0 ? '2rem' : '0' }}>
          <div className="pl-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium" 
                   style={{ background: 'rgba(0, 209, 255, 0.1)', color: 'var(--color-neon)' }}>
                {comment.author_contact.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">{comment.author_contact}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                  {comment.content}
                </div>
              </div>
            </div>
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              {renderComments(comment.replies, depth + 1)}
            </div>
          )}
        </div>
      </div>
    ))
  }

  return (
    <div className="space-y-6">
      {/* New Comment Form */}
      <div className="neon-border-subtle p-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="minimal-input w-full px-4 py-3 text-sm resize-none mb-4"
        />
        <button
          onClick={handleAddComment}
          disabled={!newComment.trim() || !user}
          className="neon-button px-4 py-2 text-sm font-medium"
        >
          Post Comment
        </button>
      </div>

      {/* Comments Tree */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {renderComments(comments)}
        </div>
      ) : (
        <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
          No comments yet. Be the first to share your thoughts!
        </div>
      )}
    </div>
  )
}
