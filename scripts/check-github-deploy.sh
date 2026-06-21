#!/bin/bash

# Check GitHub Deployment Status (includes Netlify status)
REPO="ATXUXR/ATXUXR"
TIMEOUT=${1:-180}
CHECK_INTERVAL=5
ELAPSED=0

echo "🔍 Checking GitHub deployment status..."
echo "Repository: $REPO"
echo ""

while [ $ELAPSED -lt $TIMEOUT ]; do
  # Get latest deployment status
  STATUS=$(curl -s "https://api.github.com/repos/$REPO/deployments?per_page=1" | \
    grep -o '"state":"[^"]*"' | head -1 | cut -d'"' -f4)

  ENVIRONMENT=$(curl -s "https://api.github.com/repos/$REPO/deployments?per_page=1" | \
    grep -o '"environment":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ ! -z "$STATUS" ]; then
    case $STATUS in
      success)
        echo "✅ DEPLOYMENT SUCCESSFUL!"
        echo "Status: $STATUS"
        echo "Environment: $ENVIRONMENT"
        exit 0
        ;;
      failure|error)
        echo "❌ DEPLOYMENT FAILED!"
        echo "Status: $STATUS"
        echo "Environment: $ENVIRONMENT"
        echo ""
        echo "📋 Check deployment details:"
        echo "https://github.com/$REPO/deployments"
        exit 1
        ;;
      pending|in_progress)
        echo "⏳ Deployment in progress ($STATUS)..."
        ;;
    esac
  else
    echo "⏳ Waiting for deployment to start..."
  fi

  sleep $CHECK_INTERVAL
  ELAPSED=$((ELAPSED + CHECK_INTERVAL))
  echo "   ($ELAPSED/$TIMEOUT seconds elapsed)"
done

echo ""
echo "⚠️  Deployment check timed out after ${TIMEOUT}s"
echo "Check status: https://github.com/$REPO/deployments"
exit 2
