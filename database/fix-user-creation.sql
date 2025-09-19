-- Fix script for user creation issues in MFA Relay
-- Run this in Supabase SQL Editor to resolve database trigger problems

-- First, ensure the MFA Relay project exists
INSERT INTO projects (name, slug, settings)
VALUES (
    'MFA Relay',
    'mfa-relay',
    '{"max_email_accounts": 5, "max_sms_per_month": 1000}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Create or replace the function with better error handling
CREATE OR REPLACE FUNCTION add_user_to_mfa_relay_project()
RETURNS TRIGGER AS $$
DECLARE
    project_uuid UUID;
BEGIN
    -- Get the MFA Relay project ID
    SELECT id INTO project_uuid
    FROM projects
    WHERE slug = 'mfa-relay'
    LIMIT 1;

    -- If project doesn't exist, log and return
    IF project_uuid IS NULL THEN
        RAISE WARNING 'MFA Relay project not found with slug: mfa-relay';
        RETURN NEW;
    END IF;

    -- Add user to MFA Relay project
    INSERT INTO project_users (project_id, user_id, role, created_at)
    VALUES (project_uuid, NEW.id, 'user', NOW())
    ON CONFLICT (project_id, user_id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to add user % to MFA Relay project: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure proper permissions for the function
ALTER FUNCTION add_user_to_mfa_relay_project() OWNER TO postgres;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_add_to_mfa_relay ON auth.users;
CREATE TRIGGER on_auth_user_created_add_to_mfa_relay
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION add_user_to_mfa_relay_project();

-- Verify the setup
SELECT 'Setup Verification:' as status,
       p.id as project_id,
       p.name as project_name,
       p.slug as project_slug
FROM projects p
WHERE p.slug = 'mfa-relay';

-- Show trigger status
SELECT 'Trigger Status:' as status,
       tgname as trigger_name,
       tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created_add_to_mfa_relay';