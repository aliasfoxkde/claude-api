#!/bin/bash

# Quick Fix Script for KV Namespace Setup
# This script helps you quickly set up KV namespaces for Cloudflare Dashboard deployment

set -e

echo "🔧 KV Namespace Quick Fix for Cloudflare Dashboard Deployment"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wrangler is available
if command -v wrangler &> /dev/null; then
    print_status "Wrangler CLI found. Creating namespaces automatically..."
    
    # Check if logged in
    if ! wrangler whoami &> /dev/null; then
        print_warning "Not logged in to Cloudflare. Please log in:"
        wrangler login
    fi
    
    # Create namespaces
    print_status "Creating API_KEYS namespace..."
    API_KEYS_OUTPUT=$(wrangler kv:namespace create "API_KEYS" --preview false)
    API_KEYS_ID=$(echo "$API_KEYS_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    
    print_status "Creating RATE_LIMITS namespace..."
    RATE_LIMITS_OUTPUT=$(wrangler kv:namespace create "RATE_LIMITS" --preview false)
    RATE_LIMITS_ID=$(echo "$RATE_LIMITS_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    
    print_success "Namespaces created:"
    echo "   API_KEYS: $API_KEYS_ID"
    echo "   RATE_LIMITS: $RATE_LIMITS_ID"
    
    # Update wrangler.toml
    print_status "Updating wrangler.toml..."
    
    # Backup original
    cp wrangler.toml wrangler.toml.backup
    
    # Replace placeholder IDs
    sed -i.tmp "s/your-api-keys-namespace-id/$API_KEYS_ID/g" wrangler.toml
    sed -i.tmp "s/your-api-keys-preview-namespace-id/$API_KEYS_ID/g" wrangler.toml
    sed -i.tmp "s/your-rate-limits-namespace-id/$RATE_LIMITS_ID/g" wrangler.toml
    sed -i.tmp "s/your-rate-limits-preview-namespace-id/$RATE_LIMITS_ID/g" wrangler.toml
    
    # Remove temp file
    rm wrangler.toml.tmp
    
    print_success "wrangler.toml updated with real namespace IDs!"
    
    echo ""
    print_status "Next steps:"
    echo "1. Commit and push changes: git add wrangler.toml && git commit -m 'Fix KV namespace IDs' && git push"
    echo "2. Redeploy via Cloudflare Dashboard or run: wrangler deploy"
    
else
    print_warning "Wrangler CLI not found. Manual setup required."
    echo ""
    print_status "Please follow these steps:"
    echo ""
    echo "1. Go to Cloudflare Dashboard: https://dash.cloudflare.com"
    echo "2. Navigate to: Workers & Pages → KV"
    echo "3. Create two namespaces:"
    echo "   - API_KEYS"
    echo "   - RATE_LIMITS"
    echo "4. Copy the namespace IDs"
    echo "5. Update wrangler.toml with the real IDs (replace 'your-api-keys-namespace-id' etc.)"
    echo "6. Commit and push changes"
    echo ""
    print_status "See scripts/setup-cloudflare-dashboard.md for detailed instructions"
fi

echo ""
print_status "Current wrangler.toml KV configuration:"
echo ""
grep -A 10 "kv_namespaces" wrangler.toml || echo "No KV namespaces found in wrangler.toml"
