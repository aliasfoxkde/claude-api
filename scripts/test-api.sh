#!/bin/bash

# API Testing Script for Puter Claude API Proxy
# This script tests all API endpoints to ensure they're working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BASE_URL="https://your-worker.your-subdomain.workers.dev/v1"
API_KEY=""
ADMIN_KEY=""

# Function to print colored output
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

# Function to make HTTP requests and check responses
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4
    local expected_status=$5
    
    if [ -z "$expected_status" ]; then
        expected_status=200
    fi
    
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
        return 0
    else
        echo "Expected: $expected_status, Got: $status_code"
        echo "Response: $body"
        return 1
    fi
}

# Test health endpoint
test_health() {
    print_status "Testing health endpoint..."
    
    if make_request "GET" "/health" "" "" "200"; then
        print_success "Health endpoint working"
    else
        print_error "Health endpoint failed"
        return 1
    fi
}

# Test models endpoint
test_models() {
    print_status "Testing models endpoint..."
    
    if make_request "GET" "/models" "" "" "200"; then
        print_success "Models endpoint working"
    else
        print_error "Models endpoint failed"
        return 1
    fi
}

# Test API key creation (first key doesn't need auth)
test_create_first_api_key() {
    print_status "Testing API key creation (first key)..."
    
    local data='{"name": "Test Admin Key", "permissions": ["chat", "admin"]}'
    
    if make_request "POST" "/keys" "$data" "" "201"; then
        print_success "First API key creation working"
        print_warning "Save the API key from the response - you'll need it for other tests"
    else
        print_error "First API key creation failed"
        return 1
    fi
}

# Test API key creation with auth
test_create_api_key() {
    if [ -z "$ADMIN_KEY" ]; then
        print_warning "Skipping authenticated API key creation (no admin key provided)"
        return 0
    fi
    
    print_status "Testing authenticated API key creation..."
    
    local data='{"name": "Test Chat Key", "permissions": ["chat"]}'
    
    if make_request "POST" "/keys" "$data" "$ADMIN_KEY" "201"; then
        print_success "Authenticated API key creation working"
    else
        print_error "Authenticated API key creation failed"
        return 1
    fi
}

# Test API key listing
test_list_api_keys() {
    if [ -z "$ADMIN_KEY" ]; then
        print_warning "Skipping API key listing (no admin key provided)"
        return 0
    fi
    
    print_status "Testing API key listing..."
    
    if make_request "GET" "/keys" "" "$ADMIN_KEY" "200"; then
        print_success "API key listing working"
    else
        print_error "API key listing failed"
        return 1
    fi
}

# Test chat completion
test_chat_completion() {
    if [ -z "$API_KEY" ]; then
        print_warning "Skipping chat completion (no API key provided)"
        return 0
    fi
    
    print_status "Testing chat completion..."
    
    local data='{
        "model": "claude-3-5-sonnet",
        "messages": [
            {"role": "user", "content": "Say hello in exactly 3 words"}
        ],
        "max_tokens": 50
    }'
    
    if make_request "POST" "/chat/completions" "$data" "$API_KEY" "200"; then
        print_success "Chat completion working"
    else
        print_error "Chat completion failed"
        return 1
    fi
}

# Test Claude messages endpoint
test_claude_messages() {
    if [ -z "$API_KEY" ]; then
        print_warning "Skipping Claude messages (no API key provided)"
        return 0
    fi
    
    print_status "Testing Claude messages endpoint..."
    
    local data='{
        "model": "claude-3-5-sonnet",
        "max_tokens": 50,
        "messages": [
            {"role": "user", "content": "Say hello in exactly 3 words"}
        ]
    }'
    
    if make_request "POST" "/messages" "$data" "$API_KEY" "200"; then
        print_success "Claude messages endpoint working"
    else
        print_error "Claude messages endpoint failed"
        return 1
    fi
}

