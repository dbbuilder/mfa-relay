'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function OAuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    // Close the popup window after a delay
    setTimeout(() => {
      window.close()
    }, 5000)
  }, [])

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'database_error':
        return 'Failed to save email account. Please try again.'
      case 'exchange_failed':
        return 'OAuth authentication failed. Please try again.'
      case 'invalid_params':
        return 'Invalid OAuth parameters. Please try again.'
      case 'exception':
        return 'An unexpected error occurred. Please try again.'
      default:
        return 'OAuth connection failed. Please try again.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-900 mb-2">Connection Failed</h1>
        <p className="text-red-700 mb-4">{getErrorMessage(error)}</p>
        <p className="text-sm text-red-600">This window will close automatically...</p>
      </div>
    </div>
  )
}

export default function OAuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-red-600">Loading...</p>
        </div>
      </div>
    }>
      <OAuthErrorContent />
    </Suspense>
  )
}