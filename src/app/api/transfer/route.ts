import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';

interface TransferRequest {
  to: string;
  amount: number;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TransferRequest = await request.json();
    const { to, amount, description } = body;

    // Validate input
    if (!to || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid transfer details. Provide recipient and positive amount.' },
        { status: 400 }
      );
    }

    // Get account from header (simulated auth)
    const accountNumber = request.headers.get('x-account-number');
    if (!accountNumber) {
      return NextResponse.json(
        { error: 'Account not identified. Set x-account-number header.' },
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

    // Check if accounts exist
    const fromAccount = await db.prepare(
      'SELECT * FROM accounts WHERE account_number = ?'
    ).bind(accountNumber).first();

    const toAccount = await db.prepare(
      'SELECT * FROM accounts WHERE account_number = ?'
    ).bind(to).first();

    if (!fromAccount) {
      return NextResponse.json(
        { error: 'Sender account not found' },
        { status: 404 }
      );
    }

    if (!toAccount) {
      return NextResponse.json(
        { error: 'Recipient account not found' },
        { status: 404 }
      );
    }

    if (accountNumber === to) {
      return NextResponse.json(
        { error: 'Cannot transfer to your own account' },
        { status: 400 }
      );
    }

    // Check sufficient balance
    if (fromAccount.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Perform transfer in a transaction-like manner
    // Deduct from sender
    await db.prepare(
      'UPDATE accounts SET balance = balance - ?, updated_at = datetime("now") WHERE account_number = ?'
    ).bind(amount, accountNumber).run();

    // Add to recipient
    await db.prepare(
      'UPDATE accounts SET balance = balance + ?, updated_at = datetime("now") WHERE account_number = ?'
    ).bind(amount, to).run();

    // Record transaction
    const transactionId = generateId('txn');
    await db.prepare(
      'INSERT INTO transactions (id, from_account, to_account, amount, description) VALUES (?, ?, ?, ?, ?)'
    ).bind(transactionId, accountNumber, to, amount, description || null).run();

    // Get updated balances
    const fromUpdated = await db.prepare(
      'SELECT * FROM accounts WHERE account_number = ?'
    ).bind(accountNumber).first();

    const toUpdated = await db.prepare(
      'SELECT * FROM accounts WHERE account_number = ?'
    ).bind(to).first();

    return NextResponse.json({
      success: true,
      message: 'Transfer completed successfully',
      transaction: {
        id: transactionId,
        from: accountNumber,
        to: to,
        amount: amount,
        description: description || null,
        timestamp: new Date().toISOString(),
      },
      from_balance: fromUpdated?.balance,
      to_balance: toUpdated?.balance,
    });
  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json(
      { error: 'Transfer failed. Please try again.' },
      { status: 500 }
    );
  }
}