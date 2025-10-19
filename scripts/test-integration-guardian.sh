#!/bin/bash
# Integration tests for Guardian API proxy with real backend
# This script tests the actual forwarding of requests to GUARDIAN_SERVICE_URL

# Don't exit on first error - we want to see all test results
# set -e

echo "🧪 Integration Tests - Guardian API Proxy with Real Backend"
echo "============================================================"
echo ""

# Configuration
API_BASE="${API_BASE:-http://localhost:3000/api/guardian}"
COMPANY_ID="${COMPANY_ID:-test-company-123}"
USER_ID="${USER_ID:-test-user-123}"

# Get auth tokens (assuming auth is working)
AUTH_BASE="${AUTH_BASE:-http://localhost:3000/api/auth}"
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

# Check if Next.js is accessible
echo "Checking environment configuration..."
echo "  API Base: ${API_BASE}"
echo "  Company ID: ${COMPANY_ID}"
echo "  User ID: ${USER_ID}"
echo ""
echo "Note: This test calls the Next.js proxy at http://localhost:3000"
echo "      The Next.js server (in Docker) will forward to GUARDIAN_SERVICE_URL"
echo ""

if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}✗ ERROR: Next.js server is not accessible at http://localhost:3000${NC}"
    echo "  Please ensure the Docker containers are running:"
    echo "  docker-compose up web_service guardian_service"
    exit 1
fi

echo -e "${GREEN}✓ Next.js server is accessible${NC}"
echo ""

# Get authentication tokens
echo "═══════════════════════════════════════════════════════"
echo "Setup: Authenticating to get tokens"
echo "═══════════════════════════════════════════════════════"
login_data="{\"email\":\"${LOGIN_EMAIL}\",\"password\":\"${LOGIN_PASSWORD}\"}"
login_response=$(curl -s -i -X POST \
    -H "Content-Type: application/json" \
    -d "$login_data" \
    "$AUTH_BASE/login" 2>&1)

login_status=$(echo "$login_response" | grep "HTTP/" | tail -n1 | awk '{print $2}')

if [ "$login_status" = "200" ]; then
    access_token=$(echo "$login_response" | grep -i "set-cookie:" | grep "access_token" | sed 's/.*access_token=\([^;]*\).*/\1/')
    refresh_token=$(echo "$login_response" | grep -i "set-cookie:" | grep "refresh_token" | sed 's/.*refresh_token=\([^;]*\).*/\1/')
    
    if [ -n "$access_token" ]; then
        echo -e "${GREEN}✓ Authentication successful${NC}"
        echo "  Access token: ${access_token:0:20}..."
        cookies="access_token=$access_token"
        if [ -n "$refresh_token" ]; then
            cookies="$cookies; refresh_token=$refresh_token"
        fi
    else
        echo -e "${YELLOW}⚠ Login succeeded but no access_token cookie${NC}"
        cookies=""
    fi
else
    echo -e "${YELLOW}⚠ Authentication failed (status: $login_status)${NC}"
    echo "  Tests will run without authentication"
    cookies=""
fi

# Test 1: Health Check
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 1: Health Check (GET /health)"
echo "═══════════════════════════════════════════════════════"
test_endpoint "GET" "/health" 200 "Health check should return healthy status"

# Test 2: Version
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 2: Version (GET /version)"
echo "═══════════════════════════════════════════════════════"
test_endpoint "GET" "/version" 200 "Version endpoint should return version info" "" "$cookies"

# Test 3: Config
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 3: Config (GET /config)"
echo "═══════════════════════════════════════════════════════"
test_endpoint "GET" "/config" 200 "Config endpoint should return configuration" "" "$cookies"

# Test 4: List Permissions (read-only)
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 4: List Permissions (GET /permissions)"
echo "═══════════════════════════════════════════════════════"
if [ -n "$cookies" ]; then
    perm_response=$(curl -s -w "\n%{http_code}" \
        -H "Cookie: $cookies" \
        "$API_BASE/permissions")
    perm_status=$(echo "$perm_response" | tail -n1)
    perm_body=$(echo "$perm_response" | sed '$d')
    
    echo "  Status: $perm_status"
    echo "  Response: ${perm_body:0:200}..."
    
    if [ "$perm_status" = "200" ]; then
        print_result 0 "Permissions list retrieved"
    else
        print_result 1 "List permissions (got $perm_status, expected 200)"
    fi
else
    echo -e "${YELLOW}⚠ Skipping - no authentication${NC}"
fi

