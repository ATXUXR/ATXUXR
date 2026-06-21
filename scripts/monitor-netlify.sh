#!/bin/bash

# Netlify Build Monitor - Checks actual deploy status
# Requires: NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN env vars

SITE_ID="${NETLIFY_SITE_ID}"
AUTH_TOKEN="${NETLIFY_AUTH_TOKEN}"
TIMEOUT=${1:-300}  # 5 minutes default
CHECK_INTERVAL=5
ELAPSED=0

if [ -z "$SITE_ID" ] || [ -z "$AUTH_TOKEN" ]; then
  echo "⚠️  NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN not set"
  echo "Cannot check actual Netlify build status"
  echo "Falling back to HTTP health check..."
  exit 2
fi

echo "🔍 Monitoring Netlify build status..."
echo "Site ID: $SITE_ID"
echo ""

while [ $ELAPSED -lt $TIMEOUT ]; do
  # Get latest deploy from Netlify API
  DEPLOY=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
    "https://api.netlify.com/api/v1/sites/$SITE_ID/builds?per_page=1" | \
    grep -o '"state":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ ! -z "$DEPLOY" ]; then
    case $DEPLOY in
      success)
        echo "✅ BUILD SUCCESSFUL!"
        echo "Status: $DEPLOY"
        exit 0
        ;;
      failed)
        echo "❌ BUILD FAILED!"
        # Get error details
        ERROR_LOG=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
          "https://api.netlify.com/api/v1/sites/$SITE_ID/builds?per_page=1" | \
          grep -o '"error_message":"[^"]*"' | cut -d'"' -f4)
        echo "Error: $ERROR_LOG"
        exit 1
        ;;
      building|queued)
        echo "⏳ Build in progress ($DEPLOY)..."
        ;;
    esac
  else
    echo "⏳ Checking build status..."
  fi

  sleep $CHECK_INTERVAL
  ELAPSED=$((ELAPSED + CHECK_INTERVAL))
done

echo ""
echo "⚠️  Build check timed out after ${TIMEOUT}s"
echo "Check manual status: https://app.netlify.com/sites/atxuxr/deploys"
exit 2
