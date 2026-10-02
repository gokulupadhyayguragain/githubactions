# Daily Transaction Report Workflow

Sends daily transaction reports to all Mini Bank account holders via email.

## Setup

### 1. Copy Files

- `.github/workflows/daily-report.yml` → `.github/workflows/daily-report.yml`
- `scripts/generate-report.js` → `scripts/generate-report.js`

### 2. Add GitHub Secrets

Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | `53e5a5ffc81a032a83bc2f12419485e1` |
| `D1_DATABASE_ID` | `82f17137-672a-4dba-b694-df0fb8f21a09` |
| `RESEND_API_KEY` | Your Resend API key |
| `RESEND_EMAIL` | Your Resend account email |

### 3. Enable Workflow

Go to **Actions** → Enable "Daily Transaction Report"

## How It Works

1. Runs every 5 minutes (or manually trigger)
2. Queries D1 for all active accounts
3. Gets last 24h transactions for each account
4. Sends CSV report via Resend email

## Database Tables

```sql
accounts: id, email, name, account_number, balance, is_active
transactions: id, from_email, to_email, amount, type, created_at
```