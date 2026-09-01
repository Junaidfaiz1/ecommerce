'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { requestPasswordResetInputSchema } from '@vorqen/types';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { AuthShell } from '@/components/layout/AuthShell';

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
    <AuthShell
      eyebrow="Account"
      title="Reset password"
      subtitle="We will email a reset link if an account exists for that address."
    >
      {done ? (
        <p className="mt-8 text-sm text-foreground">
          If an account exists, a reset link was sent. Check your inbox (or
          server logs in development).
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input h-11 rounded-2xl px-4 outline-none focus:border-accent"
              required
            />
          </label>
          {error ? <p className="text-sm text-accent">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="glass-btn h-12 rounded-full px-5 text-sm font-medium disabled:opacity-60"
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
    </AuthShell>
  );
}
