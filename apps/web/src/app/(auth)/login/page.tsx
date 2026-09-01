'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginInputSchema } from '@vorqen/types';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { goAfterAuth } from '@/lib/auth-redirect';
import { AuthShell } from '@/components/layout/AuthShell';

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user { id email role }
    }
  }
`;

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginInputSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your details.');
      return;
    }

    setPending(true);
    try {
      await graphqlRequest(LOGIN_MUTATION, { input: parsed.data });
      goAfterAuth(searchParams.get('next'));
    } catch (err) {
      setError(getErrorMessage(err));
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="glass-input h-11 rounded-2xl px-4 text-foreground outline-none focus:border-accent"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="glass-input h-11 rounded-2xl px-4 text-foreground outline-none focus:border-accent"
            required
          />
        </label>

        {error ? <p className="text-sm text-accent">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="glass-btn mt-2 h-12 rounded-full px-5 text-sm font-medium disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        No account?{' '}
        <Link
          href={`/register${searchParams.get('next') ? `?next=${encodeURIComponent(searchParams.get('next')!)}` : ''}`}
          className="text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
        {' · '}
        <Link
          href="/forgot-password"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Forgot password
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Account"
      title="Sign in"
      subtitle="Access your VORQEN account and continue where you left off."
    >
      <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
