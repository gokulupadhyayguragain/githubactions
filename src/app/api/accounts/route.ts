import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';

// Use edge runtime for Cloudflare Pages
export const runtime = 'edge';

// Generate 5-digit hex account number (00000-FFFFF)
function generateHexAccountNumber(): string {
  return Math.floor(Math.random() * 0xFFFFF).toString(16).toUpperCase().padStart(5, '0');
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const all = searchParams.get('all') === 'true';

    // Get account from header (authenticated user)
    const accountNumber = request.headers.get('x-account-number');
    
    if (accountNumber && !all) {
      // Return single account
      const account = await db.prepare(
        'SELECT * FROM accounts WHERE account_number = ? AND is_active = 1'
      ).bind(accountNumber).first();

      if (!account) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }

      // Get user info
      const user = await db.prepare(
        'SELECT name, email, image FROM users WHERE id = ?'
      ).bind(account.user_id).first();

      return NextResponse.json({ 
        account: { ...account, ...user } 
      });
    }

    // Return all accounts (admin only)
    const accounts = await db.prepare(`
      SELECT a.*, u.name, u.email, u.image 
      FROM accounts a 
      JOIN users u ON a.user_id = u.id 
      WHERE a.is_active = 1
      ORDER BY a.created_at DESC
    `).all();

    return NextResponse.json({ accounts: accounts.results || [] });
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from header (authenticated)
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    const userName = request.headers.get('x-user-name');

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Check if user already has an account
    const existingAccount = await db.prepare(
      'SELECT * FROM accounts WHERE user_id = ? AND is_active = 1'
    ).bind(userId).first();

    if (existingAccount) {
      return NextResponse.json(
        { 
          account: existingAccount,
          message: 'Account already exists'
        },
        { status: 200 }
      );
    }

    // Generate unique 5-digit hex account number
    let accountNumber: string;
    let attempts = 0;
    do {
      accountNumber = generateHexAccountNumber();
      const existing = await db.prepare(
        'SELECT id FROM accounts WHERE account_number = ?'
      ).bind(accountNumber).first();
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    // Create account
    const id = generateId('acc');
    await db.prepare(
      'INSERT INTO accounts (id, user_id, account_number, balance) VALUES (?, ?, ?, ?)'
    ).bind(id, userId, accountNumber, 1000).run();

    const account = await db.prepare(
      'SELECT * FROM accounts WHERE id = ?'
    ).bind(id).first();

    return NextResponse.json(
      { 
        success: true, 
        message: 'Account created successfully',
        account,
        startingBalance: 1000
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create account error:', error);
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Account already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}