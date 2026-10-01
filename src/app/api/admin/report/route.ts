import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Admin report endpoint - returns overall bank statistics
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Check for admin role (simple check via header for demo)
    const role = request.headers.get('x-account-role');
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get total accounts
    const accountsResult = await db.prepare(
      'SELECT COUNT(*) as count FROM accounts'
    ).first() as { count: number };

    // Get active accounts (with transactions)
    const activeResult = await db.prepare(`
      SELECT COUNT(DISTINCT from_account) + COUNT(DISTINCT to_account) as count 
      FROM transactions
    `).first() as { count: number };

    // Get total transactions
    const transactionsResult = await db.prepare(
      'SELECT COUNT(*) as count FROM transactions'
    ).first() as { count: number };

    // Get total money transferred
    const transferredResult = await db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions'
    ).first() as { total: number };

    // Get recent transactions
    const recentTransactions = await db.prepare(`
      SELECT * FROM transactions 
      ORDER BY timestamp DESC
      LIMIT 10
    `).all();

    const report = {
      total_accounts: accountsResult?.count || 0,
      active_accounts: activeResult?.count || 0,
      total_transactions: transactionsResult?.count || 0,
      total_transferred: transferredResult?.total || 0,
      recent_transactions: recentTransactions.results || [],
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Get admin report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate admin report' },
      { status: 500 }
    );
  }
}