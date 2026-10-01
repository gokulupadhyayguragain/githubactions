'use client';

import { useEffect, useState } from 'react';
import { GoogleLogin } from '@/components/GoogleLogin';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already logged in
    const storedUser = localStorage.getItem('mini-bank-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleGoogleLogin = async (googleUser: any) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/accounts?email=${googleUser.email}`);

      if (!response.ok) {
        throw new Error('Failed to authenticate');
      }

      const data = await response.json();
      const existingAccount = data.accounts?.[0];

      let account;

      // If user doesn't have an account, create one
      if (!existingAccount) {
        const createResponse = await fetch('/api/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': googleUser.sub,
            'x-user-email': googleUser.email,
            'x-user-name': googleUser.name,
          },
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create account');
        }

        const accountData = await createResponse.json();
        account = accountData.account;
      } else {
        account = existingAccount;
      }

      const userData = { ...googleUser, account };
      setUser(userData);
      localStorage.setItem('mini-bank-user', JSON.stringify(userData));
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  if (user) {
    return (
      <Dashboard user={user} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-amber-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Welcome to Mini Bank
            </h1>
            <p className="text-slate-600">
              Secure banking with Google SSO. Get ₹1,000 bonus on signup!
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-lg text-center text-sm mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Secure Sign In</span>
              </div>
            </div>

            <GoogleLogin onLogin={handleGoogleLogin} />

            <p className="text-center text-sm text-slate-500 mt-6">
              By signing in, you agree to our{' '}
              <Link href="#" className="text-teal-600 hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="#" className="text-teal-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Dashboard({ user }: { user: any }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50"
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-teal-600" />
            <span className="text-xl font-bold text-slate-800">Mini Bank</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">{user.account?.account_number}</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('mini-bank-user');
                window.location.reload();
              }}
              className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl shadow-lg p-8 text-white mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 mb-1">Total Balance</p>
              <p className="text-4xl font-bold">
                ₹{user.account?.balance.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-teal-100 mb-1">Account Number</p>
              <p className="text-2xl font-mono">{user.account?.account_number}</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Link href="/transfer" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Transfer Money</h3>
            <p className="text-sm text-slate-500">Send to any account</p>
          </Link>

          <Link href="/requests" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-slate-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Requests</h3>
            <p className="text-sm text-slate-500">Send/receive requests</p>
          </Link>

          <Link href="/receipts" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-slate-200">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Receipts</h3>
            <p className="text-sm text-slate-500">Download PDF receipts</p>
          </Link>

          <Link href="/profile" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-slate-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Profile</h3>
            <p className="text-sm text-slate-500">Manage your profile</p>
          </Link>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200"
        >
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">Recent Transactions</h3>
          </div>
          <div className="p-6">
            <p className="text-slate-500 text-center py-8">
              No transactions yet. Start by sending money!
            </p>
          </div>
        </motion.div>
      </main>
    </motion.div>
  );
}