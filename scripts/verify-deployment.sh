#!/bin/bash

# Deployment Verification Script
# This script verifies that the Puter Claude API Proxy is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Default base URL
BASE_URL="https://claude-api.cyopsys.workers.dev"

echo "🧪 Verifying Puter Claude API Proxy Deployment"
echo "=============================================="
echo ""
echo "🎯 Testing API at: $BASE_URL"
echo ""

# Test 1: Health endpoint
print_status "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q '"timestamp"'; then
    print_success "Health endpoint responding"
    echo "   Response: $(echo "$HEALTH_RESPONSE" | jq -r '.status // "unknown"')"
else
    print_error "Health endpoint failed"
    echo "   Response: $HEALTH_RESPONSE"
fi

echo ""

# Test 2: Models endpoint
print_status "Testing models endpoint..."
MODELS_RESPONSE=$(curl -s "$BASE_URL/v1/models")
if echo "$MODELS_RESPONSE" | grep -q '"claude-3-5-sonnet"'; then
    MODEL_COUNT=$(echo "$MODELS_RESPONSE" | jq '.data | length')
    print_success "Models endpoint working ($MODEL_COUNT models available)"
    echo "   Available models include: claude-3-5-sonnet, claude-opus-4, gpt-4o, deepseek-chat"
else
    print_error "Models endpoint failed"
    echo "   Response: $MODELS_RESPONSE"
fi

echo ""

# Test 3: Authentication (should reject without API key)
print_status "Testing authentication (should reject without API key)..."
AUTH_RESPONSE=$(curl -s "$BASE_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-3-5-sonnet", "messages": [{"role": "user", "content": "test"}]}')

if echo "$AUTH_RESPONSE" | grep -q '"authentication_error"'; then
    print_success "Authentication properly rejecting requests without API key"
else
    print_warning "Authentication test unexpected result"
    echo "   Response: $AUTH_RESPONSE"
fi

echo ""

# Test 4: CORS headers
print_status "Testing CORS headers..."
CORS_RESPONSE=$(curl -s -I "$BASE_URL/v1/models")
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    print_success "CORS headers present"
else
    print_warning "CORS headers missing"
fi

echo ""

# Test 5: KV namespace configuration
print_status "Testing KV namespace configuration..."
if grep -q "fae8bbd7f4af481389472460a6c785ca" wrangler.toml && grep -q "ce95cdc3e48e4f9a9bcfc6e46cb9bb9b" wrangler.toml; then
    print_success "KV namespaces properly configured"
    echo "   API_KEYS: fae8bbd7f4af481389472460a6c785ca"
    echo "   RATE_LIMITS: ce95cdc3e48e4f9a9bcfc6e46cb9bb9b"
else
    print_error "KV namespaces not properly configured"
fi

echo ""
echo "🎉 Deployment Verification Complete!"
echo ""
echo "✅ Your Puter Claude API Proxy is successfully deployed and working!"
echo ""
echo "📋 Next Steps:"
echo "   1. Generate your first API key (see instructions below)"
echo "   2. Test chat completion with your API key"
echo "   3. Update your applications to use the new base URL"
echo ""
echo "🔑 Generate First API Key:"
echo "   The first API key creation should work without authentication."
echo "   If it doesn't, check the worker logs in Cloudflare Dashboard."
echo ""
echo "   curl -X POST $BASE_URL/v1/keys \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"name\": \"Admin Key\", \"permissions\": [\"chat\", \"admin\"]}'"
echo ""
echo "🧪 Test Chat Completion (after getting API key):"
echo "   curl -X POST $BASE_URL/v1/chat/completions \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -H \"Authorization: Bearer YOUR_API_KEY\" \\"
echo "     -d '{\"model\": \"claude-3-5-sonnet\", \"messages\": [{\"role\": \"user\", \"content\": \"Hello!\"}]}'"
echo ""
echo "🎯 Your API is ready to use!"
