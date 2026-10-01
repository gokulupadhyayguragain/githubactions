'use client';

import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  from_account: string;
  to_account: string;
  amount: number;
  description: string | null;
  timestamp: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  currentAccount: string;
  limit?: number;
}

export function TransactionList({ 
  transactions, 
  currentAccount,
  limit = 10 
}: TransactionListProps) {
  const displayTransactions = transactions.slice(0, limit);

  if (displayTransactions.length === 0) {
    return (
      <Card delay={2}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-teal-600" />
            Recent Transactions
          </CardTitle>
          <CardDescription>
            Your transaction history
          </CardDescription>
        </CardHeader>
        <div className="text-center py-8 text-slate-500">
          <p>No transactions yet</p>
          <p className="text-sm mt-1">Send money to get started!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card delay={2}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-teal-600" />
          Recent Transactions
        </CardTitle>
        <CardDescription>
          Your transaction history
        </CardDescription>
      </CardHeader>

      <div className="space-y-3">
        {displayTransactions.map((txn, index) => {
          const isSent = txn.from_account === currentAccount;
          const otherAccount = isSent ? txn.to_account : txn.from_account;
          
          return (
            <motion.div
              key={txn.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl',
                'bg-white/60 hover:bg-white/80 transition-colors',
                'border border-slate-100'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  isSent ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                )}>
                  {isSent ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownLeft className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    {isSent ? 'Sent to' : 'Received from'}{' '}
                    <span className="font-semibold">{otherAccount}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    {txn.description || (isSent ? 'Transfer sent' : 'Transfer received')}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={cn(
                  'font-bold',
                  isSent ? 'text-rose-600' : 'text-emerald-600'
                )}>
                  {isSent ? '-' : '+'}{formatCurrency(txn.amount)}
                </p>
                <p className="text-xs text-slate-400">
                  {formatRelativeTime(txn.timestamp)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {transactions.length > limit && (
        <p className="text-center text-sm text-slate-500 mt-4">
          Showing {limit} of {transactions.length} transactions
        </p>
      )}
    </Card>
  );
}