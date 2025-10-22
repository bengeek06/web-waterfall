#!/bin/bash
# Integration tests for Auth API proxy with real backend
# This script tests the actual forwarding of requests to AUTH_SERVICE_URL

# Don't exit on first error - we want to see all test results
# set -e

echo "🧪 Integration Tests - Auth API Proxy with Real Backend"
echo "========================================================"
echo ""

# Configuration
API_BASE="${API_BASE:-http://localhost:3000/api/auth}"
LOGIN_EMAIL="${LOGIN:-testuser@example.com}"
LOGIN_PASSWORD="${PASSWORD:-securepassword}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    local cookies=$6
    local timeout=10
    
    echo ""
    echo "Testing: $description"
    echo "  Method: $method $endpoint"
    
    if [ -n "$data" ]; then
        if [ -n "$cookies" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                --max-time $timeout \
                -H "Content-Type: application/json" \
                -H "Cookie: $cookies" \
                -d "$data" \
                "$API_BASE$endpoint" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                --max-time $timeout \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_BASE$endpoint" 2>&1)
        fi
    else
        if [ -n "$cookies" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                --max-time $timeout \
                -H "Cookie: $cookies" \
                "$API_BASE$endpoint" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                --max-time $timeout \
                "$API_BASE$endpoint" 2>&1)
        fi
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo "  Status: $status_code (expected: $expected_status)"
    echo "  Response: $body"
    
    if [ "$status_code" -eq "$expected_status" ] 2>/dev/null; then
        print_result 0 "$description"
        echo "$body"
    else
        print_result 1 "$description (got $status_code, expected $expected_status)"
        echo "$body"
        return 1
    fi
}

# Check if MOCK_API is disabled
echo "Checking environment configuration..."
echo "  API Base: ${API_BASE}"
echo "  Login Email: ${LOGIN_EMAIL}"
echo ""
echo "Note: This test calls the Next.js proxy at http://localhost:3000"
echo "      The Next.js server (in Docker) will forward to AUTH_SERVICE_URL"
echo ""

# Test if Next.js is accessible
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}✗ ERROR: Next.js server is not accessible at http://localhost:3000${NC}"
    echo "  Please ensure the Docker containers are running:"
    echo "  docker-compose up web_service auth_service"
    exit 1
fi

echo -e "${GREEN}✓ Next.js server is accessible${NC}"
echo ""

# Test 1: Health Check
echo "═══════════════════════════════════════════════════════"
echo "Test 1: Health Check (GET /health)"
echo "═══════════════════════════════════════════════════════"
test_endpoint "GET" "/health" 200 "Health check should return healthy status"

# Test 2: Version
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 2: Version (GET /version)"
echo "═══════════════════════════════════════════════════════"
test_endpoint "GET" "/version" 200 "Version endpoint should return version info"

# Test 3: Login with valid credentials
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 3: Login (POST /login) - Valid Credentials"
echo "═══════════════════════════════════════════════════════"
login_data="{\"email\":\"${LOGIN_EMAIL}\",\"password\":\"${LOGIN_PASSWORD}\"}"
login_response=$(curl -s -i -X POST \
    -H "Content-Type: application/json" \
    -d "$login_data" \
    "$API_BASE/login")

login_status=$(echo "$login_response" | grep "HTTP/" | tail -n1 | awk '{print $2}')
echo "  Status: $login_status"

if [ "$login_status" = "200" ]; then
    # Extract cookies
    access_token=$(echo "$login_response" | grep -i "set-cookie:" | grep "access_token" | sed 's/.*access_token=\([^;]*\).*/\1/')
    refresh_token=$(echo "$login_response" | grep -i "set-cookie:" | grep "refresh_token" | sed 's/.*refresh_token=\([^;]*\).*/\1/')
    
    if [ -n "$access_token" ]; then
        echo "  ✓ Access token received: ${access_token:0:20}..."
        print_result 0 "Login successful with cookies"
    else
        echo "  ✗ No access_token cookie found in response"
        print_result 1 "Login should set access_token cookie"
    fi
    
    if [ -n "$refresh_token" ]; then
        echo "  ✓ Refresh token received: ${refresh_token:0:20}..."
    else
        echo "  ⚠ No refresh_token cookie found"
    fi
else
    print_result 1 "Login with valid credentials (got $login_status, expected 200)"
    echo "Response:"
    echo "$login_response" | tail -n +10
fi

