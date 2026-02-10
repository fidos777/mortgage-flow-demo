'use client';

/**
 * Error Boundary Component
 *
 * Catches React errors in child components and displays a fallback UI.
 * Provides error recovery via retry mechanism.
 *
 * Note: This catches errors during rendering, not errors in:
 * - Event handlers
 * - Asynchronous code (e.g. setTimeout)
 * - Server-side rendering
 * - Errors thrown in the error boundary itself
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Application error:', error);

    // TODO: Send to error reporting service (e.g., Sentry)
    // In production, uncomment and configure:
    // if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    //   reportError(error);
    // }
  }, [error]);

  // Determine if this is a known error type
  const isNetworkError = error.message?.includes('fetch') ||
                         error.message?.includes('network') ||
                         error.message?.includes('Failed to load');

  const isAuthError = error.message?.includes('unauthorized') ||
                      error.message?.includes('session') ||
                      error.message?.includes('token');

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        {/* Error Message */}
        <h1 className="text-xl font-semibold text-neutral-800 mb-2">
          {isNetworkError
            ? 'Masalah Sambungan'
            : isAuthError
            ? 'Sesi Tamat Tempoh'
            : 'Ralat Berlaku'}
        </h1>

        <p className="text-neutral-600 mb-6">
          {isNetworkError
            ? 'Tidak dapat menghubungi pelayan. Sila semak sambungan internet anda.'
            : isAuthError
            ? 'Sesi anda telah tamat tempoh. Sila muat semula halaman.'
            : 'Maaf, sesuatu tidak kena. Pasukan kami telah dimaklumkan.'}
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-neutral-100 rounded-lg text-left">
            <p className="text-xs text-neutral-500 mb-1">Error Details:</p>
            <p className="text-sm text-red-600 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-neutral-400 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Cuba Lagi
          </button>

          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            Halaman Utama
          </a>
        </div>

        {/* Support Link */}
        <div className="mt-8 pt-6 border-t border-neutral-100">
          <p className="text-sm text-neutral-500">
            Masih menghadapi masalah?{' '}
            <a
              href="https://wa.me/60123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <MessageCircle className="w-3 h-3" />
              Hubungi Sokongan
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
