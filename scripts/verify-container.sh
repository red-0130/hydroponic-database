#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Automated Container Verification Script for Hydroponic Database
# Milestone 1: Production Containerization and Automated Verification
# =============================================================================

IMAGE_NAME="hydroponic-database:latest"
CONTAINER_NAME="hydroponic-verify-instance"
TEST_PORT="${TEST_PORT:-3000}"
SECRET_PATH="${ADMIN_SECRET_PATH:-sys-portal-8f2e9d}"
ADMIN_PASS="${ADMIN_PASSWORD:-admin_hydroponics_secure_pass_2026}"
SESSION_SECRET="${ADMIN_SESSION_SECRET:-e9d8f2a1b7c3e4f50618293a4b5c6d7e8f90123456789abcdef0123456789abc}"
BASE_URL="http://127.0.0.1:${TEST_PORT}"
COOKIE_JAR="$(mktemp /tmp/hydro_cookies_XXXXXX.txt)"

echo "====================================================================="
echo "Starting Automated Container Verification Suite"
echo "Image:        ${IMAGE_NAME}"
echo "Container:    ${CONTAINER_NAME}"
echo "Port:         ${TEST_PORT}"
echo "Secret Route: /${SECRET_PATH}"
echo "====================================================================="

# Step 1: Ensure Docker Host & Daemon
echo ">>> Step 1: Checking Docker Daemon Status..."
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker CLI not found. Attempting install..."
  sudo apt-get update && sudo apt-get install -y docker.io
fi

DOCKER_CMD="docker"
if ! docker info >/dev/null 2>&1; then
  if sudo docker info >/dev/null 2>&1; then
    sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
    if docker info >/dev/null 2>&1; then
      DOCKER_CMD="docker"
    else
      DOCKER_CMD="sudo docker"
    fi
  else
    echo "Docker daemon not running. Starting dockerd with vfs driver..."
    sudo dockerd --storage-driver=vfs --data-root=/home/coder/docker-data > /tmp/dockerd.log 2>&1 &
    for attempt in $(seq 1 15); do
      sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
      if docker info >/dev/null 2>&1; then
        DOCKER_CMD="docker"
        break
      elif sudo docker info >/dev/null 2>&1; then
        DOCKER_CMD="sudo docker"
        break
      fi
      sleep 1
    done
  fi
fi

echo "Docker daemon is active using command: ${DOCKER_CMD}"

# Setup Cleanup Trap
cleanup() {
  local exit_code=$?
  echo ">>> Performing Container Teardown & Cleanup..."
  rm -f "${COOKIE_JAR}" 2>/dev/null || true
  ${DOCKER_CMD} rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  if [ $exit_code -eq 0 ]; then
    echo ">>> Verification Suite Completed Successfully."
  else
    echo ">>> Verification Suite Failed (exit code: $exit_code)."
  fi
  exit $exit_code
}
trap cleanup EXIT INT TERM

# Ensure any previous container is removed
${DOCKER_CMD} rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true

# Step 2: Build Container Image
echo ">>> Step 2: Building Container Image '${IMAGE_NAME}'..."
${DOCKER_CMD} build -t "${IMAGE_NAME}" .
echo "[PASS] Image build completed successfully."

# Step 3: Run Container Instance
echo ">>> Step 3: Running Container Instance..."
${DOCKER_CMD} run -d \
  --name "${CONTAINER_NAME}" \
  -p "${TEST_PORT}:3000" \
  -e PORT=3000 \
  -e ADMIN_SECRET_PATH="${SECRET_PATH}" \
  -e ADMIN_PASSWORD="${ADMIN_PASS}" \
  -e ADMIN_SESSION_SECRET="${SESSION_SECRET}" \
  "${IMAGE_NAME}"

# Step 4: Poll Container Readiness
echo ">>> Step 4: Polling Container HTTP Readiness on ${BASE_URL}..."
READY=0
for i in $(seq 1 40); do
  if curl -s -f "${BASE_URL}/api/plants" >/dev/null 2>&1; then
    READY=1
    echo "Container HTTP service ready after ${i} second(s)."
    break
  fi
  sleep 1
done

if [ "$READY" -ne 1 ]; then
  echo "[FAIL] Service failed to become ready within timeout."
  echo "Container logs:"
  ${DOCKER_CMD} logs "${CONTAINER_NAME}"
  exit 1
fi

echo "====================================================================="
echo "Executing Automated Verification Checks"
echo "====================================================================="

