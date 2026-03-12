'use client';

import { motion } from 'framer-motion';
import { Brain, ShieldCheck, AlertCircle } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  denied: 'You cancelled the sign-in. Please try again.',
  unauthorized: 'Your account is not authorized to access the admin panel. Contact your administrator.',
  account_disabled: 'Your account has been disabled. Contact your administrator.',
  google_failed: 'Google authentication failed. Please try again.',
  config: 'Server configuration error. Contact your administrator.',
  invalid_state: 'Security validation failed. Please try again.',
  unverified_email: 'Your Google account email is not verified.',
  server_error: 'An unexpected error occurred. Please try again.',
  no_code: 'Authentication failed. Please try again.',
};

interface AdminLoginPageProps {
  error?: string;
}

export function AdminLoginPage({ error }: AdminLoginPageProps) {
  const errorMessage = error ? (ERROR_MESSAGES[error] || 'Authentication failed. Please try again.') : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 space-y-8">
          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 mx-auto">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Akaal <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Admin</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to access the portal
              </p>
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
            </motion.div>
          )}

          {/* Sign-in button */}
          <div className="space-y-4">
            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-3 w-full px-6 py-3.5 bg-white dark:bg-zinc-800 border border-border text-foreground rounded-xl font-medium hover:bg-muted transition-all duration-200 shadow-sm hover:shadow group"
            >
              {/* Google icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </a>

            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Access restricted to authorized staff only</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Akaal Psychiatry, PLLC · Secure Admin Portal
        </p>
      </motion.div>
    </div>
  );
}
