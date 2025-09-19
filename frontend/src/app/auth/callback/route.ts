import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const from = searchParams.get('from') // Check if this is from add-email flow

  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('OAuth callback received:', {
    url: request.url,
    origin,
    code: code ? code.substring(0, 8) + '...' : null,
    error,
    errorDescription,
    next
  })

  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error}`)
  }

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set(name, value, options)
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )

    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      console.log('Code exchange result:', {
        success: !!data.session,
        hasUser: !!data.user,
        error: exchangeError?.message || null
      })

      if (!exchangeError && data.session) {
        console.log('Session established successfully, redirecting to:', `${origin}${next}`)

        // Always create OAuth email account for MFA Relay project
        if (data.user && data.session.provider_token) {
          try {
            // Use the known project ID (same as in supabase.ts)
            const projectId = '3a7fa9e5-268e-4a88-a525-3690f0d13e0a'

            // Check if this OAuth account already exists
            const { data: existing } = await supabase
              .from('mfa_email_accounts')
              .select('id')
              .eq('project_id', projectId)
              .eq('email_address', data.user.email)
              .eq('oauth_provider', data.session.provider)
              .single()

            if (!existing) {
              // Create OAuth email account linked to the OAuth user
              const { error: insertError } = await supabase
                .from('mfa_email_accounts')
                .insert({
                  project_id: projectId,
                  user_id: data.user.id, // This is the OAuth user's ID
                  name: `${data.user.email} (OAuth)`,
                  email_address: data.user.email,
                  provider: data.session.provider === 'google' ? 'gmail' : 'outlook',
                  oauth_provider: data.session.provider,
                  oauth_token_encrypted: data.session.provider_token,
                  oauth_refresh_token_encrypted: data.session.refresh_token,
                  use_ssl: true,
                  folder_name: 'INBOX',
                  is_active: true,
                  check_interval_seconds: 30
                })

              if (insertError) {
                console.error('Failed to create OAuth email account:', insertError)
              } else {
                console.log('OAuth email account created successfully for user:', data.user.email)
              }
            } else {
              console.log('OAuth email account already exists for:', data.user.email)
            }
          } catch (err) {
            console.error('Error creating OAuth email account:', err)
          }
        }

        return response
      } else {
        console.error('Session exchange failed:', exchangeError?.message)
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
      }
    } catch (err) {
      console.error('Exception during code exchange:', err)
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }
  }

  // return the user to an error page with instructions
  console.log('No code provided, redirecting to error page')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}