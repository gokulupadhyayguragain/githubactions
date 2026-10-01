#!/bin/bash

# Deploy to Cloudflare Pages
# This script uploads files with the correct structure

PROJECT_NAME="mini-bank"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"
BRANCH="main"

# Build the app
echo "Building Next.js app..."
npm run build

# Remove cache
rm -rf .next/cache

echo "Deploying to Cloudflare Pages..."

# Create a deployment
RESPONSE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"branch":"'"${BRANCH}"'","meta":{"commit_sha":"'"$(git rev-parse HEAD)"'"}}')

echo "Deployment response: $RESPONSE"