-- Check if the MFA Relay project already exists and get its ID
SELECT id, name, slug, settings, created_at, updated_at
FROM projects
WHERE slug = 'mfa-relay';

-- If the project exists, we just need to fix the RLS policies
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
GRANT SELECT, INSERT, UPDATE ON projects TO authenticated;
GRANT USAGE ON SEQUENCE projects_id_seq TO authenticated;

-- Show the project again to confirm
SELECT id, name, slug, created_at FROM projects WHERE slug = 'mfa-relay';