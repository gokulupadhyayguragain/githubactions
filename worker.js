import { handleRequest } from '@cloudflare/next-on-pages';

export default {
  async fetch(request, env, context) {
    return handleRequest(request, env, context);
  },
};