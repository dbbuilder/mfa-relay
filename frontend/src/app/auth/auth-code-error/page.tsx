'use client'

import Link from 'next/link'
import { Shield, AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 text-indigo-600" />
            <span className="ml-3 text-2xl font-bold text-gray-900">MFA Relay</span>
          </div>
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Authentication Error
          </h2>
          <p className="text-gray-600 mb-6">
            There was an error processing your authentication. This could be due to:
          </p>
          <ul className="text-left text-gray-600 mb-6 space-y-2">
            <li>• The authentication session expired</li>
            <li>• An invalid or missing authorization code</li>
            <li>• A temporary issue with the OAuth provider</li>
          </ul>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <div className="space-y-4">
            <Link
              href="/auth/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            If this problem persists, please contact support
          </p>
        </div>
      </div>
    </div>
  )
}