#!/bin/bash

# P360 Railway Deployment Script
# Automates deployment setup for Telegram and Discord bots

set -e

echo "🚀 P360 Railway Deployment Script"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
  echo "📋 Checking prerequisites..."

  if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found${NC}"
    exit 1
  fi

  if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
  fi

  echo -e "${GREEN}✅ Prerequisites met${NC}"
  echo ""
}

# Prepare repository
prepare_repo() {
  echo "📦 Preparing repository..."

  if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
    echo "Commit changes before deploying (git commit -m '...')"
    exit 1
  fi

  echo -e "${GREEN}✅ Repository ready${NC}"
  echo ""
}

# Install dependencies
install_deps() {
  echo "📚 Installing dependencies..."

  npm install
  npm install --workspace=packages/core
  npm install --workspace=apps/telegram
  npm install --workspace=apps/discord

  echo -e "${GREEN}✅ Dependencies installed${NC}"
  echo ""
}

# Build applications
build_apps() {
  echo "🔨 Building applications..."

  npm run build --workspace=packages/core
  npm run build --workspace=apps/telegram
  npm run build --workspace=apps/discord

  echo -e "${GREEN}✅ Applications built${NC}"
  echo ""
}

# Check Railway CLI
check_railway_cli() {
  echo "🚂 Checking Railway CLI..."

  if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI not found${NC}"
    echo "Install with: npm install -g @railway/cli"
    echo "Then run: railway login"
    exit 1
  fi

  echo -e "${GREEN}✅ Railway CLI ready${NC}"
  echo ""
}

# Deploy to Railway
deploy_railway() {
  echo "🚀 Deploying to Railway..."
  echo ""

  railway up

  echo ""
  echo -e "${GREEN}✅ Deployment initiated${NC}"
  echo ""
}

# Print next steps
print_next_steps() {
  echo "📝 Next Steps:"
  echo "=============="
  echo ""
  echo "1. Go to Railway Dashboard: https://railway.app/dashboard"
  echo ""
  echo "2. Set Environment Variables:"
  echo "   - TELEGRAM_BOT_TOKEN"
  echo "   - DISCORD_BOT_TOKEN"
  echo "   - ANTHROPIC_API_KEY"
  echo "   - OURA_API_KEY"
  echo "   - SUPABASE_URL (optional)"
  echo "   - SUPABASE_ANON_KEY (optional)"
  echo "   - SUPABASE_SERVICE_ROLE_KEY (optional)"
  echo ""
  echo "3. Deploy: Click 'Deploy' in Railway dashboard"
  echo ""
  echo "4. Monitor logs:"
  echo "   - railway logs --follow"
  echo ""
  echo "5. Test commands:"
  echo "   - Telegram: /demo"
  echo "   - Discord: /demo feature:workout"
  echo ""
}

# Main execution
main() {
  check_prerequisites
  prepare_repo
  install_deps
  build_apps
  check_railway_cli
  deploy_railway
  print_next_steps

  echo -e "${GREEN}✅ Deployment complete!${NC}"
}

# Run main function
main
