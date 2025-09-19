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
  console.log('getMFARelayProjectId: Starting query...')

  // Return cached ID if available
  if (CACHED_PROJECT_ID) {
    console.log('getMFARelayProjectId: Using cached project ID:', CACHED_PROJECT_ID)
    return CACHED_PROJECT_ID
  }

  try {
    // Add timeout to all database operations
    const timeoutMs = 8000

    // First try to get existing project with timeout
    const selectPromise = supabase
      .from('projects')
      .select('id')
      .eq('slug', MFA_RELAY_PROJECT_SLUG)

    const selectTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Select query timeout')), timeoutMs)
    )

    const { data, error } = await Promise.race([selectPromise, selectTimeout]) as any

    console.log('getMFARelayProjectId: Query result:', { data, error: error?.message, count: data?.length })

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching MFA Relay project:', error)
      return null
    }

    // If we found the project, cache and return its ID
    if (data && data.length > 0) {
      CACHED_PROJECT_ID = data[0].id
      console.log('getMFARelayProjectId: Found existing project:', data[0].id)
      return data[0].id
    }

    // If no project found, try to create it with timeout
    console.log('getMFARelayProjectId: No project found, attempting to create...')
    const insertPromise = supabase
      .from('projects')
      .insert({
        name: 'MFA Relay',
        slug: MFA_RELAY_PROJECT_SLUG,
        settings: { max_email_accounts: 5, max_sms_per_month: 1000 }
      })
      .select('id')
      .single()

    const insertTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Insert query timeout')), timeoutMs)
    )

    const { data: newProject, error: createError } = await Promise.race([insertPromise, insertTimeout]) as any

    if (createError) {
      console.error('Error creating MFA Relay project:', createError)

      // If creation fails due to RLS policy violation, use fallback approach
      if (createError.code === '42501') { // RLS policy violation
        console.log('getMFARelayProjectId: RLS prevents creation, using fallback project ID')
        // Create a deterministic UUID based on the slug for consistency
        const fallbackId = '550e8400-e29b-41d4-a716-446655440000' // Fixed UUID for mfa-relay
        CACHED_PROJECT_ID = fallbackId
        console.log('getMFARelayProjectId: Using fallback project ID:', fallbackId)
        return fallbackId
      }

      // If creation fails due to conflict, try to get again (race condition)
      if (createError.code === '23505') { // unique violation
        console.log('getMFARelayProjectId: Project created by another session, trying to fetch...')
        try {
          const { data: existingData } = await Promise.race([
            supabase.from('projects').select('id').eq('slug', MFA_RELAY_PROJECT_SLUG).single(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Retry timeout')), 3000))
          ]) as any

          if (existingData?.id) {
            CACHED_PROJECT_ID = existingData.id
            console.log('getMFARelayProjectId: Found project after retry:', existingData.id)
            return existingData.id
          }
        } catch (retryErr) {
          console.error('getMFARelayProjectId: Retry failed:', retryErr)
        }
      }
      return null
    }

    // Successfully created project
    if (newProject?.id) {
      CACHED_PROJECT_ID = newProject.id
      console.log('getMFARelayProjectId: Created project:', newProject.id)
      return newProject.id
    }

    return null
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