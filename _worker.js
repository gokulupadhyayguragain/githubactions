import { handleRequest } from '@cloudflare/next-on-pages';

// Custom worker to handle both static assets and API routes
export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    
    // Handle API routes - check if there's a function for this path
    if (url.pathname.startsWith('/api/')) {
      try {
        const response = await handleRequest(request, env, context);
        return response;
      } catch (e) {
        console.error('API error:', e);
        return new Response(JSON.stringify({ error: 'API error' }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // For non-API routes, serve static assets
    return handleRequest(request, env, context);
  },
};