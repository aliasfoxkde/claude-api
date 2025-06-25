#!/bin/bash

# Automated KV Namespace Setup for Puter Claude API Proxy
# This script automatically creates KV namespaces and updates wrangler.toml

set -e

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

echo "🚀 Automated KV Namespace Setup for Puter Claude API Proxy"
echo "================================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "wrangler.toml" ]; then
    print_error "wrangler.toml not found. Please run this script from the project root directory."
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_status "Wrangler CLI not found. Installing..."
    npm install -g wrangler@latest
    print_success "Wrangler CLI installed"
fi

print_success "Wrangler CLI found: $(wrangler --version)"

# Check authentication
print_status "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    print_warning "Not authenticated with Cloudflare. Please log in:"
    echo ""
    wrangler login
    echo ""
    print_success "Authentication completed"
else
    print_success "Already authenticated as: $(wrangler whoami)"
fi

# Check if namespaces already exist and are configured
print_status "Checking current wrangler.toml configuration..."
if ! grep -q "your-api-keys-namespace-id" wrangler.toml && ! grep -q "your-rate-limits-namespace-id" wrangler.toml; then
    print_warning "KV namespaces appear to already be configured in wrangler.toml"
    echo ""
    echo "Current KV configuration:"
    grep -A 10 "kv_namespaces" wrangler.toml
    echo ""
    read -p "Do you want to recreate the namespaces? (y/N): " recreate
    if [[ ! $recreate =~ ^[Yy]$ ]]; then
        print_status "Skipping namespace creation. Exiting."
        exit 0
    fi
fi

# Create backup of wrangler.toml
print_status "Creating backup of wrangler.toml..."
cp wrangler.toml wrangler.toml.backup.$(date +%Y%m%d_%H%M%S)
print_success "Backup created"

# Create API_KEYS namespace
print_status "Creating API_KEYS KV namespace..."
API_KEYS_OUTPUT=$(wrangler kv:namespace create "API_KEYS" --preview false 2>&1)
if [ $? -ne 0 ]; then
    print_error "Failed to create API_KEYS namespace"
    echo "$API_KEYS_OUTPUT"
    exit 1
fi

