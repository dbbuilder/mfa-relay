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

// Helper to get MFA Relay project ID
export async function getMFARelayProjectId(): Promise<string | null> {
  console.log('getMFARelayProjectId: Starting query...')
  try {
    // First try to get existing project
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', MFA_RELAY_PROJECT_SLUG)

    console.log('getMFARelayProjectId: Query result:', { data, error: error?.message, count: data?.length })

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching MFA Relay project:', error)
      return null
    }

    // If we found the project, return its ID
    if (data && data.length > 0) {
      console.log('getMFARelayProjectId: Found existing project:', data[0].id)
      return data[0].id
    }

    // If no project found, create it
    console.log('getMFARelayProjectId: No project found, creating...')
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert({
        name: 'MFA Relay',
        slug: MFA_RELAY_PROJECT_SLUG,
        settings: { max_email_accounts: 5, max_sms_per_month: 1000 }
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating MFA Relay project:', createError)
      return null
    }

    console.log('getMFARelayProjectId: Created project:', newProject?.id)
    return newProject?.id || null
  } catch (err) {
    console.error('getMFARelayProjectId: Exception:', err)
    return null
  }
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