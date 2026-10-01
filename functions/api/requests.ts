export async function POST(request: Request, env: any) {
  try {
    const { fromEmail, toEmail, amount, message } = await request.json();

    if (!fromEmail || !toEmail || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.DB.prepare(`
      INSERT INTO transaction_requests (from_email, to_email, amount, message, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(fromEmail, toEmail, amount, message || '');

    return new Response(JSON.stringify({ success: true }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('POST requests error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create request' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}