# Test rate limiting
test_rate_limiting() {
    if [ -z "$API_KEY" ]; then
        print_warning "Skipping rate limiting test (no API key provided)"
        return 0
    fi
    
    print_status "Testing rate limiting..."
    
    local data='{
        "model": "claude-3-5-sonnet",
        "messages": [{"role": "user", "content": "Hi"}],
        "max_tokens": 10
    }'
    
    # Make multiple requests quickly to test rate limiting
    local success_count=0
    local rate_limited=false
    
    for i in {1..5}; do
        if make_request "POST" "/chat/completions" "$data" "$API_KEY" "200" 2>/dev/null; then
            ((success_count++))
        elif make_request "POST" "/chat/completions" "$data" "$API_KEY" "429" 2>/dev/null; then
            rate_limited=true
            break
        fi
        sleep 0.1
    done
    
    if [ "$rate_limited" = true ] || [ "$success_count" -gt 0 ]; then
        print_success "Rate limiting working (made $success_count requests)"
    else
        print_error "Rate limiting test failed"
        return 1
    fi
}

# Test authentication
test_authentication() {
    print_status "Testing authentication..."
    
    local data='{
        "model": "claude-3-5-sonnet",
        "messages": [{"role": "user", "content": "Hi"}],
        "max_tokens": 10
    }'
    
    # Test without API key
    if make_request "POST" "/chat/completions" "$data" "" "401"; then
        print_success "Authentication rejection working"
    else
        print_error "Authentication test failed"
        return 1
    fi
}

# Test CORS headers
test_cors() {
    print_status "Testing CORS headers..."
    
    local response=$(curl -s -I -X OPTIONS "$BASE_URL/models")
    
    if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
        print_success "CORS headers present"
    else
        print_error "CORS headers missing"
        return 1
    fi
}

# Main test function
main() {
    echo "🧪 Starting API tests for Puter Claude API Proxy..."
    echo ""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --base-url)
                BASE_URL="$2"
                shift 2
                ;;
            --api-key)
                API_KEY="$2"
                shift 2
                ;;
            --admin-key)
                ADMIN_KEY="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --base-url URL    Base URL for the API (default: https://your-worker.your-subdomain.workers.dev/v1)"
                echo "  --api-key KEY     API key for chat endpoints"
                echo "  --admin-key KEY   Admin API key for management endpoints"
                echo "  --help            Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0 --base-url https://my-worker.workers.dev/v1"
                echo "  $0 --api-key pk-abc123 --admin-key pk-admin456"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    echo "🎯 Testing API at: $BASE_URL"
    echo ""
    
    # Run tests
    local failed_tests=0
    
    # Basic endpoint tests (no auth required)
    test_health || ((failed_tests++))
    test_models || ((failed_tests++))
    test_cors || ((failed_tests++))
    test_authentication || ((failed_tests++))
    
    # API key management tests
    if [ -z "$ADMIN_KEY" ]; then
        print_warning "No admin key provided. Testing first key creation..."
        test_create_first_api_key || ((failed_tests++))
        print_warning "Please run the script again with --admin-key to test authenticated endpoints"
    else
        test_create_api_key || ((failed_tests++))
        test_list_api_keys || ((failed_tests++))
    fi
    
    # Chat API tests
    if [ ! -z "$API_KEY" ]; then
        test_chat_completion || ((failed_tests++))
        test_claude_messages || ((failed_tests++))
        test_rate_limiting || ((failed_tests++))
    else
        print_warning "No API key provided. Skipping chat API tests."
        print_warning "Use --api-key to test chat endpoints"
    fi
    
    echo ""
    
    # Summary
    if [ $failed_tests -eq 0 ]; then
        print_success "🎉 All tests passed!"
        echo ""
        echo "✅ Your Puter Claude API Proxy is working correctly!"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Generate API keys for your applications"
        echo "   2. Update your client applications to use the new base URL"
        echo "   3. Monitor usage and performance"
        echo "   4. Set up custom domains if needed"
    else
        print_error "❌ $failed_tests test(s) failed"
        echo ""
        echo "🔧 Troubleshooting:"
        echo "   1. Check your deployment status"
        echo "   2. Verify KV namespaces are configured"
        echo "   3. Check Cloudflare Workers logs"
        echo "   4. Ensure environment variables are set correctly"
        exit 1
    fi
}

# Run main function
main "$@"
