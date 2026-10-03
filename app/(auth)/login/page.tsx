export const dynamic = 'force-dynamic';
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('dean@agnicollege.edu');
  const [password, setPassword] = useState('Dean@2026');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn('credentials', { email, password, callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-smoke-white dark:bg-[#0a0a0a] bg-[url('/noise.png')] relative">
      
      {/* Floating Theme Toggle */}
      <div className="absolute top-8 right-8">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-white/60 dark:bg-black/60 backdrop-blur-xl border border-border-light dark:border-border-dark shadow-2xl">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-light tracking-widest text-black dark:text-white uppercase">Dean Portal</h1>
          <p className="text-xs text-gray-500 mt-2 tracking-widest uppercase">Secure Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Email Access</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-sm text-black dark:text-white"
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Security Key</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-sm text-black dark:text-white"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-4 bg-black text-white dark:bg-white dark:text-black rounded-lg font-medium tracking-widest uppercase text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Establish Connection'}
          </button>
        </form>
      </div>
    </div>
  );
}
