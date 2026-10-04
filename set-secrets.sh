#!/bin/bash
# Set GitHub Actions secrets from .env file

REPO="gokulupadhyayguragain/githubactions"

# Load .env file (create one with your values)
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found!"
    echo "Create .env file with these variables:"
    echo "USER_CF_TOKEN=your-token"
    echo "USER_CF_ID=your-id"
    echo "BANK_CF_TOKEN=your-token"
    echo "BANK_CF_ID=your-id"
    echo "BANK_D1_ID=your-d1-id"
    echo "USER_RESEND_KEY=your-key"
    echo "USER_RESEND_EMAIL=your-email"
    exit 1
fi

echo "Setting GitHub secrets..."

gh secret set USER_CF_TOKEN --body "$USER_CF_TOKEN" --repo "$REPO"
gh secret set USER_CF_ID --body "$USER_CF_ID" --repo "$REPO"
gh secret set BANK_CF_TOKEN --body "$BANK_CF_TOKEN" --repo "$REPO"
gh secret set BANK_CF_ID --body "$BANK_CF_ID" --repo "$REPO"
gh secret set BANK_D1_ID --body "$BANK_D1_ID" --repo "$REPO"
gh secret set USER_RESEND_KEY --body "$USER_RESEND_KEY" --repo "$REPO"
gh secret set USER_RESEND_EMAIL --body "$USER_RESEND_EMAIL" --repo "$REPO"

echo "All secrets set!"