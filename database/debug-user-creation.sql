-- Debug script for user creation issues
-- Run this in Supabase SQL Editor to diagnose the problem

-- 1. Check if MFA Relay project exists
SELECT 'MFA Relay Project Check:' as check_type,
       CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status,
       COUNT(*) as count
FROM projects WHERE slug = 'mfa-relay';

-- 2. Show all projects
SELECT 'All Projects:' as check_type, id, name, slug, created_at
FROM projects
ORDER BY created_at;

-- 3. Check if trigger function exists
SELECT 'Trigger Function Check:' as check_type,
       CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status
FROM pg_proc
WHERE proname = 'add_user_to_mfa_relay_project';

-- 4. Check if trigger exists
SELECT 'Trigger Check:' as check_type,
       CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created_add_to_mfa_relay';

-- 5. Check recent auth.users entries (be careful with PII)
SELECT 'Recent Users Count:' as check_type, COUNT(*) as count
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 6. Check project_users table structure and recent entries
SELECT 'Project Users Count:' as check_type, COUNT(*) as count
FROM project_users;

-- 7. Test the function manually (this will show any errors)
-- DO NOT RUN THIS IF THERE ARE ACTUAL USERS - just for testing
-- SELECT add_user_to_mfa_relay_project() FROM projects WHERE slug = 'mfa-relay' LIMIT 1;