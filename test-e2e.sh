#!/bin/bash
# ===========================================================
# ScholarTrace — End-to-End Test Script
# Tests the full flow: register → create class → upload logs
# → list students → view logs → delete student → delete class
# ===========================================================

set -e

API_URL="${API_URL:-http://localhost:5000}"
PASS=0
FAIL=0
TOTAL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

# Generate unique test data
TIMESTAMP=$(date +%s)
TEST_NAME="Test Professor ${TIMESTAMP}"
TEST_EMAIL="testprof_${TIMESTAMP}@test.edu"
TEST_PASSWORD="testpass123"
STUDENT_EMAIL="student_${TIMESTAMP}@umich.edu"

function assert() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  TOTAL=$((TOTAL + 1))

  if echo "$actual" | grep -q "$expected"; then
    PASS=$((PASS + 1))
    echo -e "  ${GREEN}✓${NC} ${label}"
  else
    FAIL=$((FAIL + 1))
    echo -e "  ${RED}✗${NC} ${label}"
    echo -e "    ${DIM}Expected to contain: ${expected}${NC}"
    echo -e "    ${DIM}Got: ${actual}${NC}"
  fi
}

function assert_status() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  TOTAL=$((TOTAL + 1))

  if [ "$actual" = "$expected" ]; then
    PASS=$((PASS + 1))
    echo -e "  ${GREEN}✓${NC} ${label} (HTTP ${actual})"
  else
    FAIL=$((FAIL + 1))
    echo -e "  ${RED}✗${NC} ${label} — expected HTTP ${expected}, got HTTP ${actual}"
  fi
}

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     ScholarTrace End-to-End Test Suite       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${DIM}API: ${API_URL}${NC}"
echo -e "${DIM}Professor: ${TEST_EMAIL}${NC}"
echo -e "${DIM}Student: ${STUDENT_EMAIL}${NC}"
echo ""

# ──────────────────────────────────────────────
# 0. Health check
# ──────────────────────────────────────────────
echo -e "${CYAN}[0] Health check${NC}"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/")
assert_status "Server is running" "200" "$HEALTH"
echo ""

# ──────────────────────────────────────────────
# 1. Register professor
# ──────────────────────────────────────────────
echo -e "${CYAN}[1] Professor registration${NC}"

REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"${TEST_NAME}\", \"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASSWORD}\"}")

REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')
REGISTER_STATUS=$(echo "$REGISTER_RESPONSE" | tail -n 1)

assert_status "Register returns 201" "201" "$REGISTER_STATUS"
assert "Response contains token" "token" "$REGISTER_BODY"
assert "Response contains professor email" "$TEST_EMAIL" "$REGISTER_BODY"

TOKEN=$(echo "$REGISTER_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")
PROF_ID=$(echo "$REGISTER_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['professor']['id'])" 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo -e "  ${RED}✗ Could not extract token — aborting${NC}"
  exit 1
fi
echo -e "  ${DIM}Token: ${TOKEN:0:20}...${NC}"
echo ""

# ──────────────────────────────────────────────
# 2. Duplicate registration should fail
# ──────────────────────────────────────────────
echo -e "${CYAN}[2] Duplicate registration guard${NC}"

DUP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"${TEST_NAME}\", \"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASSWORD}\"}")

assert_status "Duplicate register returns 400" "400" "$DUP_RESPONSE"
echo ""

# ──────────────────────────────────────────────
# 3. Login
# ──────────────────────────────────────────────
echo -e "${CYAN}[3] Professor login${NC}"

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASSWORD}\"}")

LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')
LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n 1)

assert_status "Login returns 200" "200" "$LOGIN_STATUS"
assert "Login response contains token" "token" "$LOGIN_BODY"

# Use fresh token from login
TOKEN=$(echo "$LOGIN_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "$TOKEN")
echo ""

# ──────────────────────────────────────────────
# 4. Wrong password should fail
# ──────────────────────────────────────────────
echo -e "${CYAN}[4] Wrong password guard${NC}"

BAD_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"wrongpassword\"}")

assert_status "Wrong password returns 401" "401" "$BAD_LOGIN"
echo ""

# ──────────────────────────────────────────────
# 5. Create a class
# ──────────────────────────────────────────────
echo -e "${CYAN}[5] Create class${NC}"

