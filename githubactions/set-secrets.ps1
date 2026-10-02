# Set GitHub Actions secrets from .env file

$REPO = "gokulupadhyayguragain/mini-bank"

if (-not (Test-Path ".env")) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    Write-Host "Create .env file with these variables:"
    Write-Host "USER_CF_TOKEN=your-token"
    Write-Host "USER_CF_ID=your-id"
    Write-Host "BANK_CF_TOKEN=your-token"
    Write-Host "BANK_CF_ID=your-id"
    Write-Host "BANK_D1_ID=your-d1-id"
    Write-Host "USER_RESEND_KEY=your-key"
    Write-Host "USER_RESEND_EMAIL=your-email"
    exit 1
}

Get-Content ".env" | ForEach-Object {
    if ($_ -notmatch "^#" -and $_ -match "=") {
        $key, $value = $_ -split "=", 2
        Set-Item -Path "env:$key" -Value $value
    }
}

Write-Host "Setting GitHub secrets..."

gh secret set USER_CF_TOKEN --body $env:USER_CF_TOKEN --repo $REPO
gh secret set USER_CF_ID --body $env:USER_CF_ID --repo $REPO
gh secret set BANK_CF_TOKEN --body $env:BANK_CF_TOKEN --repo $REPO
gh secret set BANK_CF_ID --body $env:BANK_CF_ID --repo $REPO
gh secret set BANK_D1_ID --body $env:BANK_D1_ID --repo $REPO
gh secret set USER_RESEND_KEY --body $env:USER_RESEND_KEY --repo $REPO
gh secret set USER_RESEND_EMAIL --body $env:USER_RESEND_EMAIL --repo $REPO

Write-Host "All secrets set!" -ForegroundColor Green