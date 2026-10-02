/**
 * Daily Transaction Report Generator
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
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, data }); }
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
    headers: { 'Authorization': `Bearer ${config.cloudflareApiToken}`, 'Content-Type': 'application/json' },
  };
  const response = await makeRequest(options, JSON.stringify({ sql, params }));
  if (response.status !== 200 || !response.data.success) throw new Error('D1 query failed');
  return response.data.result[0].results;
}

async function getAllAccounts() {
  return queryD1('SELECT * FROM accounts WHERE is_active = 1');
}

async function getDailyTransactions(email) {
  return queryD1(`SELECT * FROM transactions WHERE (from_email = ? OR to_email = ?) AND created_at >= datetime('now', '-1 day') ORDER BY created_at DESC`, [email, email]);
}

function transactionsToCSV(transactions, accountEmail) {
  if (transactions.length === 0) return 'No transactions';
  const headers = ['Date', 'Type', 'From', 'To', 'Amount', 'Direction'];
  const rows = transactions.map(t => {
    const dir = t.from_email === accountEmail ? 'OUT' : 'IN';
    return [t.created_at, t.type, t.from_email, t.to_email, dir === 'OUT' ? `-${t.amount}` : `+${t.amount}`, dir].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

async function sendEmail(to, subject, text, csv) {
  if (!config.resendApiKey || !config.reportEmail) {
    console.log(`Skipping email to ${to} - Resend not configured`);
    return;
  }
  const boundary = '----FormBoundary' + Date.now();
  const body = [`--${boundary}`, 'Content-Type: text/plain; charset=utf-8', '', text, `--${boundary}`, 'Content-Type: text/csv; charset=utf-8', 'Content-Disposition: attachment; filename="report.csv"', '', csv, `--${boundary}--`].join('\r\n');
  
  const res = await makeRequest({
    hostname: 'api.resend.com', path: '/emails', method: 'POST',
    headers: { 'Authorization': `Bearer ${config.resendApiKey}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
  }, body);
  if (res.status !== 200) throw new Error('Email failed');
}

async function main() {
  if (!config.cloudflareApiToken || !config.cloudflareAccountId || !config.d1DatabaseId) {
    console.log('Missing Cloudflare config - skipping report generation');
    return;
  }
  console.log('Generating reports...');
  try {
    const accounts = await getAllAccounts();
    console.log(`Found ${accounts.length} accounts`);
    for (const acc of accounts) {
      const txns = await getDailyTransactions(acc.email);
      console.log(`${acc.email}: ${txns.length} transactions`);
      const csv = transactionsToCSV(txns, acc.email);
      await sendEmail(acc.email, `Report - ${new Date().toLocaleDateString()}`, `Hi ${acc.name}, Balance: Rs. ${acc.balance}\n\nTransactions: ${txns.length}`, csv);
      console.log(`Sent to ${acc.email}`);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });