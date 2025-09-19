-- MFA Relay Multi-Tenant Database Schema
-- This schema is designed for a shared Supabase database with multiple projects

-- ============================================================================
-- PROJECTS TABLE - Isolates different applications using this shared database
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- e.g., 'mfa-relay', 'other-app'
    domain TEXT, -- Optional: restrict to specific domains
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Insert MFA Relay project
INSERT INTO projects (id, name, slug, settings)
VALUES (
    'mfa-relay-001',
    'MFA Relay',
    'mfa-relay',
    '{"max_email_accounts": 5, "max_sms_per_month": 1000}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PROJECT USERS - Links auth.users to specific projects with roles
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Ensure a user can only be in a project once
    UNIQUE(project_id, user_id)
);

-- ============================================================================
-- MFA RELAY SPECIFIC TABLES
-- ============================================================================

-- Email Accounts - stores user's email configurations
CREATE TABLE IF NOT EXISTS mfa_email_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Email Configuration
    name TEXT NOT NULL, -- e.g., "Personal Gmail"
    email_address TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'gmail', 'outlook', 'imap'
    -- OAuth or App Password Data (encrypted)
    oauth_provider TEXT, -- 'google', 'microsoft', null for IMAP
    oauth_token_encrypted TEXT, -- Encrypted OAuth token
    app_password_encrypted TEXT, -- Encrypted app password for IMAP
    -- IMAP Settings (for manual setup)
    imap_host TEXT,
    imap_port INTEGER,
    use_ssl BOOLEAN DEFAULT true,
    folder_name TEXT DEFAULT 'INBOX',
    -- Status and Monitoring
    is_active BOOLEAN DEFAULT true,
    last_checked_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    check_interval_seconds INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure user can't add duplicate email addresses
    UNIQUE(project_id, user_id, email_address)
);

-- SMS Configuration - Twilio settings per user
CREATE TABLE IF NOT EXISTS mfa_sms_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Twilio Configuration (encrypted)
    twilio_account_sid_encrypted TEXT,
    twilio_auth_token_encrypted TEXT,
    twilio_from_number TEXT,
    twilio_to_number TEXT,
    -- SMS Limits and Usage
    monthly_sms_limit INTEGER DEFAULT 100,
    current_month_usage INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- One SMS config per user per project
    UNIQUE(project_id, user_id)
);

-- MFA Codes Log - tracks found and sent codes
CREATE TABLE IF NOT EXISTS mfa_codes_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_account_id UUID REFERENCES mfa_email_accounts(id) ON DELETE SET NULL,
    -- Code Information
    mfa_code TEXT NOT NULL,
    sender_email TEXT,
    email_subject TEXT,
    detected_service TEXT, -- e.g., 'Google', 'GitHub', 'AWS'
    -- Processing Status
    status TEXT NOT NULL DEFAULT 'detected', -- 'detected', 'sent', 'failed'
    sms_sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    -- Timing
    email_received_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_sms_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_codes_log ENABLE ROW LEVEL SECURITY;

-- Projects: Only accessible by authenticated users who are members
CREATE POLICY "Users can view projects they belong to" ON projects
    FOR SELECT USING (
        id IN (
            SELECT project_id FROM project_users
            WHERE user_id = auth.uid()
        )
    );

-- Project Users: Users can only see their own project memberships
CREATE POLICY "Users can view their own project memberships" ON project_users
    FOR SELECT USING (user_id = auth.uid());

-- MFA Email Accounts: Users can only access their own accounts in their projects
CREATE POLICY "Users can manage their own email accounts" ON mfa_email_accounts
    FOR ALL USING (
        user_id = auth.uid()
        AND project_id IN (
            SELECT project_id FROM project_users
            WHERE user_id = auth.uid()
        )
    );

-- MFA SMS Config: Users can only access their own SMS config in their projects
CREATE POLICY "Users can manage their own SMS config" ON mfa_sms_config
    FOR ALL USING (
        user_id = auth.uid()
        AND project_id IN (
            SELECT project_id FROM project_users
            WHERE user_id = auth.uid()
        )
    );

-- MFA Codes Log: Users can only see their own codes in their projects
CREATE POLICY "Users can view their own MFA codes log" ON mfa_codes_log
    FOR SELECT USING (
        user_id = auth.uid()
        AND project_id IN (
            SELECT project_id FROM project_users
            WHERE user_id = auth.uid()
        )
    );

-- Function to automatically add users to MFA Relay project on signup
CREATE OR REPLACE FUNCTION add_user_to_mfa_relay_project()
RETURNS TRIGGER AS $$
BEGIN
    -- Add user to MFA Relay project
    INSERT INTO project_users (project_id, user_id, role)
    VALUES (
        (SELECT id FROM projects WHERE slug = 'mfa-relay' LIMIT 1),
        NEW.id,
        'user'
    ) ON CONFLICT (project_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-add users to MFA Relay project
DROP TRIGGER IF EXISTS on_auth_user_created_add_to_mfa_relay ON auth.users;
CREATE TRIGGER on_auth_user_created_add_to_mfa_relay
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION add_user_to_mfa_relay_project();