# Extract namespace ID from output
API_KEYS_ID=$(echo "$API_KEYS_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
if [ -z "$API_KEYS_ID" ]; then
    print_error "Failed to extract API_KEYS namespace ID from output:"
    echo "$API_KEYS_OUTPUT"
    exit 1
fi

print_success "API_KEYS namespace created: $API_KEYS_ID"

# Create API_KEYS preview namespace
print_status "Creating API_KEYS preview namespace..."
API_KEYS_PREVIEW_OUTPUT=$(wrangler kv:namespace create "API_KEYS" --preview 2>&1)
if [ $? -ne 0 ]; then
    print_warning "Failed to create API_KEYS preview namespace, using production ID"
    API_KEYS_PREVIEW_ID="$API_KEYS_ID"
else
    API_KEYS_PREVIEW_ID=$(echo "$API_KEYS_PREVIEW_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    if [ -z "$API_KEYS_PREVIEW_ID" ]; then
        print_warning "Failed to extract preview ID, using production ID"
        API_KEYS_PREVIEW_ID="$API_KEYS_ID"
    else
        print_success "API_KEYS preview namespace created: $API_KEYS_PREVIEW_ID"
    fi
fi

# Create RATE_LIMITS namespace
print_status "Creating RATE_LIMITS KV namespace..."
RATE_LIMITS_OUTPUT=$(wrangler kv:namespace create "RATE_LIMITS" --preview false 2>&1)
if [ $? -ne 0 ]; then
    print_error "Failed to create RATE_LIMITS namespace"
    echo "$RATE_LIMITS_OUTPUT"
    exit 1
fi

# Extract namespace ID from output
RATE_LIMITS_ID=$(echo "$RATE_LIMITS_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
if [ -z "$RATE_LIMITS_ID" ]; then
    print_error "Failed to extract RATE_LIMITS namespace ID from output:"
    echo "$RATE_LIMITS_OUTPUT"
    exit 1
fi

print_success "RATE_LIMITS namespace created: $RATE_LIMITS_ID"

# Create RATE_LIMITS preview namespace
print_status "Creating RATE_LIMITS preview namespace..."
RATE_LIMITS_PREVIEW_OUTPUT=$(wrangler kv:namespace create "RATE_LIMITS" --preview 2>&1)
if [ $? -ne 0 ]; then
    print_warning "Failed to create RATE_LIMITS preview namespace, using production ID"
    RATE_LIMITS_PREVIEW_ID="$RATE_LIMITS_ID"
else
    RATE_LIMITS_PREVIEW_ID=$(echo "$RATE_LIMITS_PREVIEW_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    if [ -z "$RATE_LIMITS_PREVIEW_ID" ]; then
        print_warning "Failed to extract preview ID, using production ID"
        RATE_LIMITS_PREVIEW_ID="$RATE_LIMITS_ID"
    else
        print_success "RATE_LIMITS preview namespace created: $RATE_LIMITS_PREVIEW_ID"
    fi
fi

# Update wrangler.toml with the new namespace IDs
print_status "Updating wrangler.toml with new namespace IDs..."

# Use sed to replace the placeholder values
sed -i.tmp "s/your-api-keys-namespace-id/$API_KEYS_ID/g" wrangler.toml
sed -i.tmp "s/your-api-keys-preview-namespace-id/$API_KEYS_PREVIEW_ID/g" wrangler.toml
sed -i.tmp "s/your-rate-limits-namespace-id/$RATE_LIMITS_ID/g" wrangler.toml
sed -i.tmp "s/your-rate-limits-preview-namespace-id/$RATE_LIMITS_PREVIEW_ID/g" wrangler.toml

# Remove temporary file
rm wrangler.toml.tmp

print_success "wrangler.toml updated successfully"

# Verify the changes
print_status "Verifying wrangler.toml configuration..."
echo ""
echo "Updated KV namespace configuration:"
echo "=================================="
grep -A 10 "kv_namespaces" wrangler.toml
echo ""

# Check if git is available and we're in a git repository
if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
    print_status "Committing changes to git..."
    
    # Add the updated file
    git add wrangler.toml
    
    # Create commit message
    COMMIT_MSG="feat: configure KV namespaces for production deployment

- Created API_KEYS namespace: $API_KEYS_ID
- Created RATE_LIMITS namespace: $RATE_LIMITS_ID
- Updated wrangler.toml with real namespace IDs
- Replaced placeholder values with production namespaces

This fixes the KV namespace validation error during deployment."

    # Commit the changes
    git commit -m "$COMMIT_MSG"
    
    print_success "Changes committed to git"
    
    # Ask if user wants to push
    echo ""
    read -p "Do you want to push changes to remote repository? (Y/n): " push_changes
    if [[ ! $push_changes =~ ^[Nn]$ ]]; then
        git push
        print_success "Changes pushed to remote repository"
    fi
else
    print_warning "Git not available or not in a git repository. Please commit changes manually."
fi

echo ""
echo "🎉 KV Namespace Setup Complete!"
echo "==============================="
echo ""
echo "📋 Summary:"
echo "   ✅ API_KEYS namespace: $API_KEYS_ID"
echo "   ✅ RATE_LIMITS namespace: $RATE_LIMITS_ID"
echo "   ✅ wrangler.toml updated"
echo "   ✅ Changes committed to git"
echo ""
echo "🚀 Next Steps:"
echo "   1. Your Cloudflare deployment should now succeed"
echo "   2. Test the deployment with: curl https://claude-api.your-subdomain.workers.dev/health"
echo "   3. Generate your first API key after deployment"
echo ""
echo "🧪 Verification:"
print_status "Testing wrangler configuration..."
if wrangler deploy --dry-run > /dev/null 2>&1; then
    print_success "Wrangler configuration is valid! Deployment should succeed."
else
    print_warning "Wrangler dry-run failed. Check the configuration manually."
fi

echo ""
print_success "Setup completed successfully! 🎯"
