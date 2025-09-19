import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// MFA Relay project ID - this ensures we only work with our project data
export const MFA_RELAY_PROJECT_SLUG = 'mfa-relay'

// Helper to get MFA Relay project ID
export async function getMFARelayProjectId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('slug', MFA_RELAY_PROJECT_SLUG)
    .single()

  if (error) {
    console.error('Error fetching MFA Relay project:', error)
    return null
  }

  return data?.id || null
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