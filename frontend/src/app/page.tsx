'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Shield, Mail, Smartphone, ArrowRight } from 'lucide-react'

function OAuthRedirectHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if there's an OAuth code in the URL that should be handled by the callback
    const code = searchParams.get('code')
    if (code) {
      // Redirect to the proper callback handler
      router.replace(`/auth/callback?${searchParams.toString()}`)
    }
  }, [searchParams, router])

  return null
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Suspense fallback={null}>
        <OAuthRedirectHandler />
      </Suspense>
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">MFA Relay</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8">
            Never Miss an{' '}
            <span className="text-indigo-600">MFA Code</span>{' '}
            Again
            <span className="text-xs text-green-600 block mt-2">DEPLOY-FIXED-vaaf37c9-PROD</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Automatically forward multi-factor authentication codes from your email to SMS.
            Seamless, secure, and always reliable.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-white rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center shadow-lg">
              <Mail className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Connect Your Email
            </h3>
            <p className="text-gray-600">
              Securely connect your Gmail, Outlook, or any IMAP email account using OAuth or app passwords.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Automatic Detection
            </h3>
            <p className="text-gray-600">
              Our smart algorithm automatically detects MFA codes from popular services and authenticators.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center shadow-lg">
              <Smartphone className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Instant SMS Delivery
            </h3>
            <p className="text-gray-600">
              Get your MFA codes delivered instantly to your phone via SMS, anywhere in the world.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to streamline your authentication?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Join thousands of users who never miss an MFA code
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center bg-white hover:bg-gray-50 text-indigo-600 px-8 py-4 rounded-lg text-lg font-medium transition-colors"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-indigo-400" />
              <span className="ml-2 text-xl font-bold">MFA Relay</span>
            </div>
            <p className="text-gray-400">
              Secure, reliable, and always on. Your MFA codes, delivered instantly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}