'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Password page for protected short links
 */
export default function PasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shortCode = searchParams.get('code');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if no short code
  useEffect(() => {
    if (!shortCode) {
      router.push('/');
    }
  }, [shortCode, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/links/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shortCode,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Incorrect password');
        return;
      }

      // Redirect to destination URL
      if (data.destinationUrl) {
        window.location.href = data.destinationUrl;
      }
    } catch (err) {
      console.error('Password verification error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shortCode) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Card */}
        <div className="p-6 rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
              <Lock className="w-8 h-8 text-[var(--fg-tertiary)]" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-display font-bold text-[var(--fg-primary)]">
              Password Required
            </h1>
            <p className="mt-2 text-sm text-[var(--fg-tertiary)]">
              This link is password protected. Please enter the password to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--fg-primary)]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoFocus
                  className={cn(
                    'w-full px-4 py-3 pr-12 text-sm rounded-lg',
                    'bg-[var(--bg-secondary)]/30 border',
                    error
                      ? 'border-red-500'
                      : 'border-[var(--border-primary)]/40',
                    'text-[var(--fg-primary)] placeholder:text-[var(--fg-tertiary)]',
                    'focus:outline-none focus:border-[var(--border-primary)]',
                    'transition-colors'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-red-500"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full py-3 text-sm font-medium rounded-lg',
                'bg-[var(--bg-brand-solid)] text-white',
                'hover:bg-[var(--bg-brand-solid-hover)]',
                'transition-colors disabled:opacity-50',
                'flex items-center justify-center gap-2'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
          >
            <Link2 className="w-4 h-4" />
            opensesh.app
          </a>
        </div>
      </motion.div>
    </div>
  );
}
