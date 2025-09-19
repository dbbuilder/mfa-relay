#!/bin/bash
# Verification script for MFA Relay deployment readiness

set -e

echo "🚀 MFA Relay Deployment Readiness Check"
echo "========================================"

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
    else
        echo "❌ $1 - MISSING!"
        return 1
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo "✅ $1/"
    else
        echo "❌ $1/ - MISSING!"
        return 1
    fi
}

MISSING=0

echo ""
echo "📁 Essential Files Check:"
echo "------------------------"

# Core deployment files
check_file "database/schema.sql" || MISSING=1
check_file "railway.toml" || MISSING=1
check_file "Dockerfile" || MISSING=1
check_file "Procfile" || MISSING=1

# API files
check_file "api/main.py" || MISSING=1
check_file "api/requirements.txt" || MISSING=1

# Frontend files
check_file "frontend/package.json" || MISSING=1
check_file "frontend/next.config.js" || MISSING=1
check_file "frontend/src/app/page.tsx" || MISSING=1

# GitHub Actions
check_file ".github/workflows/deploy-railway.yml" || MISSING=1
check_file ".github/workflows/deploy-frontend.yml" || MISSING=1

# Documentation
check_file "EXECUTE_DEPLOYMENT.md" || MISSING=1
check_file "DEPLOY_NOW.md" || MISSING=1

echo ""
echo "📂 Directory Structure Check:"
echo "-----------------------------"

check_dir "database" || MISSING=1
check_dir "api" || MISSING=1
check_dir "frontend" || MISSING=1
check_dir "frontend/src" || MISSING=1
check_dir ".github/workflows" || MISSING=1

echo ""
echo "🔧 Configuration Check:"
echo "-----------------------"

# Check if frontend has required dependencies
if [ -f "frontend/package.json" ]; then
    if grep -q "@supabase/supabase-js" frontend/package.json; then
        echo "✅ Supabase dependency in frontend"
    else
        echo "❌ Missing Supabase dependency in frontend"
        MISSING=1
    fi
fi

# Check if API has FastAPI
if [ -f "api/requirements.txt" ]; then
    if grep -q "fastapi" api/requirements.txt; then
        echo "✅ FastAPI dependency in API"
    else
        echo "❌ Missing FastAPI dependency in API"
        MISSING=1
    fi
fi

# Check if railway.toml has correct start command
if [ -f "railway.toml" ]; then
    if grep -q "uvicorn main:app" railway.toml; then
        echo "✅ Railway start command configured"
    else
        echo "❌ Railway start command not configured correctly"
        MISSING=1
    fi
fi

echo ""
echo "📊 Summary:"
echo "----------"

if [ $MISSING -eq 0 ]; then
    echo "🎉 ALL CHECKS PASSED!"
    echo ""
    echo "✅ Your MFA Relay application is READY FOR DEPLOYMENT!"
    echo ""
    echo "Next steps:"
    echo "1. Follow EXECUTE_DEPLOYMENT.md step by step"
    echo "2. Apply database schema to Supabase"
    echo "3. Deploy API to Railway"
    echo "4. Deploy frontend to Vercel"
    echo "5. Configure OAuth providers"
    echo ""
    echo "⏱️  Estimated deployment time: 40 minutes"
else
    echo "❌ DEPLOYMENT NOT READY - $MISSING files/configurations missing"
    echo ""
    echo "Please fix the issues above before proceeding with deployment."
    exit 1
fi