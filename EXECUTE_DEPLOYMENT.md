# 🚀 EXECUTE DEPLOYMENT - Step by Step

**IMPORTANT**: Follow these steps EXACTLY in order. Each step builds on the previous one.

## ✅ Prerequisites Check
- [ ] GitHub account with this repository
- [ ] Supabase account with shared database access
- [ ] Railway account (create at railway.app)
- [ ] Vercel account (create at vercel.com)

---

## 🗄️ STEP 1: Deploy Database Schema (5 minutes)

### Method A: Supabase SQL Editor (Recommended)
1. Go to: https://supabase.com/dashboard/project/grglttyirzxfdpbyuxut/sql
2. Open `database/schema.sql` from this repository
3. Copy the ENTIRE contents
4. Paste into Supabase SQL Editor
5. Click **"Run"** button
6. ✅ Verify: Should see "Success. No rows returned" (this is normal)

### Method B: Command Line (Alternative)
```bash
# Get database password from Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[PASSWORD]@db.grglttyirzxfdpbyuxut.supabase.co:5432/postgres" -f database/schema.sql
```

**⚠️ CRITICAL**: You MUST complete this step before proceeding!

---

## 🚂 STEP 2: Deploy API to Railway (10 minutes)

### 2.1 Create Railway Project
1. Go to: https://railway.app
2. Click **"Start a New Project"**
3. Choose **"Deploy from GitHub repo"**
4. Connect your GitHub account
5. Select this repository: `mfa-relay`
6. Railway will auto-detect the project

### 2.2 Configure Environment Variables
In Railway Dashboard → Your Project → Variables:
```
SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZ2x0dHlpcnp4ZmRwYnl1eHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MzUzNDgsImV4cCI6MjA2NzQxMTM0OH0.-ZU38fETcom_K3-tTBHjGVLcmG98_Fmt0XsBBRS38dM
SUPABASE_JWT_SECRET=[Get from Supabase: Settings → API → JWT Secret]
PYTHONPATH=/app
ENVIRONMENT=production
```

### 2.3 Deploy
1. Railway will automatically start building
2. Wait for build to complete (~5 minutes)
3. ✅ Test: Click the generated URL → should see `{"message": "MFA Relay API", "status": "running"}`
4. **📝 SAVE THIS URL** - you'll need it for frontend setup

---

## 🌐 STEP 3: Deploy Frontend to Vercel (5 minutes)

### 3.1 Create Vercel Project
1. Go to: https://vercel.com
2. Click **"Import Git Repository"**
3. Select this GitHub repository
4. **IMPORTANT**: Set **Root Directory** to `frontend`
5. Framework Preset: **Next.js** (should auto-detect)

### 3.2 Configure Environment Variables
In Vercel → Project Settings → Environment Variables:

**Add for Production, Preview, AND Development:**
```
NEXT_PUBLIC_SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZ2x0dHlpcnp4ZmRwYnl1eHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MzUzNDgsImV4cCI6MjA2NzQxMTM0OH0.-ZU38fETcom_K3-tTBHjGVLcmG98_Fmt0XsBBRS38dM
NEXT_PUBLIC_API_URL=[YOUR_RAILWAY_URL_FROM_STEP_2]
```

### 3.3 Deploy
1. Click **"Deploy"**
2. Wait for build (~3 minutes)
3. ✅ Test: Visit your Vercel URL → should see MFA Relay homepage

---

## 🔐 STEP 4: Configure OAuth Providers (10 minutes)

### 4.1 Supabase Auth Setup
1. Go to: https://supabase.com/dashboard/project/grglttyirzxfdpbyuxut/auth/providers

### 4.2 Google OAuth (Recommended)
1. **Enable Google Provider**
2. Get credentials from: https://console.cloud.google.com/apis/credentials
3. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Authorized redirect URIs: `https://grglttyirzxfdpbyuxut.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

### 4.3 Microsoft OAuth (Optional)
1. **Enable Azure Provider**
2. Get credentials from: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
3. Create App Registration:
   - Redirect URI: `https://grglttyirzxfdpbyuxut.supabase.co/auth/v1/callback`
4. Copy Application ID and Secret to Supabase

---

## ⚙️ STEP 5: Set Up GitHub Actions (5 minutes)

### 5.1 Add GitHub Secrets
Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Add these Repository Secrets:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZ2x0dHlpcnp4ZmRwYnl1eHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MzUzNDgsImV4cCI6MjA2NzQxMTM0OH0.-ZU38fETcom_K3-tTBHjGVLcmG98_Fmt0XsBBRS38dM

# Railway (from Railway Dashboard → Account → Tokens)
RAILWAY_TOKEN=[Create at railway.app/account/tokens]
RAILWAY_PROJECT_ID=[From Railway Project Settings → General]

# Vercel (from Vercel Dashboard → Settings)
VERCEL_TOKEN=[Create at vercel.com/account/tokens]
VERCEL_ORG_ID=[From Vercel Settings → General → Team ID]
VERCEL_PROJECT_ID=[From Project Settings → General → Project ID]
```

### 5.2 Test Auto-Deployment
1. Make a small change to any file
2. Commit and push to `main` branch
3. Check **GitHub Actions** tab → should see deployments running
4. ✅ Both Railway and Vercel should deploy automatically

---

## 🧪 STEP 6: Test Full Application (5 minutes)

### 6.1 Test Authentication
1. Visit your Vercel URL
2. Click **"Sign Up"**
3. Try Google OAuth login
4. ✅ Should redirect to dashboard after login

### 6.2 Test API Connection
1. In browser, visit: `[YOUR_RAILWAY_URL]/health`
2. ✅ Should return JSON with `"status": "healthy"`

### 6.3 Test Database Connection
1. Check Supabase Dashboard → Authentication → Users
2. ✅ Should see your test user after OAuth login

---

## 🎉 DEPLOYMENT COMPLETE!

### Your Live URLs
- **Frontend**: https://[your-project].vercel.app
- **API**: https://[your-project].railway.app
- **Database**: Supabase Dashboard

### Next Steps
- [ ] Set up custom domain (optional)
- [ ] Add email account configurations
- [ ] Configure Twilio SMS settings
- [ ] Add monitoring and alerts

---

## 🐛 Troubleshooting

### Common Issues

**Railway Build Fails**
```bash
# Check: Environment variables set correctly
# Check: API directory has main.py and requirements.txt
# Solution: Redeploy from Railway dashboard
```

**Vercel Build Fails**
```bash
# Check: Root directory set to "frontend"
# Check: Environment variables include NEXT_PUBLIC_*
# Solution: Check build logs in Vercel dashboard
```

**OAuth Not Working**
```bash
# Check: Redirect URLs match exactly in OAuth provider
# Check: Supabase providers enabled
# Check: Client IDs and secrets correct
```

**Database Errors**
```bash
# Check: Schema applied successfully
# Check: RLS policies enabled
# Solution: Re-run database/schema.sql
```

---

## 📞 Support

**Need Help?**
- Railway: https://railway.app/help
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs

**Success Criteria:**
✅ Database schema applied
✅ API returns healthy status
✅ Frontend loads and shows signup
✅ OAuth login works
✅ GitHub Actions deploy automatically

**🎯 Total Time: ~40 minutes**