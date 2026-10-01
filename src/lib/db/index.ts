import { D1Database } from '@cloudflare/workers-types';
import { localDb } from './d1-shim';

declare global {
  // eslint-disable-next-line no-var
  var __db: D1Database | undefined;
}

function getDb(): any {
  // For local development (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    return localDb;
  }
  // For Cloudflare runtime
  return (globalThis as any).env?.DB || (globalThis as any).__db || localDb;
}

export { getDb };

// Helper to generate unique IDs
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}${random}`;
}

// Helper to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper to format date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}