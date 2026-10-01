// D1 shim for local development
// In production (Cloudflare), this uses the real D1 binding

type D1Result = {
  results?: any[];
  success?: boolean;
  error?: string;
};

// Simple in-memory database for local development
class LocalDB {
  private users: Map<string, any> = new Map();
  private accounts: Map<string, any> = new Map();
  private transactions: Map<string, any> = new Map();

  constructor() {
    // Seed a demo user and account
    const userId = 'user_demo';
    this.users.set(userId, {
      id: userId,
      google_id: 'demo-google-id',
      email: 'demo@mini-bank.io',
      name: 'Demo User',
      image: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const accountId = 'acc_001';
    this.accounts.set('A1B2C', {
      id: accountId,
      user_id: userId,
      account_number: 'A1B2C',
      balance: 1000,
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  prepare(sql: string) {
    const self = this;
    return {
      bind(...params: any[]) {
        return {
          first(): Promise<any> {
            return self.execute(sql, params, 'first');
          },
          all(): Promise<D1Result> {
            return self.execute(sql, params, 'all');
          },
          run(): Promise<D1Result> {
            return self.execute(sql, params, 'run');
          },
        };
      },
    };
  }

  private async execute(sql: string, params: any[], mode: string): Promise<any> {
    const sqlLower = sql.toLowerCase().trim();

    // SELECT operations
    if (sqlLower.startsWith('select')) {
      // Users table
      if (sqlLower.includes('from users')) {
        if (sqlLower.includes('where google_id') || sqlLower.includes('where email')) {
          const user = Array.from(this.users.values()).find(
            u => u.google_id === params[0] || u.email === params[0]
          );
          if (mode === 'first') return user || null;
          return { results: user ? [user] : [] };
        }
        if (sqlLower.includes('where id')) {
          const user = this.users.get(params[0]);
          if (mode === 'first') return user || null;
          return { results: user ? [user] : [] };
        }
      }

      // Accounts table
      if (sqlLower.includes('from accounts')) {
        if (sqlLower.includes('where account_number')) {
          const account = this.accounts.get(params[0]);
          if (mode === 'first') return account || null;
          return { results: account ? [account] : [] };
        }
        if (sqlLower.includes('where user_id')) {
          const account = Array.from(this.accounts.values()).find(
            a => a.user_id === params[0] && a.is_active === 1
          );
          if (mode === 'first') return account || null;
          return { results: account ? [account] : [] };
        }
        // Join query
        if (sqlLower.includes('join users')) {
          const accounts = Array.from(this.accounts.values())
            .filter(a => a.is_active === 1)
            .map(account => {
              const user = this.users.get(account.user_id);
              return { ...account, name: user?.name, email: user?.email, image: user?.image };
            });
          if (mode === 'first') return accounts[0] || null;
          return { results: accounts };
        }
      }

      // Transactions table
      if (sqlLower.includes('from transactions')) {
        if (sqlLower.includes('where from_account = ? or to_account = ?')) {
          const acc1 = params[0];
          const acc2 = params[1];
          const txns = Array.from(this.transactions.values()).filter(
            t => t.from_account === acc1 || t.to_account === acc2
          );
          txns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          if (mode === 'first') return { count: txns.length };
          return { results: txns };
        }
        if (sqlLower.includes('sum(amount)')) {
          if (sqlLower.includes('from_account = ?')) {
            const acc = params[0];
            const sum = Array.from(this.transactions.values())
              .filter(t => t.from_account === acc)
              .reduce((acc, t) => acc + t.amount, 0);
            return { total: sum };
          }
          if (sqlLower.includes('to_account = ?')) {
            const acc = params[0];
            const sum = Array.from(this.transactions.values())
              .filter(t => t.to_account === acc)
              .reduce((acc, t) => acc + t.amount, 0);
            return { total: sum };
          }
          const sum = Array.from(this.transactions.values())
            .reduce((acc, t) => acc + t.amount, 0);
          return { total: sum };
        }
        if (sqlLower.includes('count(*)')) {
          return { count: this.transactions.size };
        }
        // All transactions
        const txns = Array.from(this.transactions.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (mode === 'first') return null;
        return { results: txns };
      }
    }

    // INSERT operations
    if (sqlLower.startsWith('insert')) {
      if (sqlLower.includes('into users')) {
        const id = params[0];
        const google_id = params[1];
        const email = params[2];
        const name = params[3];
        const image = params[4];
        
        this.users.set(id, {
          id, google_id, email, name, image,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return { success: true };
      }

      if (sqlLower.includes('into accounts')) {
        const id = params[0];
        const user_id = params[1];
        const account_number = params[2];
        const balance = params[3];
        
        this.accounts.set(account_number, {
          id, user_id, account_number, balance, is_active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return { success: true };
      }

      if (sqlLower.includes('into transactions')) {
        const id = params[0];
        const from_account = params[1];
        const to_account = params[2];
        const amount = params[3];
        const description = params[4];
        
        this.transactions.set(id, {
          id, from_account, to_account, amount, description,
          timestamp: new Date().toISOString(),
        });
        return { success: true };
      }
    }

    // UPDATE operations
    if (sqlLower.startsWith('update')) {
      if (sqlLower.includes('accounts')) {
        const balance = params[0];
        const account_number = params[1];
        const account = this.accounts.get(account_number);
        if (account) {
          account.balance = balance;
          account.updated_at = new Date().toISOString();
          this.accounts.set(account_number, account);
        }
        return { success: true };
      }
      
      if (sqlLower.includes('users')) {
        const name = params[0];
        const image = params[1];
        const id = params[2];
        const user = this.users.get(id);
        if (user) {
          user.name = name;
          user.image = image;
          user.updated_at = new Date().toISOString();
          this.users.set(id, user);
        }
        return { success: true };
      }

      if (sqlLower.includes('transactions')) {
        const receipt_pdf = params[0];
        const id = params[1];
        const txn = this.transactions.get(id);
        if (txn) {
          txn.receipt_pdf = receipt_pdf;
          this.transactions.set(id, txn);
        }
        return { success: true };
      }
    }

    return { success: true };
  }
}

// Export a singleton instance
export const localDb = new LocalDB();