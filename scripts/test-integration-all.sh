#!/bin/bash
# Run all integration tests for the API proxy
# Tests both Auth and Guardian services

set -e

echo "🧪 Running All Integration Tests"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOTAL_PASSED=0
TOTAL_FAILED=0

# Check if Next.js is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}✗ ERROR: Next.js server is not accessible${NC}"
    echo "  Please start the Docker containers:"
    echo "  docker-compose up web_service auth_service guardian_service"
    exit 1
fi

echo -e "${GREEN}✓ Next.js server is accessible${NC}"
echo ""

# Run Auth tests
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Running Auth Service Integration Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ -f "$SCRIPT_DIR/test-integration-auth.sh" ]; then
    if bash "$SCRIPT_DIR/test-integration-auth.sh"; then
        AUTH_RESULT="PASS"
        echo ""
        echo -e "${GREEN}✓ Auth tests completed successfully${NC}"
    else
        AUTH_RESULT="FAIL"
        echo ""
        echo -e "${RED}✗ Auth tests failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Auth test script not found${NC}"
    AUTH_RESULT="SKIP"
fi

echo ""
echo ""

# Run Guardian tests
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Running Guardian Service Integration Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ -f "$SCRIPT_DIR/test-integration-guardian.sh" ]; then
    if bash "$SCRIPT_DIR/test-integration-guardian.sh"; then
        GUARDIAN_RESULT="PASS"
        echo ""
        echo -e "${GREEN}✓ Guardian tests completed successfully${NC}"
    else
        GUARDIAN_RESULT="FAIL"
        echo ""
        echo -e "${RED}✗ Guardian tests failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Guardian test script not found${NC}"
    GUARDIAN_RESULT="SKIP"
fi

# Final summary
echo ""
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Final Summary - All Integration Tests"
echo "═══════════════════════════════════════════════════════"
echo ""

if [ "$AUTH_RESULT" = "PASS" ]; then
    echo -e "  Auth Service:     ${GREEN}✓ PASS${NC}"
elif [ "$AUTH_RESULT" = "SKIP" ]; then
    echo -e "  Auth Service:     ${YELLOW}⚠ SKIP${NC}"
else
    echo -e "  Auth Service:     ${RED}✗ FAIL${NC}"
fi

if [ "$GUARDIAN_RESULT" = "PASS" ]; then
    echo -e "  Guardian Service: ${GREEN}✓ PASS${NC}"
elif [ "$GUARDIAN_RESULT" = "SKIP" ]; then
    echo -e "  Guardian Service: ${YELLOW}⚠ SKIP${NC}"
else
    echo -e "  Guardian Service: ${RED}✗ FAIL${NC}"
fi

echo ""

if [ "$AUTH_RESULT" = "PASS" ] && [ "$GUARDIAN_RESULT" = "PASS" ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  🎉 ALL INTEGRATION TESTS PASSED!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "The API proxy is fully functional:"
    echo "  ✓ Authentication & Authorization working"
    echo "  ✓ RBAC system operational"
    echo "  ✓ All proxied requests functioning correctly"
    echo "  ✓ Cookie handling and forwarding working"
    echo "  ✓ Error propagation correct"
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ✗ SOME TESTS FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Please review the output above for details."
    echo ""
    exit 1
fi
