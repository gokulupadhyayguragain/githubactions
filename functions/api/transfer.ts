export async function POST(request: Request, env: any) {
  try {
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
  } catch (error) {
    console.error('POST transfer error:', error);
    return new Response(JSON.stringify({ error: 'Transfer failed' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}