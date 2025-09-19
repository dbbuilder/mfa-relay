-- Fix RLS policies for all MFA Relay tables (UUID primary keys)
-- Run this script in Supabase SQL Editor to allow authenticated users access

-- ======================
-- PROJECTS TABLE
-- ======================
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can read projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can read projects" ON projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update projects" ON projects
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions (no sequence needed for UUID primary keys)
GRANT SELECT, INSERT, UPDATE ON projects TO authenticated;

-- ======================
-- MFA_EMAIL_ACCOUNTS TABLE
-- ======================
DROP POLICY IF EXISTS "Users can manage their email accounts" ON mfa_email_accounts;
DROP POLICY IF EXISTS "Users can read their email accounts" ON mfa_email_accounts;
DROP POLICY IF EXISTS "Users can create email accounts" ON mfa_email_accounts;
DROP POLICY IF EXISTS "Users can update their email accounts" ON mfa_email_accounts;
DROP POLICY IF EXISTS "Users can delete their email accounts" ON mfa_email_accounts;

-- Allow authenticated users to manage email accounts
CREATE POLICY "Users can read email accounts" ON mfa_email_accounts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create email accounts" ON mfa_email_accounts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update email accounts" ON mfa_email_accounts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete email accounts" ON mfa_email_accounts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON mfa_email_accounts TO authenticated;

-- ======================
-- MFA_SMS_CONFIG TABLE
-- ======================
-- Check if table exists first
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mfa_sms_config') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can manage their sms config" ON mfa_sms_config;
        DROP POLICY IF EXISTS "Users can read their sms config" ON mfa_sms_config;
        DROP POLICY IF EXISTS "Users can create sms config" ON mfa_sms_config;
        DROP POLICY IF EXISTS "Users can update their sms config" ON mfa_sms_config;

        -- Create new policies
        EXECUTE 'CREATE POLICY "Users can read sms config" ON mfa_sms_config
          FOR SELECT TO authenticated
          USING (auth.uid() = user_id)';

        EXECUTE 'CREATE POLICY "Users can create sms config" ON mfa_sms_config
          FOR INSERT TO authenticated
          WITH CHECK (auth.uid() = user_id)';

        EXECUTE 'CREATE POLICY "Users can update sms config" ON mfa_sms_config
          FOR UPDATE TO authenticated
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id)';

        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE ON mfa_sms_config TO authenticated;

        RAISE NOTICE 'Updated mfa_sms_config policies';
    ELSE
        RAISE NOTICE 'mfa_sms_config table does not exist, skipping';
    END IF;
END
$$;

-- ======================
-- MFA_CODES_LOG TABLE
-- ======================
-- Check if table exists first
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mfa_codes_log') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can read their codes log" ON mfa_codes_log;
        DROP POLICY IF EXISTS "Users can create codes log" ON mfa_codes_log;

        -- Create new policies
        EXECUTE 'CREATE POLICY "Users can read codes log" ON mfa_codes_log
          FOR SELECT TO authenticated
          USING (auth.uid() = user_id)';

        EXECUTE 'CREATE POLICY "Users can create codes log" ON mfa_codes_log
          FOR INSERT TO authenticated
          WITH CHECK (auth.uid() = user_id)';

        -- Grant permissions
        GRANT SELECT, INSERT ON mfa_codes_log TO authenticated;

        RAISE NOTICE 'Updated mfa_codes_log policies';
    ELSE
        RAISE NOTICE 'mfa_codes_log table does not exist, skipping';
    END IF;
END
$$;

-- ======================
-- PROJECT_USERS TABLE
-- ======================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_users') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can read project assignments" ON project_users;
        DROP POLICY IF EXISTS "Users can create project assignments" ON project_users;

        -- Create new policies
        EXECUTE 'CREATE POLICY "Users can read project assignments" ON project_users
          FOR SELECT TO authenticated
          USING (auth.uid() = user_id)';

        EXECUTE 'CREATE POLICY "Users can create project assignments" ON project_users
          FOR INSERT TO authenticated
          WITH CHECK (auth.uid() = user_id)';

        -- Grant permissions
        GRANT SELECT, INSERT ON project_users TO authenticated;

        RAISE NOTICE 'Updated project_users policies';
    ELSE
        RAISE NOTICE 'project_users table does not exist, skipping';
    END IF;
END
$$;

-- ======================
-- ENABLE RLS ON ALL TABLES
-- ======================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_email_accounts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mfa_sms_config') THEN
        ALTER TABLE mfa_sms_config ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mfa_codes_log') THEN
        ALTER TABLE mfa_codes_log ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_users') THEN
        ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- ======================
-- VERIFICATION QUERIES
-- ======================
-- Show all policies created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('projects', 'mfa_email_accounts', 'mfa_sms_config', 'mfa_codes_log', 'project_users')
ORDER BY tablename, policyname;

-- Show table permissions for authenticated role
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('projects', 'mfa_email_accounts', 'mfa_sms_config', 'mfa_codes_log', 'project_users')
  AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;

-- Test queries (these should work after running this script)
SELECT 'Testing projects access...' as test, COUNT(*) as count FROM projects;
SELECT 'Testing email accounts access...' as test, COUNT(*) as count FROM mfa_email_accounts;

-- Show which tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('projects', 'mfa_email_accounts', 'mfa_sms_config', 'mfa_codes_log', 'project_users')
ORDER BY table_name;

RAISE NOTICE 'RLS policies have been updated for all existing MFA Relay tables';