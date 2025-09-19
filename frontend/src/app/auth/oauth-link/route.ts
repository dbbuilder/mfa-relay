import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const user_id = searchParams.get('user_id')
  const project_id = searchParams.get('project_id')

  console.log('OAuth link callback received:', {
    url: request.url,
    origin,
    code: code ? code.substring(0, 8) + '...' : null,
    error,
    errorDescription,
    user_id,
    project_id
  })

  if (error) {
    console.error('OAuth link error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/auth/oauth-error?error=${error}`)
  }

  if (code && user_id && project_id) {
    const response = NextResponse.redirect(`${origin}/auth/oauth-success`)

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
      // Exchange code for session in a temporary context
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (!exchangeError && data.session && data.user) {
        console.log('OAuth exchange successful, linking email account')

        // Check if this OAuth account already exists for this user
        const { data: existing } = await supabase
          .from('mfa_email_accounts')
          .select('id')
          .eq('project_id', project_id)
          .eq('user_id', user_id)
          .eq('email_address', data.user.email)
          .eq('oauth_provider', data.session.provider)
          .single()

        if (!existing) {
          // Create OAuth email account linked to the original user
          const { error: insertError } = await supabase
            .from('mfa_email_accounts')
            .insert({
              project_id: project_id,
              user_id: user_id, // Link to the original user, not the OAuth user
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
            return NextResponse.redirect(`${origin}/auth/oauth-error?error=database_error`)
          } else {
            console.log('OAuth email account linked successfully')
            return response
          }
        } else {
          console.log('OAuth email account already exists for this user')
          return response
        }
      } else {
        console.error('OAuth session exchange failed:', exchangeError?.message)
        return NextResponse.redirect(`${origin}/auth/oauth-error?error=exchange_failed`)
      }
    } catch (err) {
      console.error('Exception during OAuth link:', err)
      return NextResponse.redirect(`${origin}/auth/oauth-error?error=exception`)
    }
  }

  console.log('Invalid OAuth link parameters')
  return NextResponse.redirect(`${origin}/auth/oauth-error?error=invalid_params`)
}