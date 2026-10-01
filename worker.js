// Cloudflare Worker for Mini Bank
// This file will be used to serve the Next.js app

export default {
  async fetch(request, env) {
    // Serve static files from R2
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/_next/static/')) {
      // Serve from R2
      try {
        const object = await env.mini_bank_reports.get(url.pathname);
        if (object) {
          return new Response(object.body, {
            headers: {
              'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
              'Cache-Control': 'public, max-age=31536000',
            },
          });
        }
      } catch (e) {
        // Continue to Next.js if file not found
      }
    }
    
    // Serve from Next.js (would need to be built as a Worker)
    return new Response('Mini Bank - Coming soon!', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};