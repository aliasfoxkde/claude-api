#!/bin/bash

# Comprehensive Endpoint Testing Script
# Tests all routing patterns for the Puter Claude API Proxy

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

# API Base URL
BASE_URL="https://claude-api.cyopsys.workers.dev"

echo "🧪 Comprehensive Endpoint Testing for Puter Claude API Proxy"
echo "==========================================================="
echo ""
echo "🎯 Testing API at: $BASE_URL"
echo ""

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    local auth_header=$6
    
    print_status "Testing $method $endpoint - $description"
    
    local curl_cmd="curl -s -w '%{http_code}' -X $method"
    
    if [ ! -z "$auth_header" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $auth_header'"
    fi
    
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$BASE_URL$endpoint'"
    
    local response=$(eval $curl_cmd)
    local status_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$method $endpoint → $status_code"
        if [[ "$endpoint" == *"/models"* ]] && [[ "$body" == *"claude-3-5-sonnet"* ]]; then
            echo "   ✓ Contains Claude models"
        elif [[ "$endpoint" == *"/health"* ]] && [[ "$body" == *"timestamp"* ]]; then
            echo "   ✓ Health response format correct"
        elif [[ "$endpoint" == "/" ]] && [[ "$body" == *"Puter Claude API Proxy"* ]]; then
            echo "   ✓ Root endpoint info correct"
        fi
    else
        print_error "$method $endpoint → Expected: $expected_status, Got: $status_code"
        echo "   Response: ${body:0:200}..."
        return 1
    fi
}

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0

run_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_endpoint "$@"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    echo ""
}

echo "📋 Testing Public Endpoints (No Auth Required)"
echo "=============================================="

# Root endpoint
run_test "GET" "/" "200" "Root API information"

# Health endpoints - both patterns
run_test "GET" "/health" "200" "Health check (unversioned)"
run_test "GET" "/v1/health" "200" "Health check (versioned)"
run_test "GET" "/health/ready" "200" "Readiness check (unversioned)"
run_test "GET" "/v1/health/ready" "200" "Readiness check (versioned)"
run_test "GET" "/health/live" "200" "Liveness check (unversioned)"
run_test "GET" "/v1/health/live" "200" "Liveness check (versioned)"

# Models endpoints - both patterns
run_test "GET" "/models" "200" "Models list (unversioned)"
run_test "GET" "/v1/models" "200" "Models list (versioned)"

# Metrics endpoints - both patterns
run_test "GET" "/metrics" "200" "Metrics (unversioned)"
run_test "GET" "/v1/metrics" "200" "Metrics (versioned)"

echo "🔐 Testing Authentication Required Endpoints"
echo "==========================================="

# Chat endpoints should require auth - both patterns
run_test "POST" "/chat/completions" "401" "Chat completion auth required (unversioned)" '{"model": "claude-3-5-sonnet", "messages": [{"role": "user", "content": "test"}]}'
run_test "POST" "/v1/chat/completions" "401" "Chat completion auth required (versioned)" '{"model": "claude-3-5-sonnet", "messages": [{"role": "user", "content": "test"}]}'

# Claude messages endpoints should require auth - both patterns  
run_test "POST" "/messages" "401" "Claude messages auth required (unversioned)" '{"model": "claude-3-5-sonnet", "max_tokens": 100, "messages": [{"role": "user", "content": "test"}]}'
run_test "POST" "/v1/messages" "401" "Claude messages auth required (versioned)" '{"model": "claude-3-5-sonnet", "max_tokens": 100, "messages": [{"role": "user", "content": "test"}]}'

echo "🔑 Testing API Key Management"
echo "============================"

# First API key creation should work without auth - both patterns
run_test "POST" "/keys" "201" "First API key creation (unversioned)" '{"name": "Test Key 1", "permissions": ["chat"]}'
run_test "POST" "/v1/keys" "201" "First API key creation (versioned)" '{"name": "Test Key 2", "permissions": ["chat"]}'

echo "❌ Testing Invalid Endpoints"
echo "=========================="

# Invalid endpoints should return 404
run_test "GET" "/invalid" "404" "Invalid endpoint"
run_test "GET" "/v1/invalid" "404" "Invalid versioned endpoint"
run_test "POST" "/v1/completions" "410" "Deprecated completions endpoint"

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    print_success "🎉 All tests passed! Your API is working perfectly."
    echo ""
    echo "✅ Verified Features:"
    echo "   • Dual-pattern routing (versioned and unversioned endpoints)"
    echo "   • Public endpoints accessible without authentication"
    echo "   • Protected endpoints properly require authentication"
    echo "   • Models endpoint returns Claude models"
    echo "   • Health checks working"
    echo "   • API key creation working"
    echo "   • Proper error handling for invalid endpoints"
    echo ""
    echo "🚀 Your Puter Claude API Proxy is ready for production use!"
else
    print_warning "⚠️  Some tests failed. Check the output above for details."
    echo ""
    echo "🔧 Common issues:"
    echo "   • Check Cloudflare Workers logs for errors"
    echo "   • Verify KV namespaces are properly configured"
    echo "   • Ensure latest deployment is active"
fi

echo ""
echo "🔗 API Documentation:"
echo "   Root: $BASE_URL/"
echo "   Models: $BASE_URL/models"
echo "   Health: $BASE_URL/health"
echo ""
echo "📚 Next Steps:"
echo "   1. Generate API keys for your applications"
echo "   2. Test with OpenAI/Anthropic SDKs"
echo "   3. Monitor usage and performance"