CLASS_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/classes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"name\": \"EECS 281 Test ${TIMESTAMP}\"}")

CLASS_BODY=$(echo "$CLASS_RESPONSE" | sed '$d')
CLASS_STATUS=$(echo "$CLASS_RESPONSE" | tail -n 1)

assert_status "Create class returns 201" "201" "$CLASS_STATUS"
assert "Response contains class code" "code" "$CLASS_BODY"

CLASS_ID=$(echo "$CLASS_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
CLASS_CODE=$(echo "$CLASS_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['code'])" 2>/dev/null || echo "")

echo -e "  ${DIM}Class ID: ${CLASS_ID}${NC}"
echo -e "  ${DIM}Class code: ${CLASS_CODE}${NC}"
echo ""

# ──────────────────────────────────────────────
# 6. Verify class code (public endpoint, used by extension)
# ──────────────────────────────────────────────
echo -e "${CYAN}[6] Verify class code (public)${NC}"

VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/api/classes/verify/${CLASS_CODE}")
VERIFY_BODY=$(echo "$VERIFY_RESPONSE" | sed '$d')
VERIFY_STATUS=$(echo "$VERIFY_RESPONSE" | tail -n 1)

assert_status "Verify returns 200" "200" "$VERIFY_STATUS"
assert "Returns class name" "EECS 281" "$VERIFY_BODY"
echo ""

# ──────────────────────────────────────────────
# 7. Invalid class code should 404
# ──────────────────────────────────────────────
echo -e "${CYAN}[7] Invalid class code guard${NC}"

BAD_VERIFY=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/classes/verify/ZZZZZZ")
assert_status "Invalid code returns 404" "404" "$BAD_VERIFY"
echo ""

# ──────────────────────────────────────────────
# 8. Upload student logs (simulates VS Code extension)
# ──────────────────────────────────────────────
echo -e "${CYAN}[8] Upload student logs (extension simulation)${NC}"

UPLOAD_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/logs/upload" \
  -H "Content-Type: application/json" \
  -d "{
    \"studentEmail\": \"${STUDENT_EMAIL}\",
    \"classCode\": \"${CLASS_CODE}\",
    \"logs\": [
      {\"timestamp\": \"2026-03-25T10:00:00.000Z\", \"filename\": \"/project/main.py\", \"content\": \"print('hello world')\"},
      {\"timestamp\": \"2026-03-25T10:05:00.000Z\", \"filename\": \"/project/main.py\", \"content\": \"def greet(name):\\n    print(f'Hello {name}')\\n\\ngreet('Sanat')\"},
      {\"timestamp\": \"2026-03-25T10:10:00.000Z\", \"filename\": \"/project/utils.py\", \"content\": \"import os\\n\\ndef get_path():\\n    return os.getcwd()\"}
    ]
  }")

UPLOAD_BODY=$(echo "$UPLOAD_RESPONSE" | sed '$d')
UPLOAD_STATUS=$(echo "$UPLOAD_RESPONSE" | tail -n 1)

assert_status "Upload logs returns 201" "201" "$UPLOAD_STATUS"
assert "Upload success message" "successfully" "$UPLOAD_BODY"
echo ""

# ──────────────────────────────────────────────
# 9. List classes (professor)
# ──────────────────────────────────────────────
echo -e "${CYAN}[9] List professor's classes${NC}"

LIST_CLASSES=$(curl -s -w "\n%{http_code}" "${API_URL}/api/classes" \
  -H "Authorization: Bearer ${TOKEN}")

LIST_CLASSES_BODY=$(echo "$LIST_CLASSES" | sed '$d')
LIST_CLASSES_STATUS=$(echo "$LIST_CLASSES" | tail -n 1)

assert_status "List classes returns 200" "200" "$LIST_CLASSES_STATUS"
assert "Contains our class" "$CLASS_CODE" "$LIST_CLASSES_BODY"
echo ""

# ──────────────────────────────────────────────
# 10. List students in class
# ──────────────────────────────────────────────
echo -e "${CYAN}[10] List students in class${NC}"

STUDENTS_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/api/logs/students/${CLASS_CODE}" \
  -H "Authorization: Bearer ${TOKEN}")

STUDENTS_BODY=$(echo "$STUDENTS_RESPONSE" | sed '$d')
STUDENTS_STATUS=$(echo "$STUDENTS_RESPONSE" | tail -n 1)

assert_status "List students returns 200" "200" "$STUDENTS_STATUS"
assert "Contains our student" "$STUDENT_EMAIL" "$STUDENTS_BODY"
echo ""

# ──────────────────────────────────────────────
# 11. Get student logs
# ──────────────────────────────────────────────
echo -e "${CYAN}[11] Get student logs${NC}"

LOGS_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/api/logs/${STUDENT_EMAIL}" \
  -H "Authorization: Bearer ${TOKEN}")

LOGS_BODY=$(echo "$LOGS_RESPONSE" | sed '$d')
LOGS_STATUS=$(echo "$LOGS_RESPONSE" | tail -n 1)

assert_status "Get logs returns 200" "200" "$LOGS_STATUS"
assert "Logs contain filename" "main.py" "$LOGS_BODY"
assert "Logs contain code content" "hello world" "$LOGS_BODY"
echo ""

# ──────────────────────────────────────────────
# 12. Unauthorized access should fail
# ──────────────────────────────────────────────
echo -e "${CYAN}[12] Auth guard — no token${NC}"

NO_AUTH=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/classes")
assert_status "No token returns 401" "401" "$NO_AUTH"

BAD_TOKEN=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/classes" \
  -H "Authorization: Bearer invalidtoken123")
assert_status "Bad token returns 401" "401" "$BAD_TOKEN"
echo ""

# ──────────────────────────────────────────────
# 13. Delete student data
# ──────────────────────────────────────────────
echo -e "${CYAN}[13] Delete student data${NC}"

DEL_STUDENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
  "${API_URL}/api/logs/student/${STUDENT_EMAIL}/${CLASS_CODE}" \
  -H "Authorization: Bearer ${TOKEN}")

DEL_STUDENT_BODY=$(echo "$DEL_STUDENT_RESPONSE" | sed '$d')
DEL_STUDENT_STATUS=$(echo "$DEL_STUDENT_RESPONSE" | tail -n 1)

assert_status "Delete student data returns 200" "200" "$DEL_STUDENT_STATUS"
assert "Confirms deletion" "Deleted" "$DEL_STUDENT_BODY"

# Verify student is gone
STUDENTS_AFTER=$(curl -s "${API_URL}/api/logs/students/${CLASS_CODE}" \
  -H "Authorization: Bearer ${TOKEN}")

# Student should no longer appear
TOTAL=$((TOTAL + 1))
if echo "$STUDENTS_AFTER" | grep -q "$STUDENT_EMAIL"; then
  FAIL=$((FAIL + 1))
  echo -e "  ${RED}✗ Student still appears after deletion${NC}"
else
  PASS=$((PASS + 1))
  echo -e "  ${GREEN}✓${NC} Student removed from class roster"
fi
echo ""

# ──────────────────────────────────────────────
# 14. Delete class
# ──────────────────────────────────────────────
echo -e "${CYAN}[14] Delete class${NC}"

DEL_CLASS_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
  "${API_URL}/api/classes/${CLASS_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

DEL_CLASS_BODY=$(echo "$DEL_CLASS_RESPONSE" | sed '$d')
DEL_CLASS_STATUS=$(echo "$DEL_CLASS_RESPONSE" | tail -n 1)

assert_status "Delete class returns 200" "200" "$DEL_CLASS_STATUS"
assert "Confirms class deletion" "deleted" "$DEL_CLASS_BODY"

# Verify class code no longer resolves
VERIFY_AFTER=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/classes/verify/${CLASS_CODE}")
assert_status "Class code no longer valid" "404" "$VERIFY_AFTER"
echo ""

# ──────────────────────────────────────────────
# Results
# ──────────────────────────────────────────────
echo -e "${CYAN}══════════════════════════════════════════════${NC}"
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}ALL ${TOTAL} TESTS PASSED${NC}"
else
  echo -e "${RED}${FAIL}/${TOTAL} TESTS FAILED${NC} — ${GREEN}${PASS} passed${NC}"
fi
echo -e "${CYAN}══════════════════════════════════════════════${NC}"
echo ""

exit $FAIL
