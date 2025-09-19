'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getMFARelayProjectId } from '@/lib/supabase'

// Helper function to create OAuth email account
async function createOAuthEmailAccount(projectId: string, user: User) {
  try {
    console.log('createOAuthEmailAccount: Checking if account exists...')

    // Check if email account already exists
    const { data: existing } = await supabase
      .from('mfa_email_accounts')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('email_address', user.email)
      .single()

    if (existing) {
      console.log('createOAuthEmailAccount: Account already exists')
      return
    }

    // Create new email account from OAuth session
    const { data, error } = await supabase
      .from('mfa_email_accounts')
      .insert({
        project_id: projectId,
        user_id: user.id,
        name: `${user.email} (OAuth)`,
        email_address: user.email,
        provider: user.app_metadata?.provider === 'google' ? 'gmail' : 'outlook',
        oauth_provider: user.app_metadata?.provider,
        use_ssl: true,
        folder_name: 'INBOX',
        is_active: true,
        check_interval_seconds: 30
      })
      .select()

    if (error) {
      console.error('createOAuthEmailAccount: Error creating account:', error)
    } else {
      console.log('createOAuthEmailAccount: Created account:', data)
    }
  } catch (err) {
    console.error('createOAuthEmailAccount: Exception:', err)
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [projectId, setProjectId] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('useAuth: Getting initial session...')
      try {
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        )

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any
        console.log('useAuth: Session result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          error: error?.message
        })

        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('useAuth: Getting MFA Relay project ID...')
          const id = await getMFARelayProjectId()
          console.log('useAuth: Project ID result:', id)
          setProjectId(id)

          // Auto-create OAuth email account if it doesn't exist
          if (id && session.user.email) {
            await createOAuthEmailAccount(id, session.user)
          }
        }

        setLoading(false)
        console.log('useAuth: Initial session check complete')
      } catch (err) {
        console.error('useAuth: Error getting initial session:', err)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user })
        setUser(session?.user ?? null)

        if (session?.user) {
          const id = await getMFARelayProjectId()
          setProjectId(id)

          // Auto-create OAuth email account if it doesn't exist
          if (id && session.user.email) {
            await createOAuthEmailAccount(id, session.user)
          }
        } else {
          setProjectId(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    user,
    loading,
    projectId,
    signOut,
    isAuthenticated: !!user
  }
}