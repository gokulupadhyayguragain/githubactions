export async function GET(request: Request, env: any) {
  try {
    const reports = await env.DB.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT 100').all();

    return new Response(JSON.stringify({ reports: reports.results }), { 
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('GET report error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch reports' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}