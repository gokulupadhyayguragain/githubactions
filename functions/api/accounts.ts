export async function GET(request: Request, env: any) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const accounts = await env.DB.prepare('SELECT * FROM accounts WHERE email = ? LIMIT 1')
      .bind(email)
      .all();

    return new Response(JSON.stringify({ accounts: accounts.results }), { 
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('GET accounts error:', error);
    return new Response(JSON.stringify({ error: 'Database error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request: Request, env: any) {
  try {
    const userId = request.headers.get('x-user-id');
    const email = request.headers.get('x-user-email');
    const name = request.headers.get('x-user-name');

    if (!userId || !email || !name) {
      return new Response(JSON.stringify({ error: 'Missing user data' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate 5-digit hex account number
    const accountNumber = Math.floor(0x10000 + Math.random() * 0x90000).toString(16);

    // Check if account already exists
    const existing = await env.DB.prepare('SELECT * FROM accounts WHERE email = ?')
      .bind(email)
      .first();

    if (existing) {
      return new Response(JSON.stringify({ account: existing }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert new account with ₹1000 initial balance
    await env.DB.prepare(`
      INSERT INTO accounts (user_id, email, name, account_number, balance)
      VALUES (?, ?, ?, ?, 1000)
    `).bind(userId, email, name, accountNumber);

    const newAccount = await env.DB.prepare('SELECT * FROM accounts WHERE email = ?')
      .bind(email)
      .first();

    return new Response(JSON.stringify({ account: newAccount }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('POST accounts error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create account' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}