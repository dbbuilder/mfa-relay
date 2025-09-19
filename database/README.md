# Database Setup Instructions

## RLS Policy Issue Fix

The MFA Relay project already exists in the database, but Row Level Security (RLS) policies are preventing authenticated users from reading it. The error "duplicate key value violates unique constraint" confirms the project exists.

### Option 1: Fix RLS Policies (Recommended)

1. Go to your Supabase dashboard → SQL Editor
2. Copy and paste the contents of `get-existing-project.sql`
3. Execute the script

This will:
- Show the existing MFA Relay project details
- Update RLS policies to allow authenticated users to read/write projects
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