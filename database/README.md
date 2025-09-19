# Database Setup Instructions

## RLS Policy Issue Fix

The application is encountering a Row Level Security (RLS) policy violation when trying to create the MFA Relay project. This happens because the current RLS policies on the `projects` table don't allow authenticated users to create new projects.

### Option 1: Run SQL Script Manually (Recommended)

1. Go to your Supabase dashboard → SQL Editor
2. Copy and paste the contents of `fix-project-rls.sql`
3. Execute the script

This will:
- Create the MFA Relay project with proper permissions
- Update RLS policies to allow project operations
- Grant necessary permissions to authenticated users

### Option 2: Use Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to the project directory
cd /mnt/d/dev2/mfa-relay

# Run the SQL script
supabase db push --include-all
```

### Option 3: Fallback Mode (Automatic)

The application now includes fallback logic that will:
- Use a fixed UUID (`550e8400-e29b-41d4-a716-446655440000`) when RLS prevents creation
- Cache the project ID to avoid repeated queries
- Continue functioning even if the database setup is incomplete

### What the Script Does

```sql
-- Creates the MFA Relay project
INSERT INTO projects (id, name, slug, settings)
VALUES (gen_random_uuid(), 'MFA Relay', 'mfa-relay', '{"max_email_accounts": 5, "max_sms_per_month": 1000}');

-- Updates RLS policies to allow:
-- - Users can create projects
-- - Users can read projects
-- - Users can update projects

-- Grants permissions:
-- - SELECT, INSERT on projects table
-- - USAGE on sequence for ID generation
```

### Verifying the Fix

After running the script, you should see in the console logs:
```
getMFARelayProjectId: Found existing project: [some-uuid]
```

Instead of:
```
Error creating MFA Relay project: new row violates row-level security policy for table "projects"
```

### Current Status

The application will now work in fallback mode, but running the SQL script will provide the proper database setup for production use.