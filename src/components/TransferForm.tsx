'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowRightLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

interface TransferFormProps {
  currentAccount: string;
  currentBalance: number;
  accounts: { account_number: string; name: string; balance: number }[];
  onTransfer: (to: string, amount: number, description?: string) => Promise<void>;
}

export function TransferForm({ 
  currentAccount, 
  currentBalance, 
  accounts,
  onTransfer 
}: TransferFormProps) {
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const recipient = accounts.find(a => a.account_number === toAccount);
  const transferAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!toAccount) {
      setError('Please select a recipient');
      return;
    }
    
    if (transferAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (transferAmount > currentBalance) {
      setError('Insufficient balance');
      return;
    }

    if (toAccount === currentAccount) {
      setError('Cannot transfer to your own account');
      return;
    }

    setLoading(true);
    try {
      await onTransfer(toAccount, transferAmount, description);
      setSuccess(`Successfully sent ${formatCurrency(transferAmount)} to ${recipient?.name || toAccount}`);
      setToAccount('');
      setAmount('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card delay={1}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-teal-600" />
          Send Money
        </CardTitle>
        <CardDescription>
          Transfer funds to another account
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Send To
          </label>
          <select
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            className="input-field"
          >
            <option value="">Select recipient...</option>
            {accounts
              .filter(a => a.account_number !== currentAccount)
              .map(account => (
                <option key={account.account_number} value={account.account_number}>
                  {account.name} ({account.account_number})
                </option>
              ))}
          </select>
        </div>

        {/* Amount */}
        <Input
          label="Amount (NPR)"
          type="number"
          min="1"
          max={currentBalance}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          icon={<Send className="w-4 h-4" />}
        />

        {/* Description */}
        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's it for?"
        />

        {/* Preview */}
        {recipient && transferAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-teal-50 rounded-xl border border-teal-200"
          >
            <p className="text-sm text-teal-700">
              You will send{' '}
              <span className="font-bold">{formatCurrency(transferAmount)}</span>
              {' '}to{' '}
              <span className="font-semibold">{recipient.name}</span>
            </p>
            <p className="text-sm text-teal-600 mt-1">
              Your balance will be: {formatCurrency(currentBalance - transferAmount)}
            </p>
          </motion.div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl"
            >
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl"
            >
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <Button 
          type="submit" 
          loading={loading}
          disabled={!toAccount || !amount || transferAmount <= 0}
          className="w-full"
        >
          Send {transferAmount > 0 ? formatCurrency(transferAmount) : ''}
        </Button>
      </form>
    </Card>
  );
}