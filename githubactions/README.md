# GitHub Actions Workshop

## Note App + Daily Report

### Secrets (GitHub → Settings → Secrets → Actions)

| Secret | For |
|--------|-----|
| `USER_CF_TOKEN` | Deploy note app |
| `USER_CF_ID` | Deploy note app |
| `BANK_CF_TOKEN` | Daily report |
| `BANK_CF_ID` | Daily report |
| `BANK_D1_ID` | Daily report |
| `USER_RESEND_KEY` | Daily report |
| `USER_RESEND_EMAIL` | Daily report |

## Note App Setup

1. Create D1: `npx wrangler d1 create note-app`
2. Update `wrangler.toml` with D1 ID
3. Run migration: `npx wrangler d1 execute note-app --remote --file=migrations/001_initial.sql`

## Daily Report

Runs every 5 minutes + manual trigger. Sends transaction reports via email.

## Database

```sql
-- Notes (note-app)
notes: id, content, created_at

-- Daily Report (use your existing mini-bank DB)
accounts: id, email, name, account_number, balance, is_active
transactions: id, from_email, to_email, amount, type, created_at
```