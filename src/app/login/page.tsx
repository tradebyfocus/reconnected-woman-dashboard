'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/');
        router.refresh();
        return;
      }
      setError("That password isn't quite right.");
    } catch {
      setError("That password isn't quite right.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        background: 'var(--cream)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--cream-alt)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 40,
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-script)',
            fontSize: 52,
            color: 'var(--burgundy)',
            margin: 0,
            textAlign: 'center',
            lineHeight: 1,
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: 11,
            color: 'var(--ink-muted)',
            textAlign: 'center',
            margin: '12px 0 16px',
          }}
        >
          The Reconnected Woman
        </p>
        <div
          style={{
            height: 1,
            background: 'var(--dusty-rose)',
            opacity: 0.3,
            margin: '0 0 28px',
          }}
        />
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="password"
            style={{
              display: 'block',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              marginBottom: 8,
            }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            required
            style={{
              width: '100%',
              background: 'var(--cream)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: 15,
              color: 'var(--ink)',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--sage)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          />
          {error && (
            <p
              style={{
                color: 'var(--burgundy)',
                fontSize: 14,
                margin: '14px 0 0',
              }}
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || password.length === 0}
            style={{
              width: '100%',
              marginTop: 24,
              background: 'var(--sage)',
              color: 'var(--cream)',
              fontSize: 16,
              fontWeight: 500,
              padding: '12px',
              borderRadius: 8,
              opacity: submitting || password.length === 0 ? 0.6 : 1,
              transition: 'background 160ms ease',
            }}
            onMouseEnter={(e) => {
              if (!submitting && password.length > 0) {
                e.currentTarget.style.background = 'var(--sage-dark)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--sage)';
            }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
