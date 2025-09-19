import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

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