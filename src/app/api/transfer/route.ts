import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';
import { generateReceiptPDF } from '@/lib/pdf';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, amount, description } = body;

    // Validate input
    if (!to || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid transfer details. Provide recipient and positive amount.' },
        { status: 400 }
      );
    }

    // Get account from header (authenticated user)
    const accountNumber = request.headers.get('x-account-number');
    const userId = request.headers.get('x-user-id');
    
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

    // Get sender account
    const fromAccount = await db.prepare(
      'SELECT * FROM accounts WHERE account_number = ? AND is_active = 1'
    ).bind(accountNumber).first();

    // Get recipient account
    const toAccount = await db.prepare(
      'SELECT * FROM accounts WHERE account_number = ? AND is_active = 1'
    ).bind(to.toUpperCase()).first();

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

    if (accountNumber === to.toUpperCase()) {
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

    // Get user names
    const fromUser = await db.prepare(
      'SELECT name FROM users WHERE id = ?'
    ).bind(fromAccount.user_id).first();
    
    const toUser = await db.prepare(
      'SELECT name FROM users WHERE id = ?'
    ).bind(toAccount.user_id).first();

    // Perform transfer
    await db.prepare(
      'UPDATE accounts SET balance = balance - ?, updated_at = datetime("now") WHERE account_number = ?'
    ).bind(amount, accountNumber).run();

    await db.prepare(
      'UPDATE accounts SET balance = balance + ?, updated_at = datetime("now") WHERE account_number = ?'
    ).bind(amount, to.toUpperCase()).run();

    // Record transaction
    const transactionId = `TXN${Date.now().toString(36).toUpperCase()}`;
    await db.prepare(
      'INSERT INTO transactions (id, from_account, to_account, amount, description) VALUES (?, ?, ?, ?, ?)'
    ).bind(transactionId, accountNumber, to.toUpperCase(), amount, description || null).run();

    // Get updated balances
    const fromUpdated = await db.prepare(
      'SELECT balance FROM accounts WHERE account_number = ?'
    ).bind(accountNumber).first();

    // Generate PDF receipt
    const receiptData = {
      transaction: {
        id: transactionId,
        from_account: accountNumber,
        to_account: to.toUpperCase(),
        amount,
        description: description || null,
        timestamp: new Date().toISOString(),
      },
      fromName: fromUser?.name || 'Unknown',
      toName: toUser?.name || 'Unknown',
      fromAccount: accountNumber,
      toAccount: to.toUpperCase(),
      balanceAfter: fromUpdated?.balance || 0,
    };

    const receiptPdf = generateReceiptPDF(receiptData);

    // Update transaction with receipt URL
    await db.prepare(
      'UPDATE transactions SET receipt_pdf = ? WHERE id = ?'
    ).bind(receiptPdf, transactionId).run();

    return NextResponse.json({
      success: true,
      message: 'Transfer completed successfully',
      transaction: {
        id: transactionId,
        from: accountNumber,
        to: to.toUpperCase(),
        amount,
        description: description || null,
        timestamp: new Date().toISOString(),
      },
      receipt: receiptPdf,
      from_balance: fromUpdated?.balance,
      to_balance: toAccount.balance + amount,
    });
  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json(
      { error: 'Transfer failed. Please try again.' },
      { status: 500 }
    );
  }
}