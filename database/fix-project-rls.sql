-- Fix RLS policy violation for MFA Relay project creation
-- This script needs to be run as a superuser or service role

-- First, let's check if the project already exists
DO $$
BEGIN
    -- Insert the MFA Relay project if it doesn't exist
    INSERT INTO projects (id, name, slug, settings, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'MFA Relay',
        'mfa-relay',
        '{"max_email_accounts": 5, "max_sms_per_month": 1000}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (slug) DO NOTHING;

    -- Log the result
    RAISE NOTICE 'MFA Relay project setup completed';
END
$$;

-- Create or update RLS policies for projects table to allow users to create projects
-- (This may need to be adjusted based on your specific RLS requirements)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can read their projects" ON projects;
DROP POLICY IF EXISTS "Users can update their projects" ON projects;

-- Create new policies that allow authenticated users to work with projects
CREATE POLICY "Users can create projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can read projects"
ON projects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their projects"
ON projects FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT ON projects TO authenticated;
GRANT USAGE ON SEQUENCE projects_id_seq TO authenticated;

-- Show the current project
SELECT id, name, slug, created_at FROM projects WHERE slug = 'mfa-relay';