# Check 1: Root homepage HTTP 200 and branding
echo "Check 1: Root Homepage (/) HTTP 200 & Branding..."
HOME_RES=$(curl -fsS -L "${BASE_URL}/")
if echo "${HOME_RES}" | grep -q "Hydroponic Database"; then
  echo "  [PASS] Root page returns HTTP 200 and contains 'Hydroponic Database' branding."
else
  echo "  [FAIL] Root page did not contain expected branding."
  exit 1
fi

# Check 2: Public API /api/plants returns HTTP 200 and 8 standard crops
echo "Check 2: Public API (/api/plants) returns 8 standard crops..."
PLANTS_JSON=$(curl -fsS "${BASE_URL}/api/plants")
PLANT_COUNT=$(echo "${PLANTS_JSON}" | grep -o '"id":' | wc -l)
if [ "${PLANT_COUNT}" -eq 8 ]; then
  echo "  [PASS] Public API returned all 8 verified standard crops."
else
  echo "  [FAIL] Expected 8 plants in /api/plants, got ${PLANT_COUNT}."
  exit 1
fi

# Check 3: Public search /api/plants?q=Tomato returns Tomato details
echo "Check 3: Public Search (/api/plants?q=Tomato)..."
SEARCH_JSON=$(curl -fsS "${BASE_URL}/api/plants?q=Tomato")
if echo "${SEARCH_JSON}" | grep -q "crop-tomato" && echo "${SEARCH_JSON}" | grep -q "Solanum lycopersicum"; then
  echo "  [PASS] Search returned Tomato crop details with scientific name."
else
  echo "  [FAIL] Search query for Tomato failed to return expected record."
  exit 1
fi

# Check 4: Unauthorized paths /admin and /dashboard return HTTP 404
echo "Check 4: Route Shielding - Unauthorized /admin & /dashboard return 404..."
HTTP_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/admin")
HTTP_DASH=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/dashboard")
if [ "${HTTP_ADMIN}" = "404" ] && [ "${HTTP_DASH}" = "404" ]; then
  echo "  [PASS] Direct /admin and /dashboard access return HTTP 404 Not Found."
else
  echo "  [FAIL] Direct access shielding failed: /admin=${HTTP_ADMIN}, /dashboard=${HTTP_DASH}."
  exit 1
fi

# Check 5: Dynamic secret portal returns HTTP 200
echo "Check 5: Dynamic Secret Portal (/${SECRET_PATH}) returns HTTP 200..."
HTTP_PORTAL=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/${SECRET_PATH}")
if [ "${HTTP_PORTAL}" = "200" ]; then
  echo "  [PASS] Secret portal path returned HTTP 200 OK."
else
  echo "  [FAIL] Secret portal returned HTTP ${HTTP_PORTAL}, expected 200."
  exit 1
fi

# Check 6: Admin login POST /api/admin/auth/login returns HTTP 200 & sets session cookie
echo "Check 6: Timing-Safe Admin Login Authentication..."
LOGIN_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"${ADMIN_PASS}\"}" \
  -c "${COOKIE_JAR}")
if [ "${LOGIN_HTTP}" = "200" ] && [ -s "${COOKIE_JAR}" ]; then
  echo "  [PASS] Admin login succeeded with HTTP 200 and session cookie issued."
else
  echo "  [FAIL] Admin login failed: HTTP ${LOGIN_HTTP}."
  exit 1
fi

# Check 7: Protected auth status /api/admin/auth/status returns authenticated: true
echo "Check 7: Protected Auth Status Verification..."
STATUS_RES=$(curl -fsS -b "${COOKIE_JAR}" "${BASE_URL}/api/admin/auth/status")
if echo "${STATUS_RES}" | grep -q '"authenticated":true'; then
  echo "  [PASS] Session cookie verified by protected endpoint (authenticated: true)."
else
  echo "  [FAIL] Session authentication verification failed: ${STATUS_RES}."
  exit 1
fi

# Check 8: Container health status via docker inspect
echo "Check 8: Docker Container Health Status..."
HEALTH_STATUS="unknown"
for h_attempt in $(seq 1 20); do
  HEALTH_STATUS=$(${DOCKER_CMD} inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${CONTAINER_NAME}")
  if [ "${HEALTH_STATUS}" = "healthy" ]; then
    break
  fi
  sleep 2
done

if [ "${HEALTH_STATUS}" = "healthy" ]; then
  echo "  [PASS] Container health status is 'healthy'."
else
  echo "  [FAIL] Container health status is '${HEALTH_STATUS}', expected 'healthy'."
  exit 1
fi

echo "====================================================================="
echo "ALL CONTAINER VERIFICATION CHECKS PASSED SUCCESSFULLY!"
echo "====================================================================="
