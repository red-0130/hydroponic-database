'use client';

import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, Loader2 } from 'lucide-react';

interface AdminLoginFormProps {
  secretPath?: string;
  onLoginSuccess?: () => void;
}

export default function AdminLoginForm({ onLoginSuccess }: AdminLoginFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      let res: Response | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          res = await fetch('/api/admin/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
          });
          break;
        } catch (fetchErr) {
          if (attempt === 2) throw fetchErr;
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      if (!res || !res.ok) {
        const data = await res?.json().catch(() => ({}));
        setError(data?.error || 'Invalid password. Access denied.');
        setLoading(false);
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch {
      setError('An error occurred during authentication. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-900 text-neutral-100">
      <div className="w-full max-w-md bg-neutral-800 border border-neutral-700 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Secret Admin Portal
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Authentication required to manage hydroponic database
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div
              data-testid="admin-login-error"
              role="alert"
              className="flex items-center gap-3 p-3.5 bg-red-950/50 border border-red-500/40 text-red-200 rounded-xl text-sm"
            >
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2"
            >
              Admin Master Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                data-testid="admin-password-input"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter admin password..."
                required
                autoFocus
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 pl-10 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <KeyRound className="w-5 h-5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            data-testid="admin-login-btn"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Log In</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-700/60 text-center">
          <p className="text-xs text-neutral-500">
            Protected Hydroponic System &bull; Unauthorized access logged
          </p>
        </div>
      </div>
    </div>
  );
}
