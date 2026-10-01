-- Mini Bank Database Schema
-- D1 Migration 0000

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  account_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  balance REAL DEFAULT 1000.0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  from_account TEXT NOT NULL,
  to_account TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (from_account) REFERENCES accounts(account_number),
  FOREIGN KEY (to_account) REFERENCES accounts(account_number)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_account);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_account);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(account_number);

-- Seed initial data with 4 participants
INSERT OR IGNORE INTO accounts (id, account_number, name, email, role, balance) VALUES
  ('acc_001', 'GC001', 'Gokul', 'gokul@mini-bank.io', 'user', 1000.0),
  ('acc_002', 'GC002', 'Ram', 'ram@mini-bank.io', 'user', 1000.0),
  ('acc_003', 'GC003', 'Aayush', 'aayush@mini-bank.io', 'user', 1000.0),
  ('acc_004', 'GC004', 'Sita', 'sita@mini-bank.io', 'user', 1000.0);