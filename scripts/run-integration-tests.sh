#!/bin/bash
# Run integration tests with Next.js dev server
# This script starts the dev server, runs tests, then stops the server

set -e

echo "🚀 Starting Next.js dev server for integration tests..."
echo ""

# Configuration
PORT=${PORT:-3000}
AUTH_SERVICE_URL=${AUTH_SERVICE_URL:-http://localhost:5001}
MOCK_API=${MOCK_API:-false}
LOGIN_EMAIL=${LOGIN:-testuser@example.com}
LOGIN_PASSWORD=${PASSWORD:-securepassword}

# Export environment variables for Next.js
export AUTH_SERVICE_URL
export MOCK_API
export PORT

# Start Next.js in background
echo "Starting Next.js on port $PORT..."
npm run dev > /tmp/nextjs-test.log 2>&1 &
NEXTJS_PID=$!

echo "Next.js PID: $NEXTJS_PID"
echo "Waiting for Next.js to be ready..."

# Wait for Next.js to be ready (max 60 seconds)
for i in {1..60}; do
    if curl -s http://localhost:$PORT > /dev/null 2>&1; then
        echo "✓ Next.js is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "✗ Timeout waiting for Next.js"
        kill $NEXTJS_PID 2>/dev/null || true
        exit 1
    fi
    echo -n "."
    sleep 1
done

echo ""
echo ""

# Run integration tests
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGIN="$LOGIN_EMAIL" PASSWORD="$LOGIN_PASSWORD" "$SCRIPT_DIR/test-integration-auth.sh"
TEST_EXIT_CODE=$?

# Cleanup: stop Next.js
echo ""
echo "Stopping Next.js server..."
kill $NEXTJS_PID 2>/dev/null || true
wait $NEXTJS_PID 2>/dev/null || true

# Show logs if tests failed
if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "Next.js logs:"
    tail -n 50 /tmp/nextjs-test.log
fi

exit $TEST_EXIT_CODE
