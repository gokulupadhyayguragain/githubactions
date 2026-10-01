import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  NEXTAUTH_URL?: string;
}

// D1 Database interaction helper
async function handleAPI(path: string, request: Request, env: Env) {
  const url = new URL(request.url);
  const method = request.method;

  // /api/accounts
  if (path === '/api/accounts') {
    if (method === 'GET') {
      const email = url.searchParams.get('email');
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email is required' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const accounts = await env.DB.prepare('SELECT * FROM accounts WHERE email = ? LIMIT 1')
        .bind(email)
        .all();

      return new Response(JSON.stringify({ accounts: accounts.results }), { 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (method === 'POST') {
      const userId = request.headers.get('x-user-id');
      const email = request.headers.get('x-user-email');
      const name = request.headers.get('x-user-name');

      if (!userId || !email || !name) {
        return new Response(JSON.stringify({ error: 'Missing user data' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Generate 5-digit hex account number
      const accountNumber = Math.floor(0x10000 + Math.random() * 0x90000).toString(16);

      // Check if account already exists
      const existing = await env.DB.prepare('SELECT * FROM accounts WHERE email = ?')
        .bind(email)
        .first();

      if (existing) {
        return new Response(JSON.stringify({ account: existing }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Insert new account with ₹1000 initial balance
      await env.DB.prepare(`
        INSERT INTO accounts (user_id, email, name, account_number, balance)
        VALUES (?, ?, ?, ?, 1000)
      `).bind(userId, email, name, accountNumber);

      const newAccount = await env.DB.prepare('SELECT * FROM accounts WHERE email = ?')
        .bind(email)
        .first();

      return new Response(JSON.stringify({ account: newAccount }), { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // /api/transfer
  if (path === '/api/transfer') {
    if (method === 'POST') {
      const { fromEmail, toEmail, amount } = await request.json();

      if (!fromEmail || !toEmail || !amount) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid amount' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const fromAccount = await env.DB.prepare('SELECT * FROM accounts WHERE email = ?')
        .bind(fromEmail)
        .first();

      if (!fromAccount) {
        return new Response(JSON.stringify({ error: 'Sender account not found' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (fromAccount.balance < amountNum) {
        return new Response(JSON.stringify({ error: 'Insufficient balance' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const toAccount = await env.DB.prepare('SELECT * FROM accounts WHERE email = ?')
        .bind(toEmail)
        .first();

      if (!toAccount) {
        return new Response(JSON.stringify({ error: 'Recipient account not found' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await env.DB.prepare('UPDATE accounts SET balance = balance - ? WHERE email = ?')
        .bind(amountNum, fromEmail)
        .run();

      await env.DB.prepare('UPDATE accounts SET balance = balance + ? WHERE email = ?')
        .bind(amountNum, toEmail)
        .run();

      await env.DB.prepare(`
        INSERT INTO transactions (from_email, to_email, amount, type)
        VALUES (?, ?, ?, 'transfer')
      `).bind(fromEmail, toEmail, amountNum);

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Transfer successful',
        newBalance: fromAccount.balance - amountNum
      }), { 
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // /api/transactions
  if (path === '/api/transactions') {
    if (method === 'GET') {
      const email = url.searchParams.get('email');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      if (!email) {
        return new Response(JSON.stringify({ error: 'Email is required' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const transactions = await env.DB.prepare(`
        SELECT * FROM transactions 
        WHERE from_email = ? OR to_email = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(email, email, limit).all();

      return new Response(JSON.stringify({ transactions: transactions.results }), { 
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // /api/requests
  if (path === '/api/requests') {
    if (method === 'POST') {
      const { fromEmail, toEmail, amount, message } = await request.json();

      if (!fromEmail || !toEmail || !amount) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await env.DB.prepare(`
        INSERT INTO transaction_requests (from_email, to_email, amount, message, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).bind(fromEmail, toEmail, amount, message || '');

      return new Response(JSON.stringify({ success: true }), { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // /api/report
  if (path === '/api/report') {
    if (method === 'GET') {
      const reports = await env.DB.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT 100').all();
      return new Response(JSON.stringify({ reports: reports.results }), { 
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // /api/admin/report
  if (path === '/api/admin/report') {
    if (method === 'POST') {
      const { email } = await request.json();
      const transactions = await env.DB.prepare(`
        SELECT * FROM transactions 
        WHERE from_email = ? OR to_email = ?
        ORDER BY created_at DESC
        LIMIT 1000
      `).bind(email, email).all();

      const accounts = await env.DB.prepare('SELECT * FROM accounts').all();

      const report = {
        email,
        generatedAt: new Date().toISOString(),
        transactions: transactions.results,
        totalAccounts: accounts.results.length,
        totalTransactions: transactions.results.length,
      };

      return new Response(JSON.stringify({ success: true, report }), { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Check if this is an API route
    if (path.startsWith('/api/')) {
      return handleAPI(path, request, env);
    }

    // For non-API routes, serve the static Next.js app
    return fetch(request);
  },
};