'use client';

/**
 * Global Error Boundary
 *
 * This error boundary catches errors in the root layout.
 * It must define its own <html> and <body> tags since the root layout
 * has already failed.
 *
 * This is the last line of defense for catching errors.
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log critical error
    console.error('CRITICAL: Root layout error:', error);

    // In production, this should definitely be reported
    // reportCriticalError(error);
  }, [error]);

  return (
    <html lang="ms">
      <body className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          {/* Critical Error Icon */}
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">
            Ralat Kritikal
          </h1>
          <h2 className="text-lg text-neutral-600 mb-4">
            Critical Error
          </h2>

          <p className="text-neutral-600 mb-6">
            Aplikasi mengalami ralat yang tidak dijangka. Sila muat semula halaman.
          </p>
          <p className="text-neutral-500 text-sm mb-6">
            The application encountered an unexpected error. Please reload the page.
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <p className="text-xs text-red-500 mb-1 font-semibold">
                DEVELOPMENT ERROR DETAILS:
              </p>
              <p className="text-sm text-red-700 font-mono break-all">
                {error.message}
              </p>
              {error.stack && (
                <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-32">
                  {error.stack}
                </pre>
              )}
              {error.digest && (
                <p className="text-xs text-red-400 mt-2">
                  Error Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Retry Button */}
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Muat Semula / Reload
          </button>

          {/* Technical Info */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <p className="text-xs text-neutral-400">
              Jika masalah berterusan, sila hubungi sokongan teknikal.
              <br />
              If the problem persists, please contact technical support.
            </p>
            {error.digest && (
              <p className="text-xs text-neutral-400 mt-2">
                Reference: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
