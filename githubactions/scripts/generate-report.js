/**
 * Daily Transaction Report Generator
 * Sends a summary report to the configured email
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

async function getDailyTransactions() {
  return queryD1(`SELECT * FROM transactions WHERE created_at >= datetime('now', '-1 day') ORDER BY created_at DESC`);
}

function generateCSV(transactions) {
  if (transactions.length === 0) return 'No transactions today';
  const headers = ['Date', 'From', 'To', 'Amount', 'Type'];
  const rows = transactions.map(t => [t.created_at, t.from_email, t.to_email, t.amount, t.type || 'transfer']);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

async function sendEmail(text) {
  if (!config.resendApiKey || !config.reportEmail) {
    console.log('Resend not configured - skipping email');
    return;
  }
  const res = await makeRequest({
    hostname: 'api.resend.com', path: '/emails', method: 'POST',
    headers: { 'Authorization': `Bearer ${config.resendApiKey}`, 'Content-Type': 'application/json' },
  }, JSON.stringify({
    from: 'Mini Bank <onboarding@resend.dev>',
    to: config.reportEmail,
    subject: `Daily Report - ${new Date().toLocaleDateString()}`,
    text: text
  }));
  if (res.status !== 200) {
    console.log('Email failed:', res.data);
    throw new Error('Email failed');
  }
}

async function main() {
  if (!config.cloudflareApiToken || !config.cloudflareAccountId || !config.d1DatabaseId) {
    console.log('Missing Cloudflare config - skipping report generation');
    return;
  }
  console.log('Generating reports...');
  try {
    const accounts = await getAllAccounts();
    const transactions = await getDailyTransactions();
    
    console.log(`Found ${accounts.length} accounts, ${transactions.length} transactions`);
    
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const report = [
      `Mini Bank Daily Report - ${new Date().toLocaleDateString()}`,
      '',
      `Total Accounts: ${accounts.length}`,
      `Total Balance: Rs. ${totalBalance}`,
      `Transactions Today: ${transactions.length}`,
      '',
      '--- Accounts ---',
      ...accounts.map(a => `${a.name} (${a.email}): Rs. ${a.balance}`),
      '',
      '--- Today\'s Transactions ---',
      transactions.length === 0 ? 'No transactions' : transactions.map(t => 
        `${t.created_at}: ${t.from_email} -> ${t.to_email}: Rs. ${t.amount}`
      ).join('\n')
    ].join('\n');
    
    await sendEmail(report);
    console.log('Report sent to:', config.reportEmail);
  } catch (e) {
    console.log('Error:', e.message);
  }
  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });