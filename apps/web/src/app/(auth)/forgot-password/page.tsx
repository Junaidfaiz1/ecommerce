'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { BrandMark } from '@vorqen/ui';
import { requestPasswordResetInputSchema } from '@vorqen/types';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';

const REQUEST_RESET = `
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input) { ok }
  }
`;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = requestPasswordResetInputSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your email.');
      return;
    }
    setPending(true);
    try {
      await graphqlRequest(REQUEST_RESET, { input: parsed.data });
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col">
      <header className="relative z-10 border-b border-border px-6 py-4 md:px-10">
        <BrandMark />
      </header>
      <section className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-display text-3xl tracking-tight">Reset password</h1>
        <p className="mt-2 text-sm text-muted">
          We will email a reset link if an account exists for that address.
        </p>

        {done ? (
          <p className="mt-8 text-sm text-foreground">
            If an account exists, a reset link was sent. Check your inbox (or server logs in
            development).
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
                required
              />
            </label>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-background disabled:opacity-60"
            >
              {pending ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-muted">
          <Link href="/login" className="underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
