export interface Account {
  id: string;
  account_number: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  from_account: string;
  to_account: string;
  amount: number;
  description: string | null;
  timestamp: string;
}

export interface TransferRequest {
  to: string;
  amount: number;
  description?: string;
}

export interface CreateAccountRequest {
  name: string;
  email: string;
}

export interface AccountResponse {
  account: Account;
}

export interface TransactionResponse {
  transaction: Transaction;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
}

export interface AccountReportResponse {
  account_number: string;
  name: string;
  balance: number;
  transactions: Transaction[];
  total_sent: number;
  total_received: number;
  transaction_count: number;
}

export interface AdminReportResponse {
  total_accounts: number;
  total_transactions: number;
  total_transferred: number;
  active_accounts: number;
  recent_transactions: Transaction[];
}