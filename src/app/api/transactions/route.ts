import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let transactions;
    let total = 0;

    if (accountNumber) {
      // Get transactions for specific account (sent or received)
      transactions = await db.prepare(`
        SELECT * FROM transactions 
        WHERE from_account = ? OR to_account = ?
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `).bind(accountNumber, accountNumber, limit, offset).all();

      const countResult = await db.prepare(`
        SELECT COUNT(*) as count FROM transactions 
        WHERE from_account = ? OR to_account = ?
      `).bind(accountNumber, accountNumber).first() as { count: number };
      total = countResult?.count || 0;
    } else {
      // Get all transactions
      transactions = await db.prepare(`
        SELECT * FROM transactions 
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all();

      const countResult = await db.prepare(
        'SELECT COUNT(*) as count FROM transactions'
      ).first() as { count: number };
      total = countResult?.count || 0;
    }

    return NextResponse.json({
      transactions: transactions.results || [],
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}