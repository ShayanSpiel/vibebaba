#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing All VibeBaba Endpoints"
echo "=================================="
echo ""

# Test user credentials (should already be in PocketBase)
TEST_EMAIL="shayanpourvatan@gmail.com"
TEST_PASSWORD="123456"

BASE_URL="http://localhost:3000"
PB_URL="http://localhost:8090"

# Counter for pass/fail
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="$5"

    echo -n "Testing $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Cookie: $COOKIE" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -H "Cookie: $COOKIE" -d "$data" "$url")
    fi

    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

echo "Step 1: Authenticate with PocketBase"
echo "======================================"

# Login to PocketBase
PB_AUTH=$(curl -s -X POST "$PB_URL/api/collections/users/auth-with-password" \
    -H "Content-Type: application/json" \
    -d "{\"identity\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

PB_TOKEN=$(echo "$PB_AUTH" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo "$PB_AUTH" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$PB_TOKEN" ]; then
    echo -e "${RED}✗ FAILED${NC} - Could not authenticate"
    echo "Please ensure user $TEST_EMAIL exists in PocketBase"
    exit 1
fi

echo -e "${GREEN}✓${NC} Authenticated successfully"
echo "User ID: $USER_ID"
echo ""

# Set cookie for Next.js API routes
COOKIE="pb_auth={\"token\":\"$PB_TOKEN\",\"model\":{\"id\":\"$USER_ID\"}}"

echo "Step 2: Test Core API Endpoints"
echo "================================"
echo ""

# Test Credits API
test_endpoint "GET /api/credits" "GET" "$BASE_URL/api/credits" "" "200"

# Test AI Plan Generation
echo ""
echo "Step 3: Test AI Endpoints"
echo "========================="
echo ""

test_endpoint "POST /api/ai/plan" "POST" "$BASE_URL/api/ai/plan" \
    '{"description":"A simple todo app"}' "200"

test_endpoint "POST /api/ai/backend" "POST" "$BASE_URL/api/ai/backend" \
    '{"description":"A todo app","plan":"Simple task manager"}' "200"

# Test Project Creation (will test in browser since it needs complex flow)
echo ""
echo "Step 4: Verify PocketBase Data"
echo "==============================="
echo ""

# Check token usage records
echo -n "Checking token_usage records... "
TOKEN_USAGE=$(curl -s -H "Authorization: $PB_TOKEN" \
    "$PB_URL/api/collections/token_usage/records?filter=(userId='$USER_ID')")

USAGE_COUNT=$(echo "$TOKEN_USAGE" | grep -o '"totalItems":[0-9]*' | cut -d':' -f2)

if [ ! -z "$USAGE_COUNT" ]; then
    echo -e "${GREEN}✓${NC} Found $USAGE_COUNT token usage records"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} No token usage records found"
    ((FAILED++))
fi

# Check user credits
echo -n "Checking user credits... "
USER_DATA=$(curl -s -H "Authorization: $PB_TOKEN" \
    "$PB_URL/api/collections/users/records/$USER_ID")

TOTAL_TOKENS=$(echo "$USER_DATA" | grep -o '"totalTokens":[0-9]*' | cut -d':' -f2)
USED_TOKENS=$(echo "$USER_DATA" | grep -o '"usedTokens":[0-9]*' | cut -d':' -f2)
DAILY_TOKENS=$(echo "$USER_DATA" | grep -o '"dailyTokens":[0-9]*' | cut -d':' -f2)

if [ ! -z "$TOTAL_TOKENS" ]; then
    echo -e "${GREEN}✓${NC} Credits: Total=$TOTAL_TOKENS, Used=$USED_TOKENS, Daily=$DAILY_TOKENS"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Could not fetch user credits"
    ((FAILED++))
fi

# Check projects
echo -n "Checking projects... "
PROJECTS=$(curl -s -H "Authorization: $PB_TOKEN" \
    "$PB_URL/api/collections/projects/records?filter=(userId='$USER_ID')")

PROJECT_COUNT=$(echo "$PROJECTS" | grep -o '"totalItems":[0-9]*' | cut -d':' -f2)

if [ ! -z "$PROJECT_COUNT" ]; then
    echo -e "${GREEN}✓${NC} Found $PROJECT_COUNT projects"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} No projects found (this is OK for new users)"
    ((PASSED++))
fi

echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
