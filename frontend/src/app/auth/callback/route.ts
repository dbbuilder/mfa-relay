import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('OAuth callback received:', { code: !!code, error, errorDescription })

  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error}`)
  }

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Code exchange result:', { success: !!data.session, error: exchangeError })

    if (!exchangeError && data.session) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      const redirectUrl = isLocalEnv
        ? `${origin}${next}`
        : forwardedHost
          ? `https://${forwardedHost}${next}`
          : `${origin}${next}`

      console.log('Redirecting to:', redirectUrl)

      // Set session cookie before redirect
      const response = NextResponse.redirect(redirectUrl)
      response.cookies.set('supabase-auth-token', data.session.access_token, {
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        maxAge: data.session.expires_in
      })

      return response
    } else {
      console.error('Session exchange failed:', exchangeError)
    }
  }

  // return the user to an error page with instructions
  console.log('No code provided, redirecting to error page')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}