import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    get(name: string) {
      // Try to get cookie from document
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
        return match ? match[2] : undefined
      }
      return undefined
    },
    set(name: string, value: string, options: any) {
      if (typeof document !== 'undefined') {
        let cookie = `${name}=${value}`
        if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`
        if (options?.path) cookie += `; Path=${options.path}`
        if (options?.domain) cookie += `; Domain=${options.domain}`
        if (options?.secure) cookie += '; Secure'
        if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`
        document.cookie = cookie
      }
    },
    remove(name: string, options: any) {
      if (typeof document !== 'undefined') {
        document.cookie = `${name}=; Max-Age=0; Path=${options?.path || '/'}`
      }
    }
  }
})

// MFA Relay project ID - this ensures we only work with our project data
export const MFA_RELAY_PROJECT_SLUG = 'mfa-relay'

// Fallback project ID for when RLS prevents creation but project exists
let CACHED_PROJECT_ID: string | null = null

// Helper to get MFA Relay project ID
export async function getMFARelayProjectId(): Promise<string | null> {
  console.log('🚀 getMFARelayProjectId: v2025-09-19 CACHE-BUST - Starting...')

  // Return cached ID if available
  if (CACHED_PROJECT_ID) {
    console.log('🚀 getMFARelayProjectId: v2025-09-19 CACHE-BUST - Using cached project ID:', CACHED_PROJECT_ID)
    return CACHED_PROJECT_ID
  }

  // Use known project ID immediately since RLS blocks anonymous access
  // We confirmed via curl that the project exists but RLS prevents reading it
  const knownProjectId = '3a7fa9e5-268e-4a88-a525-3690f0d13e0a'
  CACHED_PROJECT_ID = knownProjectId
  console.log('🚀 getMFARelayProjectId: v2025-09-19 CACHE-BUST - Using known project ID (RLS bypass):', knownProjectId)
  return knownProjectId

  // Note: The code below is commented out because RLS policies prevent anonymous access
  // This causes the JavaScript client to hang waiting for data that will never come
  /*
  try {
    // Quick test with minimal timeout
    const selectPromise = supabase
      .from('projects')
      .select('id')
      .eq('slug', MFA_RELAY_PROJECT_SLUG)

    const selectTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('RLS timeout - using known ID')), 1000)
    )

    const { data, error } = await Promise.race([selectPromise, selectTimeout]) as any

    console.log('getMFARelayProjectId: Query result:', { data, error: error?.message, count: data?.length })

    // If we found the project, cache and return its ID
    if (data && data.length > 0) {
      CACHED_PROJECT_ID = data[0].id
      console.log('getMFARelayProjectId: Found existing project:', data[0].id)
      return data[0].id
    }

    // If empty result (RLS blocking), use known ID
    if (data && data.length === 0) {
      CACHED_PROJECT_ID = knownProjectId
      console.log('getMFARelayProjectId: RLS blocking access, using known ID:', knownProjectId)
      return knownProjectId
    }

    return knownProjectId
  } catch (err) {
    console.error('getMFARelayProjectId: Using known ID due to error:', err)
    CACHED_PROJECT_ID = knownProjectId
    return knownProjectId
  }
  */
}

// Database types for MFA Relay
export interface MFAEmailAccount {
  id: string
  project_id: string
  user_id: string
  name: string
  email_address: string
  provider: 'gmail' | 'outlook' | 'imap'
  oauth_provider?: 'google' | 'microsoft'
  oauth_token_encrypted?: string
  app_password_encrypted?: string
  imap_host?: string
  imap_port?: number
  use_ssl: boolean
  folder_name: string
  is_active: boolean
  last_checked_at?: string
  last_error?: string
  check_interval_seconds: number
  created_at: string
  updated_at: string
}

export interface MFASMSConfig {
  id: string
  project_id: string
  user_id: string
  twilio_account_sid_encrypted?: string
  twilio_auth_token_encrypted?: string
  twilio_from_number?: string
  twilio_to_number?: string
  monthly_sms_limit: number
  current_month_usage: number
  last_reset_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MFACodeLog {
  id: string
  project_id: string
  user_id: string
  email_account_id?: string
  mfa_code: string
  sender_email?: string
  email_subject?: string
  detected_service?: string
  status: 'detected' | 'sent' | 'failed'
  sms_sent_at?: string
  error_message?: string
  email_received_at?: string
  processed_at: string
  created_at: string
}