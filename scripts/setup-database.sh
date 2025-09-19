#!/bin/bash
# Setup script for MFA Relay database schema

set -e

echo "🗄️  Setting up MFA Relay database schema..."

# Supabase configuration
SUPABASE_URL="https://grglttyirzxfdpbyuxut.supabase.co"
DB_URL="postgresql://postgres:[PASSWORD]@db.grglttyirzxfdpbyuxut.supabase.co:5432/postgres"

echo "📋 Please ensure you have the Supabase database password"
echo "🔗 Get it from: https://supabase.com/dashboard/project/grglttyirzxfdpbyuxut/settings/database"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) is not installed"
    echo "🔧 Install with:"
    echo "   Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "   macOS: brew install postgresql"
    echo "   Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Prompt for database password
echo -n "🔑 Enter your Supabase database password: "
read -s DB_PASSWORD
echo ""

# Replace placeholder in DB URL
DB_URL_WITH_PASSWORD="${DB_URL/[PASSWORD]/$DB_PASSWORD}"

echo "🚀 Applying database schema..."

# Apply the schema
if psql "$DB_URL_WITH_PASSWORD" -f database/schema.sql; then
    echo "✅ Database schema applied successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Configure OAuth providers in Supabase dashboard"
    echo "   2. Set up GitHub secrets for deployment"
    echo "   3. Deploy frontend and API"
else
    echo "❌ Failed to apply database schema"
    echo "💡 Please check:"
    echo "   - Database password is correct"
    echo "   - Network connection to Supabase"
    echo "   - Database permissions"
    exit 1
fi