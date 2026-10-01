'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Users, RefreshCw, Mail, Settings, Zap } from 'lucide-react';
import { BalanceCard } from '@/components/BalanceCard';
import { TransferForm } from '@/components/TransferForm';
import { TransactionList } from '@/components/TransactionList';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { getAccounts, getTransactions, transfer, getReport } from '@/lib/api';

interface Account {
  account_number: string;
  name: string;
  email: string;
  balance: number;
}

interface Transaction {
  id: string;
  from_account: string;
  to_account: string;
  amount: number;
  description: string | null;
  timestamp: string;
}

export function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccount, setCurrentAccount] = useState<string>('GC001');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transferLoading, setTransferLoading] = useState(false);

  const currentUser = accounts.find(a => a.account_number === currentAccount);

  const loadData = useCallback(async () => {
    try {
      const [accountsData, txnData, reportData] = await Promise.all([
        getAccounts(),
        getTransactions(currentAccount),
        getReport(currentAccount),
      ]);
      
      setAccounts(accountsData.accounts);
      setTransactions(txnData.transactions);
      setReport(reportData.report);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentAccount]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTransfer = async (to: string, amount: number, description?: string) => {
    setTransferLoading(true);
    try {
      await transfer(to, amount, description || '', currentAccount);
      await loadData(); // Refresh data after transfer
    } finally {
      setTransferLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Mini Bank</h1>
              <p className="text-slate-600 mt-1">Push. Deploy. Automate.</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Account Switcher */}
              <select
                value={currentAccount}
                onChange={(e) => setCurrentAccount(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white/80 backdrop-blur focus:ring-2 focus:ring-teal-500 outline-none"
              >
                {accounts.map(account => (
                  <option key={account.account_number} value={account.account_number}>
                    {account.name} ({account.account_number})
                  </option>
                ))}
              </select>
              
              <Button variant="secondary" onClick={loadData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Balance & Transfer */}
          <div className="space-y-6">
            <BalanceCard
              accountNumber={currentAccount}
              name={currentUser?.name || ''}
              balance={currentUser?.balance || 0}
              totalSent={report?.total_sent || 0}
              totalReceived={report?.total_received || 0}
            />
            
            <TransferForm
              currentAccount={currentAccount}
              currentBalance={currentUser?.balance || 0}
              accounts={accounts}
              onTransfer={handleTransfer}
            />
          </div>

          {/* Right Column - Transactions & Info */}
          <div className="md:col-span-2 space-y-6">
            <TransactionList 
              transactions={transactions} 
              currentAccount={currentAccount}
            />

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                      {report?.transaction_count || 0}
                    </p>
                    <p className="text-sm text-slate-500">Transactions</p>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                      {accounts.length}
                    </p>
                    <p className="text-sm text-slate-500">Accounts</p>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-teal-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                      {formatCurrency(accounts.reduce((sum, a) => sum + a.balance, 0))}
                    </p>
                    <p className="text-sm text-slate-500">Total Value</p>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Workshop Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800">CI/CD Workshop</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      This is the Mini Bank demo for the <strong>Push. Deploy. Automate.</strong> workshop. 
                      Try making a transfer, then check your email for automated reports powered by GitHub Actions!
                    </p>
                    <p className="text-xs text-amber-600 mt-2">
                      Accounts: GC001 (Gokul), GC002 (Ram), GC003 (Aayush), GC004 (Sita) — Each starts with NPR 1,000
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}