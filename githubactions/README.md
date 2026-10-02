# GitHub Actions Workshop

## Note App + Daily Report

### App URL
https://note-app.gocools.workers.dev

### Secrets (GitHub → Settings → Secrets → Actions)

| Secret | For |
|--------|-----|
| `USER_CF_TOKEN` | Deploy note app |
| `USER_CF_ID` | Deploy note app |
| `BANK_CF_TOKEN` | Daily report |
| `BANK_CF_ID` | Daily report |
| `BANK_D1_ID` | Daily report (mini-bank D1) |
| `USER_RESEND_KEY` | Daily report |
| `USER_RESEND_EMAIL` | Daily report |

## Note App Setup

1. Create D1: `npx wrangler d1 create note-app`
2. Update `wrangler.toml` with D1 ID
3. Run migration: `npx wrangler d1 execute note-app --remote --file=migrations/001_initial.sql`
4. Push to main → auto-deploys!

## Daily Report

Runs every 5 minutes. Sends transaction reports via email.

## Workflows

- `deploy.yml` - Deploys note app on push
- `daily-report.yml` - Runs every 5 min + manual