import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';

interface CreateAccountRequest {
  name: string;
  email: string;
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

    // Get account from header
    const accountNumber = request.headers.get('x-account-number');
    
    if (accountNumber) {
      // Return single account
      const account = await db.prepare(
        'SELECT * FROM accounts WHERE account_number = ?'
      ).bind(accountNumber).first();

      if (!account) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ account });
    }

    // Return all accounts
    const accounts = await db.prepare(
      'SELECT * FROM accounts ORDER BY created_at DESC'
    ).all();

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
    const body: CreateAccountRequest = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Generate account number
    const accountCount = await db.prepare('SELECT COUNT(*) as count FROM accounts').first() as { count: number };
    const accountNumber = `GC${String(accountCount.count + 1).padStart(3, '0')}`;

    // Create account
    const id = generateId('acc');
    await db.prepare(
      'INSERT INTO accounts (id, account_number, name, email, role, balance) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, accountNumber, name, email, 'user', 1000).run();

    const account = await db.prepare(
      'SELECT * FROM accounts WHERE id = ?'
    ).bind(id).first();

    return NextResponse.json(
      { 
        success: true, 
        message: 'Account created successfully',
        account 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create account error:', error);
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}