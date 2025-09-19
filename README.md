# MFA Relay 🔐

**Multi-tenant SaaS for automatically forwarding MFA codes from email to SMS**

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new?template=https://github.com/dbbuilder/mfa-relay)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/dbbuilder/mfa-relay&project-name=mfa-relay-frontend&root-directory=frontend)

## 🚀 Features

- **Multi-tenant Architecture** - Shared Supabase database with project isolation
- **OAuth Authentication** - Google/Microsoft/Apple login support
- **Email Monitoring** - IMAP-based monitoring with smart MFA code detection
- **SMS Forwarding** - Twilio integration for instant code delivery
- **Row Level Security** - Database-enforced data isolation
- **Auto-scaling Deployment** - Railway + Vercel infrastructure
- **CI/CD Ready** - GitHub Actions workflows included

## 🏗️ Architecture

```
Frontend (Next.js/Vercel) → API (FastAPI/Railway) → Database (Supabase)
                                     ↓
                            Email Monitoring (IMAP)
                                     ↓
                             SMS Delivery (Twilio)
```

## 📋 Quick Deploy

### Prerequisites
- GitHub account
- Supabase account (shared database access)
- Railway account
- Vercel account

### 1-Click Deploy
1. **Database**: Apply `database/schema-fixed.sql` to Supabase
2. **API**: [![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new?template=https://github.com/dbbuilder/mfa-relay)
3. **Frontend**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/dbbuilder/mfa-relay&project-name=mfa-relay-frontend&root-directory=frontend)

### Manual Deploy
Follow the step-by-step guide: **[EXECUTE_DEPLOYMENT.md](EXECUTE_DEPLOYMENT.md)**

## 🗄️ Database Setup

**Supabase Shared Database Configuration:**

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/grglttyirzxfdpbyuxut/sql)
2. Copy contents of `database/schema-fixed.sql`
3. Paste and run in SQL Editor
4. ✅ Verify tables created: `projects`, `project_users`, `mfa_email_accounts`, `mfa_sms_config`, `mfa_codes_log`

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase Auth** - Authentication with OAuth

### Backend
- **FastAPI** - Python API framework
- **Supabase** - Database and auth
- **Twilio** - SMS delivery
- **AsyncIO** - Non-blocking email monitoring

### Infrastructure
- **Railway** - API hosting and auto-scaling
- **Vercel** - Frontend hosting and CDN
- **GitHub Actions** - CI/CD pipelines
- **Docker** - Containerization

## 📚 Documentation

- **[EXECUTE_DEPLOYMENT.md](EXECUTE_DEPLOYMENT.md)** - Step-by-step deployment guide
- **[SCHEMA_SETUP_INSTRUCTIONS.md](SCHEMA_SETUP_INSTRUCTIONS.md)** - Database setup
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Platform-specific deployment docs
- **[CLAUDE.md](CLAUDE.md)** - Development documentation

## 🔧 Development

### Local Setup
```bash
# Clone repository
git clone https://github.com/dbbuilder/mfa-relay.git
cd mfa-relay

# Frontend
cd frontend
npm install
npm run dev  # http://localhost:3000

# API
pip install -r api/requirements.txt
cd api && uvicorn main:app --reload  # http://localhost:8000
```

### Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000

# API
SUPABASE_URL=https://grglttyirzxfdpbyuxut.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

## 🎯 Multi-Tenant Design

This application is designed to work in a **shared Supabase database** with multiple projects:

- **Project Isolation**: All data is namespaced by `project_id`
- **Row Level Security**: Database policies enforce user data access
- **Auto-Assignment**: Users are automatically added to 'mfa-relay' project on signup
- **Scalable**: Supports multiple applications in the same database

## 📊 Monitoring

### Health Checks
- **API**: `https://your-api-domain.railway.app/health`
- **Frontend**: `https://your-frontend-domain.vercel.app`

### Deployment Status
- **GitHub Actions**: Check Actions tab for build status
- **Railway**: Monitor API deployment and logs
- **Vercel**: Monitor frontend deployment and analytics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.ai/code)
- Powered by [Supabase](https://supabase.com)
- Deployed on [Railway](https://railway.app) and [Vercel](https://vercel.com)
- SMS via [Twilio](https://twilio.com)

---

**🚀 Ready to deploy? Start with [EXECUTE_DEPLOYMENT.md](EXECUTE_DEPLOYMENT.md)**