'use client';

import { motion } from 'framer-motion';
import { Building2, User, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Account {
  account_number: string;
  name: string;
  email: string;
  balance: number;
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccount: string;
  onSelect: (accountNumber: string) => void;
  showBalance?: boolean;
}

export function AccountSelector({ 
  accounts, 
  selectedAccount, 
  onSelect,
  showBalance = false 
}: AccountSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 mb-3">
        Select Account
      </label>
      <div className="grid grid-cols-2 gap-3">
        {accounts.map((account, index) => (
          <motion.button
            key={account.account_number}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(account.account_number)}
            className={cn(
              'relative p-4 rounded-xl border-2 text-left transition-all duration-200',
              'hover:border-teal-300 hover:shadow-md',
              selectedAccount === account.account_number
                ? 'border-teal-500 bg-teal-50 shadow-md'
                : 'border-slate-200 bg-white/60'
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" />
                  {account.name}
                </p>
                <p className="text-sm text-slate-500">{account.account_number}</p>
                {showBalance && (
                  <p className="text-lg font-bold text-teal-600 mt-1">
                    NPR {account.balance.toLocaleString()}
                  </p>
                )}
              </div>
              {selectedAccount === account.account_number && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}