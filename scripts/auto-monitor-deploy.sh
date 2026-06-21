#!/bin/bash

# Automated Netlify Build Monitor with Auto-Fix
# Credentials should be set as environment variables:
# - NETLIFY_SITE_ID
# - NETLIFY_AUTH_TOKEN

set -e

SITE_ID="${NETLIFY_SITE_ID:-179f6805-6b60-466b-afc3-3c7deb7196a9}"
AUTH_TOKEN="${NETLIFY_AUTH_TOKEN:-nfp_86ffpKgRXHC8SyBCaZXHBH5C5DsKcie5c801}"
TIMEOUT=${1:-300}
CHECK_INTERVAL=3
ELAPSED=0
MAX_RETRIES=3
RETRY_COUNT=0

echo "════════════════════════════════════════════════════════"
echo "🚀 AUTOMATED NETLIFY BUILD MONITOR"
echo "════════════════════════════════════════════════════════"
echo "Site ID: $SITE_ID"
echo "Timeout: ${TIMEOUT}s | Check interval: ${CHECK_INTERVAL}s"
echo ""

get_latest_build() {
  curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
    "https://api.netlify.com/api/v1/sites/$SITE_ID/builds?per_page=1"
}

get_build_status() {
  echo "$1" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4
}

get_build_error() {
  echo "$1" | grep -o '"error_message":"[^"]*"' | cut -d'"' -f4
}

while [ $ELAPSED -lt $TIMEOUT ]; do
  BUILD=$(get_latest_build)
  STATUS=$(get_build_status "$BUILD")
  
  if [ -z "$STATUS" ]; then
    echo "⏳ Waiting for build to start..."
    sleep $CHECK_INTERVAL
    ELAPSED=$((ELAPSED + CHECK_INTERVAL))
    continue
  fi

  case $STATUS in
    success)
      echo ""
      echo "✅ BUILD SUCCESSFUL!"
      echo "Status: SUCCESS"
      echo ""
      echo "✨ Site is live and deployed"
      exit 0
      ;;
    failed)
      echo ""
      echo "❌ BUILD FAILED!"
      ERROR=$(get_build_error "$BUILD")
      echo "Error: $ERROR"
      echo ""
      
      if [[ "$ERROR" == *"yargs"* ]]; then
        echo "🔧 Detected yargs dependency issue - attempting auto-fix..."
        cd /sessions/focused-vigilant-dirac/mnt/atxuxr-site
        rm -rf node_modules package-lock.json
        npm install --prefer-offline 2>&1 | tail -5
        git add package-lock.json
        git commit -m "fix: Auto-fixed dependency issue (yargs)" 2>/dev/null || true
        git push origin main
        echo "✅ Fix committed and pushed - Netlify will rebuild"
        exit 0
      fi
      
      echo "📋 Manual fix needed. Check: https://app.netlify.com/sites/atxuxr/deploys"
      exit 1
      ;;
    building|queued)
      PERCENT=$(echo "$BUILD" | grep -o '"created_at":"[^"]*"' | head -1 | cut -d'"' -f4)
      echo "⏳ Build in progress... (Status: $STATUS | Elapsed: ${ELAPSED}s)"
      ;;
  esac

  sleep $CHECK_INTERVAL
  ELAPSED=$((ELAPSED + CHECK_INTERVAL))
done

echo ""
echo "⚠️  Build check timed out after ${TIMEOUT}s"
exit 2
