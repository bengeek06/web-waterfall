#!/bin/bash
# Run integration tests against Docker containers
# Usage: ./run-docker-tests.sh [login_email] [password]

set -e

LOGIN_EMAIL="${1:-testuser@example.com}"
LOGIN_PASSWORD="${2:-securepassword}"

echo "🐳 Running integration tests against Docker containers"
echo "======================================================"
echo ""
echo "Prerequisites:"
echo "  - Docker containers must be running (docker-compose up)"
echo "  - Next.js accessible on http://localhost:3000"
echo "  - Auth service accessible via Docker network"
echo ""

# Check if Docker containers are running
if ! docker ps | grep -q "web_service"; then
    echo "⚠️  Warning: web_service container doesn't seem to be running"
    echo ""
    echo "To start the services, run:"
    echo "  docker-compose up -d web_service auth_service"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "Running tests with credentials:"
echo "  Email: $LOGIN_EMAIL"
echo "  Password: $LOGIN_PASSWORD"
echo ""

# Run the integration tests
API_BASE="http://localhost:3000/api/auth" \
LOGIN="$LOGIN_EMAIL" \
PASSWORD="$LOGIN_PASSWORD" \
./test-integration-auth.sh

exit $?
