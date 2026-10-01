import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';

// Sync Google user to our database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { googleId, email, name, image } = body;

    if (!googleId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check if user exists
    let user = await db.prepare(
      'SELECT * FROM users WHERE google_id = ? OR email = ?'
    ).bind(googleId, email).first();

    if (!user) {
      // Create new user
      const id = generateId('user');
      await db.prepare(
        'INSERT INTO users (id, google_id, email, name, image) VALUES (?, ?, ?, ?, ?)'
      ).bind(id, googleId, email, name, image || null).run();

      user = await db.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).bind(id).first();
    } else {
      // Update existing user info
      await db.prepare(
        'UPDATE users SET name = ?, image = ?, updated_at = datetime("now") WHERE id = ?'
      ).bind(name, image || null, user.id).run();
    }

    // Check if user has a bank account
    const account = await db.prepare(
      'SELECT * FROM accounts WHERE user_id = ? AND is_active = 1'
    ).bind(user.id).first();

    return NextResponse.json({
      user,
      hasAccount: !!account,
      accountNumber: account?.account_number || null,
    });
  } catch (error) {
    console.error('Auth sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}