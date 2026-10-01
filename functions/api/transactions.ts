export async function GET(request: Request, env: any) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const transactions = await env.DB.prepare(`
      SELECT * FROM transactions 
      WHERE from_email = ? OR to_email = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(email, email, limit).all();

    return new Response(JSON.stringify({ transactions: transactions.results }), { 
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('GET transactions error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch transactions' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request: Request, env: any) {
  try {
    const { fromEmail, toEmail, amount, type = 'transfer' } = await request.json();

    if (!fromEmail || !toEmail || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.DB.prepare(`
      INSERT INTO transactions (from_email, to_email, amount, type)
      VALUES (?, ?, ?, ?)
    `).bind(fromEmail, toEmail, amount, type);

    return new Response(JSON.stringify({ success: true }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('POST transactions error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create transaction' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}