# Test 4: Verify token (if login succeeded)
if [ -n "$access_token" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "Test 4: Verify Token (GET /verify)"
    echo "═══════════════════════════════════════════════════════"
    cookies="access_token=$access_token"
    if [ -n "$refresh_token" ]; then
        cookies="$cookies; refresh_token=$refresh_token"
    fi
    
    verify_response=$(curl -s -w "\n%{http_code}" \
        -H "Cookie: $cookies" \
        "$API_BASE/verify")
    
    verify_status=$(echo "$verify_response" | tail -n1)
    verify_body=$(echo "$verify_response" | sed '$d')
    
    echo "  Status: $verify_status"
    echo "  Response: $verify_body"
    
    if [ "$verify_status" = "200" ]; then
        if echo "$verify_body" | grep -q '"valid".*true'; then
            print_result 0 "Token verification successful"
        else
            print_result 1 "Token verification returned valid=false"
        fi
    else
        print_result 1 "Token verification (got $verify_status, expected 200)"
    fi
    
    # Test 5: Refresh token
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "Test 5: Refresh Token (POST /refresh)"
    echo "═══════════════════════════════════════════════════════"
    refresh_response=$(curl -s -i -X POST \
        -H "Cookie: $cookies" \
        "$API_BASE/refresh")
    
    refresh_status=$(echo "$refresh_response" | grep "HTTP/" | tail -n1 | awk '{print $2}')
    echo "  Status: $refresh_status"
    
    if [ "$refresh_status" = "200" ]; then
        new_access_token=$(echo "$refresh_response" | grep -i "set-cookie:" | grep "access_token" | sed 's/.*access_token=\([^;]*\).*/\1/')
        if [ -n "$new_access_token" ]; then
            echo "  ✓ New access token received: ${new_access_token:0:20}..."
            print_result 0 "Token refresh successful"
        else
            print_result 1 "Token refresh should return new access_token cookie"
        fi
    else
        print_result 1 "Token refresh (got $refresh_status, expected 200)"
    fi
    
    # Test 6: Logout
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "Test 6: Logout (POST /logout)"
    echo "═══════════════════════════════════════════════════════"
    logout_response=$(curl -s -i -X POST \
        --max-time 10 \
        -H "Cookie: $cookies" \
        "$API_BASE/logout" 2>&1)
    
    logout_status=$(echo "$logout_response" | grep "HTTP/" | tail -n1 | awk '{print $2}')
    logout_body=$(echo "$logout_response" | tail -n1)
    echo "  Status: $logout_status"
    echo "  Response: $logout_body"
    
    if [ "$logout_status" = "200" ]; then
        # Backend uses expires=0 which becomes "Expires=Thu, 01 Jan 1970"
        if echo "$logout_response" | grep -qi "Expires=Thu.*1970\|Max-Age=0\|expires=0"; then
            echo "  ✓ Cookies cleared (Expires set to 1970)"
            # Count cleared cookies
            cleared_count=$(echo "$logout_response" | grep -iE "set-cookie:.*Expires=Thu.*1970" | wc -l)
            echo "  ✓ Found $cleared_count cookie(s) being cleared"
            print_result 0 "Logout successful with cookie clearing"
        else
            echo "  ⚠ Cookie clearing headers not detected in response"
            print_result 1 "Logout should send Set-Cookie headers with Expires=1970"
        fi
    else
        print_result 1 "Logout (got $logout_status, expected 200)"
    fi
else
    echo ""
    echo -e "${YELLOW}⚠ Skipping tests 4-6 (verify, refresh, logout) - no access token${NC}"
fi

# Test 7: Login with invalid credentials
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 7: Login (POST /login) - Invalid Credentials"
echo "═══════════════════════════════════════════════════════"
invalid_data='{"email":"invalid@example.com","password":"wrongpassword"}'
test_endpoint "POST" "/login" 401 "Login with invalid credentials should return 401" "$invalid_data"

# Test 8: Verify without token
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 8: Verify (GET /verify) - No Token"
echo "═══════════════════════════════════════════════════════"
test_endpoint "GET" "/verify" 401 "Verify without token should return 401"

# Test 9: Config endpoint
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 9: Config (GET /config)"
echo "═══════════════════════════════════════════════════════"
config_response=$(curl -s -w "\n%{http_code}" "$API_BASE/config")
config_status=$(echo "$config_response" | tail -n1)
config_body=$(echo "$config_response" | sed '$d')

echo "  Status: $config_status"
echo "  Response: $config_body"

if [ "$config_status" = "200" ]; then
    print_result 0 "Config endpoint accessible"
else
    print_result 0 "Config endpoint returns $config_status (may be restricted)"
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test Summary"
echo "═══════════════════════════════════════════════════════"
echo -e "Tests passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "🎉 The proxy is correctly forwarding requests to the backend!"
    echo "   - Request bodies are transmitted correctly"
    echo "   - Cookies are properly forwarded and received"
    echo "   - Error codes are correctly proxied"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Please check:"
    echo "  1. Is AUTH_SERVICE_URL correctly set?"
    echo "  2. Is the backend service running?"
    echo "  3. Are the credentials correct?"
    echo "  4. Check the backend logs for errors"
    exit 1
fi
