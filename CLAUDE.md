# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MFARelay is a full-stack SaaS application that monitors email accounts for Multi-Factor Authentication (MFA) codes and forwards them via Twilio SMS. It features a **multi-tenant architecture** using a shared Supabase database with proper Row Level Security (RLS) for data isolation.

## Architecture Overview

```
Frontend (Next.js) → Supabase Auth → API (FastAPI) → Email Monitoring (Python)
                         ↓
                  Shared Database (PostgreSQL)
                    Project Isolation
```

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
```

### Backend API (FastAPI)
```bash
# Install API dependencies
pip install -r api/requirements.txt

# Run development server
cd api && uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Legacy Python Service
```bash
# Install core dependencies
pip install -r requirements.txt

# Run standalone service (legacy)
python src/main.py
```

## Multi-Tenant Database Schema

### Key Tables
- **`projects`**: Project isolation (`mfa-relay`, other apps)
- **`project_users`**: User-to-project relationships with roles
- **`mfa_email_accounts`**: User email configurations (OAuth/IMAP)
- **`mfa_sms_config`**: User Twilio SMS settings
- **`mfa_codes_log`**: Processed MFA codes with status tracking

### Row Level Security (RLS)
All tables use RLS policies to ensure users can only access their own data within their assigned projects. Data is automatically isolated by `project_id` and `user_id`.

**⚠️ CRITICAL**: RLS policies can block authenticated users from accessing data. If you encounter empty results or 403/406 errors, check RLS policies first.

**Comprehensive Documentation**: See **[MFA_RELAY_LEARNINGS.md](MFA_RELAY_LEARNINGS.md)** for detailed troubleshooting guides, RLS solutions, authentication patterns, and deployment procedures learned during this project.

## Configuration

### Environment Variables
```bash
# Supabase (shared database)
NEXT_PUBLIC_SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret

# API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Deployment

### Vercel (Frontend)
- **Production URL**: `https://mfa-relay.remote2me.com` (stable domain)
- Automatic deployment via GitHub Actions
- Environment variables configured in Vercel dashboard
- Custom domain configured with Name.com DNS (A record: 76.76.21.21)
- See `DEPLOYMENT.md` for detailed setup

### Railway/DigitalOcean (API)
- Containerized FastAPI backend
- Auto-scaling based on user demand
- Database connections via Supabase

## Core Components

### Frontend (`frontend/`)
- **`src/app/`**: Next.js App Router pages
- **`src/components/`**: Reusable React components
- **`src/lib/supabase.ts`**: Supabase client and database types
- **`src/hooks/useAuth.ts`**: Authentication state management

### API (`api/`)
- **`main.py`**: FastAPI application with multi-tenant user management
- **JWT Authentication**: Validates Supabase tokens
- **User Isolation**: Automatic project-based data filtering

### Core Services (`src/`)
- **`core/mfa_relay.py`**: Multi-user email monitoring orchestration
- **`email/email_monitor.py`**: IMAP monitoring with state tracking
- **`sms/twilio_client.py`**: Async Twilio SMS client
- **`config/config_manager.py`**: Configuration with encryption support

## Authentication Flow

1. **User Signup**: Via Supabase Auth (Google/Microsoft OAuth or email)
2. **Auto-Assignment**: Trigger adds user to `mfa-relay` project
3. **JWT Validation**: API validates Supabase tokens
4. **Data Access**: RLS policies enforce project-based isolation

## Key Design Patterns

- **Multi-Tenancy**: Shared database with project-based isolation
- **Row Level Security**: Database-enforced data access control
- **Async Processing**: Non-blocking email monitoring and SMS sending
- **OAuth Integration**: Secure email access via Google/Microsoft APIs
- **Real-time Updates**: Supabase real-time subscriptions for UI updates

## Microsoft OAuth Setup (Azure AD)

### Creating App Registration with Azure CLI
```bash
# Create app registration for Microsoft OAuth
az ad app create \
  --display-name "MFA Relay" \
  --sign-in-audience "AzureADandPersonalMicrosoftAccount" \
  --web-redirect-uris "https://grglttyirzxfdpbyuxut.supabase.co/auth/v1/callback" \
  --required-resource-accesses '[{
    "resourceAppId":"00000003-0000-0000-c000-000000000000",
    "resourceAccess":[
      {"id":"e1fe6dd8-ba31-4d61-89e7-88639da4683d","type":"Scope"},
      {"id":"37f7f235-527c-4136-accd-4a02d197296e","type":"Scope"}
    ]
  }]'

# Create client secret (2-year expiration)
az ad app credential reset \
  --id "APP_ID" \
  --display-name "MFA Relay Client Secret" \
  --years 2

# Enable implicit ID token flow (required for Supabase)
az rest --method PATCH \
  --uri "https://graph.microsoft.com/v1.0/applications/OBJECT_ID" \
  --body '{"web":{"implicitGrantSettings":{"enableIdTokenIssuance":true,"enableAccessTokenIssuance":false}}}'
```

### Current App Registration Details
- **App ID**: `[Stored in oauth-credentials.json]`
- **Client Secret**: `[Stored in oauth-credentials.json]` (expires in 2 years)
- **Tenant ID**: `[Stored in oauth-credentials.json]`
- **Redirect URIs**:
  - `https://grglttyirzxfdpbyuxut.supabase.co/auth/v1/callback`
  - `https://mfa-relay-frontend-4dv2e36v9-teds-projects-d50f6fce.vercel.app/auth/callback`
- **Audience**: Personal and work Microsoft accounts
- **Implicit Flow**: ID tokens enabled

### Key Learnings
- Use `AzureADandPersonalMicrosoftAccount` for both personal and work Microsoft accounts
- Supabase requires the redirect URI format: `https://PROJECT_REF.supabase.co/auth/v1/callback`
- Must enable implicit ID token issuance for OAuth to work with Supabase
- Azure CLI `--set` syntax doesn't work for nested objects; use Graph API directly
- Required scopes: `User.Read` (e1fe6dd8) and `openid` (37f7f235) for basic profile access

## Google OAuth Setup

### Current Google OAuth App Details
- **Client ID**: `[Stored in oauth-credentials.json]`
- **Client Secret**: `[Stored in oauth-credentials.json]` (expires June 2025)
- **Project ID**: `mfa-relay-oauth`
- **Redirect URI**: `https://grglttyirzxfdpbyuxut.supabase.co/auth/v1/callback`

### OAuth Credentials Storage
- All OAuth credentials are stored in `oauth-credentials.json` (gitignored)
- Includes Google, Microsoft, Supabase, and deployment credentials
- File format includes expiration dates and important notes

## Development Notes

- **Shared Database**: Multiple projects share the same Supabase instance
- **Project Namespace**: All data is isolated by `project_id = 'mfa-relay'`
- **Encryption**: Sensitive data (tokens, passwords) encrypted at rest
- **Rate Limiting**: SMS usage tracking per user/month
- **Error Handling**: Comprehensive logging and error tracking
- **Scalability**: Async architecture supports multiple concurrent users