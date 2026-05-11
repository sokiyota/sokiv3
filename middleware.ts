import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create Supabase client for middleware
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  // Get session from cookie
  const token = req.cookies.get('sb-access-token')?.value
  let session = null
  
  if (token) {
    const { data } = await supabase.auth.getUser(token)
    session = data.user ? { user: data.user } : null
  }
  
  // Protected routes that require authentication
  const protectedRoutes = ['/profile', '/forums', '/dashboard', '/apply']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )
  
  // Auth routes that should redirect authenticated users
  const authRoutes = ['/auth']
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname === route
  )
  
  // If accessing protected route without session, redirect to auth
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth', req.url)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If accessing auth route with session, check approval status
  if (session && isAuthRoute) {
    try {
      // Use admin client to check profile (bypasses RLS)
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: profile, error } = await adminClient
        .from('profiles')
        .select('is_approved')
        .eq('id', session.user.id)
        .single()
      
      if (error || !profile) {
        // No profile found, redirect to apply
        const redirectUrl = new URL('/apply', req.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      if (profile.is_approved) {
        // User is approved, redirect to forums
        const redirectUrl = new URL('/forums', req.url)
        return NextResponse.redirect(redirectUrl)
      }
      // If not approved, let them stay on auth page (will show waiting message)
    } catch (error) {
      console.error('Middleware error:', error)
      const redirectUrl = new URL('/auth', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // If accessing any protected route with session, check approval
  if (session && isProtectedRoute) {
    try {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: profile, error } = await adminClient
        .from('profiles')
        .select('is_approved')
        .eq('id', session.user.id)
        .single()
      
      if (error || !profile || !profile.is_approved) {
        // User not approved, show strict verification page
        const redirectUrl = new URL('/verification', req.url)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Middleware error:', error)
      const redirectUrl = new URL('/auth', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
