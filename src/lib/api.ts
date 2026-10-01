const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiOptions {
  accountNumber?: string;
}

async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {},
  apiOptions: ApiOptions = {}
): Promise<T> {
  const { accountNumber } = apiOptions;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accountNumber) {
    headers['x-account-number'] = accountNumber;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Account API
export async function getAccounts(): Promise<{ accounts: any[] }> {
  return fetchApi<{ accounts: any[] }>('/api/accounts');
}

export async function getAccount(accountNumber: string): Promise<{ account: any }> {
  return fetchApi<{ account: any }>('/api/accounts', {}, { accountNumber });
}

export async function createAccount(name: string, email: string): Promise<{ account: any }> {
  return fetchApi<{ account: any }>('/api/accounts', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
}

// Transaction API
export async function getTransactions(accountNumber: string, limit = 50): Promise<{ transactions: any[]; total: number }> {
  return fetchApi<{ transactions: any[]; total: number }>(
    `/api/transactions?limit=${limit}`,
    {},
    { accountNumber }
  );
}

// Transfer API
export async function transfer(
  to: string,
  amount: number,
  description: string,
  fromAccount: string
): Promise<any> {
  return fetchApi<any>(
    '/api/transfer',
    {
      method: 'POST',
      body: JSON.stringify({ to, amount, description }),
    },
    { accountNumber: fromAccount }
  );
}

// Report API
export async function getReport(accountNumber: string): Promise<{ report: any }> {
  return fetchApi<{ report: any }>('/api/report', {}, { accountNumber });
}

// Admin Report API
export async function getAdminReport(): Promise<{ report: any }> {
  return fetchApi<{ report: any }>('/api/admin/report', {}, { accountNumber: 'GC001' });
}