/**
 * Daily Transaction Report Generator
 * Fetches transactions from D1 and sends CSV via Resend email
 */

const https = require('https');

const config = {
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  d1DatabaseId: process.env.D1_DATABASE_ID,
  resendApiKey: process.env.RESEND_API_KEY,
  reportEmail: process.env.REPORT_EMAIL,
};

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function queryD1(sql, params = []) {
  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${config.cloudflareAccountId}/d1/database/${config.d1DatabaseId}/query`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.cloudflareApiToken}`,
      'Content-Type': 'application/json',
    },
  };
  const body = JSON.stringify({ sql, params });
  const response = await makeRequest(options, body);
  if (response.status !== 200 || !response.data.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(response.data)}`);
  }
  return response.data.result[0].results;
}

async function getAllAccounts() {
  return queryD1('SELECT * FROM accounts WHERE is_active = 1');
}

async function getDailyTransactions(email) {
  return queryD1(`
    SELECT * FROM transactions 
    WHERE (from_email = ? OR to_email = ?) 
    AND created_at >= datetime('now', '-1 day')
    ORDER BY created_at DESC
  `, [email, email]);
}

function transactionsToCSV(transactions, accountEmail) {
  if (transactions.length === 0) return 'No transactions in the last 24 hours';
  const headers = ['Date', 'Type', 'From', 'To', 'Amount', 'Direction'];
  const rows = transactions.map((t) => {
    const direction = t.from_email === accountEmail ? 'OUT' : 'IN';
    const amount = direction === 'OUT' ? `-${t.amount}` : `+${t.amount}`;
    return [t.created_at, t.type, t.from_email, t.to_email, amount, direction].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

async function sendEmail(to, subject, text, csvAttachment) {
  const boundary = '----FormBoundary' + Date.now();
  const emailContent = [
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    text,
    `--${boundary}`,
    'Content-Type: text/csv; charset=utf-8',
    `Content-Disposition: attachment; filename="daily-report.csv"`,
    '',
    csvAttachment,
    `--${boundary}--`,
  ].join('\r\n');

  const options = {
    hostname: 'api.resend.com',
    path: '/emails',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.resendApiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
  };
  const response = await makeRequest(options, emailContent);
  if (response.status !== 200) {
    throw new Error(`Failed to send email: ${JSON.stringify(response.data)}`);
  }
  return response.data;
}

async function main() {
  console.log('Starting daily report generation...');
  try {
    const accounts = await getAllAccounts();
    console.log(`Found ${accounts.length} active accounts`);
    for (const account of accounts) {
      console.log(`Processing account: ${account.email}`);
      const transactions = await getDailyTransactions(account.email);
      console.log(`Found ${transactions.length} transactions`);
      const csv = transactionsToCSV(transactions, account.email);
      const subject = `Mini Bank Daily Report - ${new Date().toLocaleDateString()}`;
      const text = `Dear ${account.name},

Here is your daily transaction summary for account ${account.account_number}.

Current Balance: Rs. ${account.balance.toLocaleString()}

Transactions in the last 24 hours: ${transactions.length}

Please find the detailed CSV report attached.

Best regards,
Mini Bank Team`;
      await sendEmail(account.email, subject, text, csv);
      console.log(`Report sent to ${account.email}`);
    }
    console.log('Daily report generation completed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();