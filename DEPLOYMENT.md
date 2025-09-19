# MFA Relay Deployment Guide

This guide covers deployment to multiple platforms with fallback options.

## 🏗️ Architecture Overview

```
Frontend (Vercel) → API (Railway/DigitalOcean) → Supabase Database
```

## 📋 Prerequisites

1. **GitHub Repository** with your code
2. **Supabase Project** with schema applied
3. **Platform Accounts**: Vercel + Railway OR DigitalOcean
4. **Domain** (optional but recommended)

---

## 🔐 GitHub Secrets Setup

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

### Core Secrets (Required for all platforms)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZ2x0dHlpcnp4ZmRwYnl1eHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MzUzNDgsImV4cCI6MjA2NzQxMTM0OH0.-ZU38fETcom_K3-tTBHjGVLcmG98_Fmt0XsBBRS38dM
SUPABASE_JWT_SECRET=[Get from Supabase Dashboard → Settings → API → JWT Secret]

# Vercel (Frontend)
VERCEL_TOKEN=[Vercel → Settings → Tokens → Create Token]
VERCEL_ORG_ID=[Vercel → Settings → General → Team ID]
VERCEL_PROJECT_ID=[Vercel → Project Settings → General → Project ID]
```

### Railway Secrets (Option 1 - Recommended)
```bash
RAILWAY_TOKEN=[Railway → Account → Tokens → Create Token]
RAILWAY_PROJECT_ID=[Railway → Project → Settings → Project ID]
```

### DigitalOcean Secrets (Option 2 - Fallback)
```bash
DIGITALOCEAN_ACCESS_TOKEN=[DigitalOcean → API → Personal Access Tokens]
DO_REGISTRY_NAME=[Your DigitalOcean Container Registry name]
DO_APP_ID=[App Platform App ID after creation]
```

---

## 🚀 Platform-Specific Setup

## Option 1: Railway (Recommended)

### 1. Create Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway new mfa-relay-api
railway link
```

### 2. Set Environment Variables in Railway Dashboard
```bash
SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=[Your JWT Secret]
PYTHONPATH=/app
ENVIRONMENT=production
```

### 3. Deploy to Railway
```bash
# Manual deployment
railway up

# Or push to main branch (auto-deploys via GitHub Actions)
git push origin main
```

### 4. Railway Advantages
✅ **Zero config** - detects Python automatically
✅ **Free tier** - $5/month credit
✅ **Auto-scaling** - scales to zero when unused
✅ **Fast deployments** - usually under 2 minutes

---

## Option 2: DigitalOcean App Platform

### 1. Create Container Registry
```bash
# Install doctl
curl -sL https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz | tar -xzv
sudo mv doctl /usr/local/bin

# Login and create registry
doctl auth init
doctl registry create mfa-relay-registry
```

### 2. Create App Platform App
```bash
# Create app from spec
doctl apps create --spec .do/app.yaml
```

### 3. Set Environment Variables in DO Dashboard
Go to: **App → Settings → Environment Variables**
```bash
SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=[Your JWT Secret]
```

### 4. Deploy to DigitalOcean
```bash
# Manual deployment (GitHub Actions will handle this)
doctl apps create-deployment YOUR_APP_ID
```

### 5. DigitalOcean Advantages
✅ **Reliable infrastructure** - 99.99% uptime SLA
✅ **Auto-scaling** - handles traffic spikes
✅ **Built-in monitoring** - comprehensive metrics
✅ **Security** - DDoS protection included

---

## 🌐 Frontend Deployment (Vercel)

### 1. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. **Import Git Repository** → Select your GitHub repo
3. **Framework Preset**: Next.js
4. **Root Directory**: `frontend`

### 2. Set Environment Variables
Add in Vercel Dashboard → Project → Settings → Environment Variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### 3. Deploy
- **Automatic**: Push to `main` branch
- **Manual**: Click "Deploy" in Vercel dashboard

---

## 📊 Deployment Status & Monitoring

### GitHub Actions Workflows
- **Frontend**: `.github/workflows/deploy.yml` (Vercel)
- **Railway API**: `.github/workflows/deploy-railway.yml`
- **DigitalOcean API**: `.github/workflows/deploy-digitalocean.yml`

### Health Checks
- **API Health**: `https://your-api-domain.com/health`
- **Frontend**: `https://your-frontend-domain.com`

### Monitoring Commands
```bash
# Railway
railway status
railway logs

# DigitalOcean
doctl apps get YOUR_APP_ID
doctl apps logs YOUR_APP_ID

# Vercel
vercel logs
```

---

## 🔧 Local Development

### 1. Setup Database Schema
```bash
# Apply schema to Supabase
psql -h db.grglttyirzxfdpbyuxut.supabase.co -U postgres -d postgres -f database/schema.sql
```

### 2. Start Development Servers
```bash
# Frontend
cd frontend
npm install
npm run dev  # http://localhost:3000

# API (Terminal 2)
pip install -r api/requirements.txt
cd api && uvicorn main:app --reload  # http://localhost:8000
```

### 3. Environment Files
```bash
# Frontend
cp frontend/.env.local.example frontend/.env.local

# API (create api/.env)
echo "SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co" > api/.env
echo "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." >> api/.env
```

---

## 🚨 Troubleshooting

### Railway Issues → Switch to DigitalOcean
```bash
# Disable Railway workflow
mv .github/workflows/deploy-railway.yml .github/workflows/deploy-railway.yml.disabled

# Enable DigitalOcean workflow
git add .github/workflows/deploy-digitalocean.yml
git commit -m "Switch to DigitalOcean deployment"
git push origin main
```

### Common Issues
- **Build Failures**: Check logs in platform dashboard
- **Environment Variables**: Ensure all secrets are set correctly
- **Database Connection**: Verify Supabase URL and keys
- **CORS Errors**: Update allowed origins in FastAPI

### Support
- **Railway**: [railway.app/help](https://railway.app/help)
- **DigitalOcean**: [docs.digitalocean.com](https://docs.digitalocean.com)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)