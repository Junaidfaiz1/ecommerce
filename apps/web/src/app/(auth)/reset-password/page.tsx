'use client';

import { Suspense, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPasswordInputSchema } from '@vorqen/types';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { AuthShell } from '@/components/layout/AuthShell';

const RESET_MUTATION = `
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) { ok }
  }
`;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = useMemo(() => params.get('token') ?? '', [params]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = resetPasswordInputSchema.safeParse({ token, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your details.');
      return;
    }
    setPending(true);
    try {
      await graphqlRequest(RESET_MUTATION, { input: parsed.data });
      router.push('/login');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
      {!token ? (
        <p className="text-sm text-accent">
          Missing reset token. Use the link from your email.
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">New password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="glass-input h-11 rounded-2xl px-4 outline-none focus:border-accent"
          required
        />
      </label>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || !token}
        className="glass-btn h-12 rounded-full px-5 text-sm font-medium disabled:opacity-60"
      >
        {pending ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account"
      title="Choose a new password"
      subtitle="Pick a strong password, then sign in again."
    >
      <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
      <p className="mt-6 text-sm text-muted">
        <Link href="/login" className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