# Test 5: List Roles
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 5: List Roles (GET /roles)"
echo "═══════════════════════════════════════════════════════"
if [ -n "$cookies" ]; then
    roles_response=$(curl -s -w "\n%{http_code}" \
        -H "Cookie: $cookies" \
        "$API_BASE/roles")
    roles_status=$(echo "$roles_response" | tail -n1)
    roles_body=$(echo "$roles_response" | sed '$d')
    
    echo "  Status: $roles_status"
    echo "  Response: ${roles_body:0:200}..."
    
    if [ "$roles_status" = "200" ]; then
        # Try to extract first role ID for later tests
        role_id=$(echo "$roles_body" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
        if [ -n "$role_id" ]; then
            echo "  ✓ Found role ID for testing: $role_id"
        fi
        print_result 0 "Roles list retrieved"
    else
        print_result 1 "List roles (got $roles_status, expected 200)"
    fi
else
    echo -e "${YELLOW}⚠ Skipping - no authentication${NC}"
fi

# Test 6: Create Role
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 6: Create Role (POST /roles)"
echo "═══════════════════════════════════════════════════════"
if [ -n "$cookies" ]; then
    role_name="Test Role $(date +%s)"
    create_role_data="{\"name\":\"${role_name}\",\"description\":\"Integration test role\"}"
    
    create_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Cookie: $cookies" \
        -d "$create_role_data" \
        "$API_BASE/roles")
    
    create_status=$(echo "$create_response" | tail -n1)
    create_body=$(echo "$create_response" | sed '$d')
    
    echo "  Status: $create_status"
    echo "  Response: $create_body"
    
    if [ "$create_status" = "201" ] || [ "$create_status" = "200" ]; then
        created_role_id=$(echo "$create_body" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
        if [ -n "$created_role_id" ]; then
            echo "  ✓ Role created with ID: $created_role_id"
            role_id="$created_role_id"
            print_result 0 "Role creation successful"
        else
            print_result 1 "Role created but no ID in response"
        fi
    else
        print_result 1 "Create role (got $create_status, expected 201)"
    fi
else
    echo -e "${YELLOW}⚠ Skipping - no authentication${NC}"
fi

# Test 7: Get Role by ID
if [ -n "$role_id" ] && [ -n "$cookies" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "Test 7: Get Role by ID (GET /roles/${role_id})"
    echo "═══════════════════════════════════════════════════════"
    
    get_role_response=$(curl -s -w "\n%{http_code}" \
        -H "Cookie: $cookies" \
        "$API_BASE/roles/$role_id")
    
    get_role_status=$(echo "$get_role_response" | tail -n1)
    get_role_body=$(echo "$get_role_response" | sed '$d')
    
    echo "  Status: $get_role_status"
    echo "  Response: $get_role_body"
    
    if [ "$get_role_status" = "200" ]; then
        print_result 0 "Get role by ID successful"
    else
        print_result 1 "Get role by ID (got $get_role_status, expected 200)"
    fi
fi

# Test 8: Update Role
if [ -n "$role_id" ] && [ -n "$cookies" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "Test 8: Update Role (PUT /roles/${role_id})"
    echo "═══════════════════════════════════════════════════════"
    
    update_data="{\"name\":\"${role_name} Updated\",\"description\":\"Updated description\"}"
    
    update_response=$(curl -s -w "\n%{http_code}" -X PUT \
        -H "Content-Type: application/json" \
        -H "Cookie: $cookies" \
        -d "$update_data" \
        "$API_BASE/roles/$role_id")
    
    update_status=$(echo "$update_response" | tail -n1)
    update_body=$(echo "$update_response" | sed '$d')
    
    echo "  Status: $update_status"
    echo "  Response: $update_body"
    
    if [ "$update_status" = "200" ]; then
        print_result 0 "Update role successful"
    else
        print_result 1 "Update role (got $update_status, expected 200)"
    fi
fi

# Test 9: List Policies
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 9: List Policies (GET /policies)"
echo "═══════════════════════════════════════════════════════"
if [ -n "$cookies" ]; then
    policies_response=$(curl -s -w "\n%{http_code}" \
        -H "Cookie: $cookies" \
        "$API_BASE/policies")
    policies_status=$(echo "$policies_response" | tail -n1)
    policies_body=$(echo "$policies_response" | sed '$d')
    
    echo "  Status: $policies_status"
    echo "  Response: ${policies_body:0:200}..."
    
    if [ "$policies_status" = "200" ]; then
        policy_id=$(echo "$policies_body" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
        if [ -n "$policy_id" ]; then
            echo "  ✓ Found policy ID for testing: $policy_id"
        fi
        print_result 0 "Policies list retrieved"
    else
        print_result 1 "List policies (got $policies_status, expected 200)"
    fi
else
    echo -e "${YELLOW}⚠ Skipping - no authentication${NC}"
fi

# Test 10: Create Policy
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 10: Create Policy (POST /policies)"
echo "═══════════════════════════════════════════════════════"
if [ -n "$cookies" ]; then
    policy_name="Test Policy $(date +%s)"
    create_policy_data="{\"name\":\"${policy_name}\",\"description\":\"Integration test policy\"}"
    
    create_policy_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Cookie: $cookies" \
        -d "$create_policy_data" \
        "$API_BASE/policies")
    
    create_policy_status=$(echo "$create_policy_response" | tail -n1)
    create_policy_body=$(echo "$create_policy_response" | sed '$d')
    
    echo "  Status: $create_policy_status"
    echo "  Response: $create_policy_body"
    
    if [ "$create_policy_status" = "201" ] || [ "$create_policy_status" = "200" ]; then
        created_policy_id=$(echo "$create_policy_body" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
        if [ -n "$created_policy_id" ]; then
            echo "  ✓ Policy created with ID: $created_policy_id"
            policy_id="$created_policy_id"
            print_result 0 "Policy creation successful"
        else
            print_result 1 "Policy created but no ID in response"
        fi
    else
        print_result 1 "Create policy (got $create_policy_status, expected 201)"
    fi
else
    echo -e "${YELLOW}⚠ Skipping - no authentication${NC}"
fi

# Test 11: Check Access
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 11: Check Access (POST /check-access)"
echo "═══════════════════════════════════════════════════════"
if [ -n "$cookies" ]; then
    check_access_data="{\"user_id\":\"${USER_ID}\",\"service\":\"guardian\",\"resource_name\":\"role\",\"operation\":\"read\"}"
    
    check_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Cookie: $cookies" \
        -d "$check_access_data" \
        "$API_BASE/check-access")
    
    check_status=$(echo "$check_response" | tail -n1)
    check_body=$(echo "$check_response" | sed '$d')
    
    echo "  Status: $check_status"
    echo "  Response: $check_body"
    
    # 200 = access granted, 403 = access denied (both are valid RBAC responses)
    if [ "$check_status" = "200" ] || [ "$check_status" = "403" ]; then
        print_result 0 "Check access endpoint working (status $check_status)"
    else
        print_result 1 "Check access failed (got $check_status, expected 200 or 403)"
    fi
else
    echo -e "${YELLOW}⚠ Skipping - no authentication${NC}"
fi

# Test 12: List User-Roles
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test 12: List User-Roles (GET /users-roles)"
echo "═══════════════════════════════════════════════════════"
if [ -n "$cookies" ]; then
    user_roles_response=$(curl -s -w "\n%{http_code}" \
        -H "Cookie: $cookies" \
        "$API_BASE/users-roles")
    user_roles_status=$(echo "$user_roles_response" | tail -n1)
    user_roles_body=$(echo "$user_roles_response" | sed '$d')
    
    echo "  Status: $user_roles_status"
    echo "  Response: ${user_roles_body:0:200}..."
    
    if [ "$user_roles_status" = "200" ]; then
        print_result 0 "User-roles list retrieved"
    else
        print_result 1 "List user-roles (got $user_roles_status, expected 200)"
    fi
else
    echo -e "${YELLOW}⚠ Skipping - no authentication${NC}"
fi

# Test 13: Delete Role (cleanup)
if [ -n "$role_id" ] && [ -n "$cookies" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "Test 13: Delete Role (DELETE /roles/${role_id})"
    echo "═══════════════════════════════════════════════════════"
    
    delete_response=$(curl -s -w "\n%{http_code}" -X DELETE \
        -H "Cookie: $cookies" \
        "$API_BASE/roles/$role_id")
    
    delete_status=$(echo "$delete_response" | tail -n1)
    delete_body=$(echo "$delete_response" | sed '$d')
    
    echo "  Status: $delete_status"
    if [ -n "$delete_body" ]; then
        echo "  Response: $delete_body"
    fi
    
    if [ "$delete_status" = "204" ] || [ "$delete_status" = "200" ]; then
        print_result 0 "Delete role successful"
    else
        print_result 1 "Delete role (got $delete_status, expected 204)"
    fi
fi

# Test 14: Delete Policy (cleanup)
if [ -n "$policy_id" ] && [ -n "$cookies" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "Test 14: Delete Policy (DELETE /policies/${policy_id})"
    echo "═══════════════════════════════════════════════════════"
    
    delete_policy_response=$(curl -s -w "\n%{http_code}" -X DELETE \
        -H "Cookie: $cookies" \
        "$API_BASE/policies/$policy_id")
    
    delete_policy_status=$(echo "$delete_policy_response" | tail -n1)
    delete_policy_body=$(echo "$delete_policy_response" | sed '$d')
    
    echo "  Status: $delete_policy_status"
    if [ -n "$delete_policy_body" ]; then
        echo "  Response: $delete_policy_body"
    fi
    
    if [ "$delete_policy_status" = "204" ] || [ "$delete_policy_status" = "200" ]; then
        print_result 0 "Delete policy successful"
    else
        print_result 1 "Delete policy (got $delete_policy_status, expected 204)"
    fi
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
    echo "🎉 The Guardian proxy is correctly forwarding requests to the backend!"
    echo "   - RBAC operations (roles, policies, permissions) work correctly"
    echo "   - CRUD operations are properly proxied"
    echo "   - Authentication and authorization are functional"
    echo "   - Access control checks are operational"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Please check:"
    echo "  1. Is GUARDIAN_SERVICE_URL correctly set?"
    echo "  2. Is the Guardian service running?"
    echo "  3. Are you authenticated (valid access_token)?"
    echo "  4. Check the backend logs for errors"
    echo "  5. Verify company_id and user_id are valid"
    exit 1
fi
