'use client';

import { useState, useEffect } from 'react';
import { GoogleLogin } from '@/components/GoogleLogin';
import { motion } from 'framer-motion';
import { Shield, UserPlus, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function SigninPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async (googleUser: any) => {
    setLoading(true);
    setError('');

    try {
      // Check if user exists in database
      const response = await fetch(`/api/accounts?email=${googleUser.email}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      // If user doesn't have an account, create one
      if (!data.accounts?.[0]) {
        const createResponse = await fetch('/api/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': googleUser.sub,
            'x-user-email': googleUser.email,
            'x-user-name': googleUser.name,
          },
        });

        if (createResponse.ok) {
          const accountData = await createResponse.json();
          setUser({ ...googleUser, account: accountData.account });
        } else {
          throw new Error('Failed to create account');
        }
      } else {
        setUser({ ...googleUser, account: data.accounts[0] });
      }

      // Store in localStorage
      localStorage.setItem('mini-bank-user', JSON.stringify({ ...googleUser, account: data.accounts?.[0] || data.account }));
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if already logged in
    const storedUser = localStorage.getItem('mini-bank-user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    }
  }, []);

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
              Secure, instant banking with Google SSO
            </p>
          </div>

          {user ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 text-center"
            >
              <div className="flex items-center justify-center mb-4">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-4 border-emerald-200"
                />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">{user.name}</h2>
              <p className="text-slate-600 mb-4">{user.email}</p>
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-500 mb-1">Your Account Number</p>
                <p className="text-3xl font-bold text-teal-600">{user.account?.account_number}</p>
              </div>
              <div className="text-center">
                <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  Account created with ₹1,000 initial balance
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-rose-50 text-rose-700 p-4 rounded-lg text-center text-sm">
                  {error}
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or continue with</span>
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
          )}
        </div>
      </motion.div>
    </div>
  );
}