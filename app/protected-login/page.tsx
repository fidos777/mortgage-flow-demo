// app/protected-login/page.tsx
// Basic password wall for strategy concealment
// Clean, professional design with Snang.my identity

'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ProtectedLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from') || '/';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if already authenticated
  useEffect(() => {
    fetch('/api/private-login')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.replace(redirectTo);
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router, redirectTo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Sila masukkan kata laluan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/private-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (data.ok) {
        router.replace(redirectTo);
      } else {
        setError(data.error || 'Kata laluan salah');
        setPassword('');
      }
    } catch {
      setError('Ralat sambungan. Sila cuba semula.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo / Brand */}
        <div style={styles.brand}>
          <div style={styles.logoMark}>S</div>
          <h1 style={styles.title}>snang.my</h1>
        </div>

        <p style={styles.subtitle}>Akses Terhad</p>
        <p style={styles.description}>
          Platform ini dalam fasa pembangunan.
          <br />
          Masukkan kata laluan untuk melihat demo.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputWrapper}>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Kata laluan"
              style={{
                ...styles.input,
                ...(error ? styles.inputError : {}),
              }}
              autoFocus
              disabled={loading}
            />
            {error && <p style={styles.error}>{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            style={{
              ...styles.button,
              ...(loading || !password.trim() ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Mengesahkan...' : 'Masuk'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Hubungi <strong>hello@smecloud.my</strong> untuk akses
          </p>
          <p style={styles.footerMeta}>
            SME Cloud Sdn Bhd &middot; Mortgage Flow Engine
          </p>
        </div>
      </div>

      {/* Subtle background pattern */}
      <div style={styles.bgPattern} aria-hidden="true" />
    </div>
  );
}

// Suspense wrapper required by Next.js 16 for useSearchParams
export default function ProtectedLoginPage() {
  return (
    <Suspense
      fallback={
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.spinner} />
          </div>
        </div>
      }
    >
      <ProtectedLoginInner />
    </Suspense>
  );
}

// ---------- Inline Styles (no external CSS dependency) ----------

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '3rem 2.5rem',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center' as const,
    position: 'relative',
    zIndex: 1,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  logoMark: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: 0,
    letterSpacing: '-0.03em',
  },
  subtitle: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#f59e0b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15em',
    margin: '0 0 0.5rem 0',
  },
  description: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    lineHeight: '1.6',
    margin: '0 0 2rem 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f1f5f9',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
  },
  inputError: {
    borderColor: '#ef4444',
    boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)',
  },
  error: {
    color: '#ef4444',
    fontSize: '0.8rem',
    margin: 0,
    textAlign: 'left' as const,
  },
  button: {
    padding: '0.875rem',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s',
    letterSpacing: '0.02em',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  footerText: {
    fontSize: '0.8rem',
    color: '#64748b',
    margin: '0 0 0.25rem 0',
  },
  footerMeta: {
    fontSize: '0.7rem',
    color: '#475569',
    margin: 0,
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '2px solid rgba(255,255,255,0.1)',
    borderTop: '2px solid #3b82f6',
    borderRadius: '50%',
    margin: '2rem auto',
    animation: 'spin 1s linear infinite',
  },
  bgPattern: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)',
    pointerEvents: 'none' as const,
    zIndex: 0,
  },
};
