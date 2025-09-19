'use client'

import { useEffect } from 'react'

export default function OAuthSuccessPage() {
  useEffect(() => {
    // Close the popup window after a short delay
    setTimeout(() => {
      window.close()
    }, 2000)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-green-900 mb-2">Email Account Connected!</h1>
        <p className="text-green-700 mb-4">Your email account has been successfully linked.</p>
        <p className="text-sm text-green-600">This window will close automatically...</p>
      </div>
    </div>
  )
}