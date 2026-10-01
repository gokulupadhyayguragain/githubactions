'use client';

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, ArrowDownUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  accountNumber: string;
  name: string;
  balance: number;
  totalSent: number;
  totalReceived: number;
}

export function BalanceCard({ 
  accountNumber, 
  name, 
  balance,
  totalSent,
  totalReceived 
}: BalanceCardProps) {
  return (
    <Card className="col-span-full" delay={0}>
      {/* Header gradient */}
      <div className="relative -mx-6 -top-6 mb-4 px-6 py-8 rounded-t-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+')] opacity-30" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Account</p>
                <p className="text-white font-semibold text-lg">{name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-xs uppercase tracking-wider">Balance</p>
              <p className="text-white font-bold text-3xl">
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-white/70 text-sm">{accountNumber}</p>
            <p className="text-white/70 text-sm">
              Mini Bank
            </p>
          </div>
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl"
        >
          <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-xs text-rose-600">Total Sent</p>
            <p className="font-bold text-rose-700">{formatCurrency(totalSent)}</p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl"
        >
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-emerald-600">Total Received</p>
            <p className="font-bold text-emerald-700">{formatCurrency(totalReceived)}</p>
          </div>
        </motion.div>
      </div>
    </Card>
  );
}