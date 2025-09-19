'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function OAuthRestoreContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const restoreOriginalSession = async () => {
      try {
        // Get the stored context
        const contextStr = sessionStorage.getItem('oauth_link_context')
        if (!contextStr) {
          setStatus('error')
          setMessage('No session context found. Please try again.')
          return
        }

        const context = JSON.parse(contextStr)
        console.log('Restoring session context:', context)

        // Check if context is recent (within last 10 minutes)
        if (Date.now() - context.timestamp > 10 * 60 * 1000) {
          setStatus('error')
          setMessage('Session context expired. Please try again.')
          sessionStorage.removeItem('oauth_link_context')
          return
        }

        // Try to restore the original session by signing in with the original user
        // Note: This is tricky because we need to restore the session without the user's password
        // For now, we'll redirect to dashboard and let the user re-authenticate if needed

        const success = searchParams.get('success')
        const error = searchParams.get('error')

        if (success === 'true') {
          setStatus('success')
          setMessage(`OAuth account linked successfully! Redirecting to dashboard...`)

          // Clean up the context
          sessionStorage.removeItem('oauth_link_context')

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else if (error) {
          setStatus('error')
          setMessage('Failed to link OAuth account. Please try again.')
          sessionStorage.removeItem('oauth_link_context')

          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        } else {
          setStatus('error')
          setMessage('Unknown error occurred. Redirecting to dashboard...')
          sessionStorage.removeItem('oauth_link_context')

          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        }

      } catch (err) {
        console.error('Error restoring session:', err)
        setStatus('error')
        setMessage('Error restoring session. Redirecting to dashboard...')
        sessionStorage.removeItem('oauth_link_context')

        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      }
    }

    restoreOriginalSession()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-4">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Linking OAuth Account...</h1>
            <p className="text-gray-600">Processing your OAuth connection...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-green-900 mb-2">Account Linked Successfully!</h1>
            <p className="text-green-700">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-red-900 mb-2">Linking Failed</h1>
            <p className="text-red-700">{message}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function OAuthRestorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OAuthRestoreContent />
    </Suspense>
  )
}