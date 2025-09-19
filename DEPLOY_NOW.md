# 🚀 MFA Relay - Deploy Now Guide

Follow these exact steps to deploy your MFA Relay SaaS application.

## ✅ Prerequisites Completed
- ✅ Database schema created (`database/schema.sql`)
- ✅ Frontend built and tested
- ✅ API configured for multi-tenant deployment
- ✅ GitHub Actions workflows ready

---

## 🗄️ Step 1: Apply Database Schema

Run this script to set up your Supabase database:

```bash
./scripts/setup-database.sh
```

**Manual Alternative:**
1. Go to: https://supabase.com/dashboard/project/grglttyirzxfdpbyuxut/sql
2. Copy/paste contents of `database/schema.sql`
3. Click "Run"

---

## 🚂 Step 2: Deploy API to Railway

### Option A: Quick Deploy (Recommended)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new?template=https://github.com/YOUR_USERNAME/mfa-relay)

### Option B: Manual Setup
1. **Create Railway Account**: https://railway.app
2. **Connect GitHub**: Link your repository
3. **Create New Project**: Import from GitHub
4. **Set Environment Variables**:
   ```bash
   SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZ2x0dHlpcnp4ZmRwYnl1eHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MzUzNDgsImV4cCI6MjA2NzQxMTM0OH0.-ZU38fETcom_K3-tTBHjGVLcmG98_Fmt0XsBBRS38dM
   SUPABASE_JWT_SECRET=[Get from Supabase Dashboard → Settings → API → JWT Secret]
   PYTHONPATH=/app
   ENVIRONMENT=production
   ```

---

## 🌐 Step 3: Deploy Frontend to Vercel

### Option A: Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/YOUR_USERNAME/mfa-relay&project-name=mfa-relay-frontend&root-directory=frontend)

### Option B: Manual Setup
1. **Create Vercel Account**: https://vercel.com
2. **Import Git Repository**: Select your GitHub repo
3. **Configure Project**:
   - Framework Preset: `Next.js`
   - Root Directory: `frontend`
4. **Set Environment Variables**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZ2x0dHlpcnp4ZmRwYnl1eHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MzUzNDgsImV4cCI6MjA2NzQxMTM0OH0.-ZU38fETcom_K3-tTBHjGVLcmG98_Fmt0XsBBRS38dM
   NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-API-URL.railway.app
   ```

---

## 🔐 Step 4: Configure OAuth Providers

Go to: https://supabase.com/dashboard/project/grglttyirzxfdpbyuxut/auth/providers

### Google OAuth
1. **Enable Google Provider**
2. **Client ID**: Get from Google Cloud Console
3. **Client Secret**: Get from Google Cloud Console
4. **Redirect URL**: `https://grglttyirzxfdpbyuxut.supabase.co/auth/v1/callback`

### Microsoft OAuth
1. **Enable Azure Provider**
2. **Client ID**: Get from Azure Portal
3. **Client Secret**: Get from Azure Portal
4. **Tenant ID**: Your Azure tenant ID

---

## 🔧 Step 5: Configure GitHub Secrets

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Add these secrets:

### Core Secrets
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZ2x0dHlpcnp4ZmRwYnl1eHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MzUzNDgsImV4cCI6MjA2NzQxMTM0OH0.-ZU38fETcom_K3-tTBHjGVLcmG98_Fmt0XsBBRS38dM
SUPABASE_JWT_SECRET=[From Supabase Dashboard → Settings → API → JWT Secret]

# Vercel
VERCEL_TOKEN=[Vercel → Settings → Tokens → Create Token]
VERCEL_ORG_ID=[Vercel → Settings → General → Team ID]
VERCEL_PROJECT_ID=[Vercel → Project Settings → General → Project ID]

# Railway
RAILWAY_TOKEN=[Railway → Account → Tokens → Create Token]
RAILWAY_PROJECT_ID=[Railway → Project → Settings → Project ID]
```

---

## 🎯 Step 6: Deploy Everything

### Automatic Deployment
1. **Push to GitHub**: `git push origin main`
2. **GitHub Actions** will automatically:
   - Deploy frontend to Vercel
   - Deploy API to Railway
3. **Check Actions Tab**: Monitor deployment progress

### Manual Deployment
```bash
# Frontend
cd frontend && vercel --prod

# API (if Railway CLI installed)
railway up
```

---

## 📊 Step 7: Verify Deployment

### Health Checks
- **Frontend**: `https://your-vercel-domain.vercel.app`
- **API**: `https://your-railway-domain.railway.app/health`
- **Database**: Supabase Dashboard → SQL Editor

### Test Authentication
1. Visit your frontend URL
2. Click "Sign Up"
3. Try Google/Microsoft OAuth
4. Check Supabase Auth users appear

---

## 🐛 Troubleshooting

### Common Issues

**Railway Build Fails**
```bash
# Check logs in Railway dashboard
# Ensure environment variables are set
# Verify requirements.txt is correct
```

**Vercel Build Fails**
```bash
# Check build logs in Vercel dashboard
# Ensure NEXT_PUBLIC_ variables are set
# Verify frontend dependencies installed
```

**Database Connection Fails**
```bash
# Verify Supabase URL and keys
# Check RLS policies are applied
# Ensure project exists in database
```

**OAuth Not Working**
```bash
# Check redirect URLs match exactly
# Verify client IDs and secrets
# Ensure providers are enabled in Supabase
```

---

## 🎉 Success!

Your MFA Relay SaaS is now live!

### Next Steps
- [ ] Set up custom domain
- [ ] Configure email templates
- [ ] Add monitoring and alerts
- [ ] Set up backup strategy
- [ ] Add user analytics

### URLs
- **Frontend**: https://your-domain.vercel.app
- **API**: https://your-api.railway.app
- **Database**: Supabase Dashboard
- **GitHub Actions**: Repository Actions tab

### Support
- **Railway**: [railway.app/help](https://railway.app/help)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)