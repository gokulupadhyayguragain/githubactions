import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

export async function POST(request: Request, env: Env) {
  try {
    const { email } = await request.json();

    // Generate report data
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
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate report' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}