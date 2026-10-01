import { NextRequest, NextResponse } from 'next/server';
import { getDb, formatCurrency } from '@/lib/db';

// Static export for Cloudflare Pages
export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const accountNumber = request.headers.get('x-account-number');

    if (!accountNumber) {
      return NextResponse.json(
        { error: 'Account not identified' },
        { status: 401 }
      );
    }

    // Get account details
    const account = await db.prepare(
      'SELECT * FROM accounts WHERE account_number = ?'
    ).bind(accountNumber).first();

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Get transactions
    const transactions = await db.prepare(`
      SELECT * FROM transactions 
      WHERE from_account = ? OR to_account = ?
      ORDER BY timestamp DESC
      LIMIT 20
    `).bind(accountNumber, accountNumber).all();

    // Calculate totals
    const sentResult = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE from_account = ?
    `).bind(accountNumber).first() as { total: number };

    const receivedResult = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE to_account = ?
    `).bind(accountNumber).first() as { total: number };

    const report = {
      account_number: account.account_number,
      name: account.name,
      balance: account.balance,
      total_sent: sentResult?.total || 0,
      total_received: receivedResult?.total || 0,
      transaction_count: transactions.results?.length || 0,
      transactions: transactions.results || [],
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}