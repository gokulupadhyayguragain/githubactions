// D1 shim for local development
// In production (Cloudflare), this uses the real D1 binding

type D1Result = {
  results?: any[];
  success?: boolean;
  error?: string;
};

// Simple in-memory database for local development
class LocalDB {
  private accounts: Map<string, any> = new Map();
  private transactions: Map<string, any> = new Map();
  private accountCounter = 4;

  constructor() {
    // Seed initial data
    this.accounts.set('GC001', {
      id: 'acc_001',
      account_number: 'GC001',
      name: 'Gokul',
      email: 'gokul@mini-bank.io',
      role: 'user',
      balance: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    this.accounts.set('GC002', {
      id: 'acc_002',
      account_number: 'GC002',
      name: 'Ram',
      email: 'ram@mini-bank.io',
      role: 'user',
      balance: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    this.accounts.set('GC003', {
      id: 'acc_003',
      account_number: 'GC003',
      name: 'Aayush',
      email: 'aayush@mini-bank.io',
      role: 'user',
      balance: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    this.accounts.set('GC004', {
      id: 'acc_004',
      account_number: 'GC004',
      name: 'Sita',
      email: 'sita@mini-bank.io',
      role: 'user',
      balance: 1000,
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
      if (sqlLower.includes('from accounts')) {
        if (sqlLower.includes('where account_number')) {
          // Get single account
          const accountNum = params[0];
          const account = this.accounts.get(accountNum);
          if (mode === 'first') return account || null;
          return { results: account ? [account] : [] };
        }
        if (sqlLower.includes('count(*)')) {
          return { count: this.accounts.size };
        }
        // Get all accounts
        if (mode === 'first') return null;
        return { results: Array.from(this.accounts.values()) };
      }

      if (sqlLower.includes('from transactions')) {
        if (sqlLower.includes('where from_account = ? or to_account = ?')) {
          // Get account transactions
          const acc1 = params[0];
          const acc2 = params[1];
          const txs = Array.from(this.transactions.values()).filter(
            (t) => t.from_account === acc1 || t.to_account === acc2
          );
          txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          if (mode === 'first') {
            return { count: txs.length };
          }
          return { results: txs };
        }
        if (sqlLower.includes('sum(amount)')) {
          if (sqlLower.includes('from_account = ?')) {
            const acc = params[0];
            const sum = Array.from(this.transactions.values())
              .filter((t) => t.from_account === acc)
              .reduce((acc, t) => acc + t.amount, 0);
            return { total: sum };
          }
          if (sqlLower.includes('to_account = ?')) {
            const acc = params[0];
            const sum = Array.from(this.transactions.values())
              .filter((t) => t.to_account === acc)
              .reduce((acc, t) => acc + t.amount, 0);
            return { total: sum };
          }
          // Total
          const sum = Array.from(this.transactions.values())
            .reduce((acc, t) => acc + t.amount, 0);
          return { total: sum };
        }
        if (sqlLower.includes('count(*)')) {
          return { count: this.transactions.size };
        }
      }
    }

    // INSERT operations
    if (sqlLower.startsWith('insert')) {
      if (sqlLower.includes('into accounts')) {
        const id = params[0];
        const account_number = params[1];
        const name = params[2];
        const email = params[3];
        const role = params[4];
        const balance = params[5];
        
        this.accounts.set(account_number, {
          id,
          account_number,
          name,
          email,
          role,
          balance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        this.accountCounter++;
        return { success: true };
      }

      if (sqlLower.includes('into transactions')) {
        const id = params[0];
        const from_account = params[1];
        const to_account = params[2];
        const amount = params[3];
        const description = params[4];
        
        this.transactions.set(id, {
          id,
          from_account,
          to_account,
          amount,
          description,
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
    }

    return { success: true };
  }
}

// Export a singleton instance
export const localDb = new LocalDB();