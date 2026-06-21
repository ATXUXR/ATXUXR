#!/bin/bash

# Netlify Build Status Monitor
# Usage: ./scripts/check-netlify-status.sh [timeout-seconds]

TIMEOUT=${1:-180}  # Default 3 minutes
REPO="ATXUXR/ATXUXR"
CHECK_INTERVAL=10
ELAPSED=0

echo "🔍 Monitoring Netlify build status..."
echo "⏱️  Timeout: ${TIMEOUT}s"
echo ""

# Get latest commit
LATEST_SHA=$(git rev-parse --short HEAD)
echo "📍 Latest commit: $LATEST_SHA"
echo ""

while [ $ELAPSED -lt $TIMEOUT ]; do
  # Check site health (simple way to verify if latest deploy is up)
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://www.austinuxresearchers.com" 2>/dev/null)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SITE IS LIVE!"
    echo "Build appears successful - site is responding"
    exit 0
  fi
  
  echo "⏳ Checking status... (HTTP: $HTTP_CODE | Elapsed: ${ELAPSED}s)"
  sleep $CHECK_INTERVAL
  ELAPSED=$((ELAPSED + CHECK_INTERVAL))
done

echo ""
echo "⚠️ Check Netlify dashboard for status:"
echo "https://app.netlify.com/sites/atxuxr/deploys"
exit 2
