'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { Shield } from 'lucide-react'

interface AuthFormProps {
  view?: 'sign_in' | 'sign_up'
  redirectTo?: string
}

export default function AuthForm({ view = 'sign_in', redirectTo }: AuthFormProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 text-indigo-600" />
            <span className="ml-3 text-2xl font-bold text-gray-900">MFA Relay</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {view === 'sign_up' ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {view === 'sign_up'
              ? 'Start forwarding your MFA codes automatically'
              : 'Access your MFA code dashboard'
            }
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <Auth
            supabaseClient={supabase}
            view={view}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4f46e5',
                    brandAccent: '#4338ca',
                  },
                },
              },
              className: {
                container: 'space-y-4',
                button: 'w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                input: 'appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm',
                label: 'sr-only',
                message: 'text-red-600 text-sm mt-1',
              },
            }}
            localization={{
              variables: {
                sign_up: {
                  email_label: 'Email address',
                  password_label: 'Password',
                  button_label: 'Sign up',
                  loading_button_label: 'Signing up ...',
                  social_provider_text: 'Sign up with {{provider}}',
                  link_text: 'Don\'t have an account? Sign up',
                  confirmation_text: 'Check your email for the confirmation link',
                },
                sign_in: {
                  email_label: 'Email address',
                  password_label: 'Password',
                  button_label: 'Sign in',
                  loading_button_label: 'Signing in ...',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: 'Already have an account? Sign in',
                },
              },
            }}
            providers={['google', 'azure']}
            redirectTo={redirectTo || (typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '/dashboard')}
            onlyThirdPartyProviders={false}
            showLinks={true}
            magicLink={true}
          />
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing {view === 'sign_up' ? 'up' : 'in'}, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}