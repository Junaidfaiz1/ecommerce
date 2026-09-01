'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BrandMark } from '@vorqen/ui';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';

const VERIFY_MUTATION = `
  mutation VerifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input) { id email emailVerifiedAt }
  }
`;

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = useMemo(() => params.get('token') ?? '', [params]);

  if (!token) {
    return <p className="mt-8 text-sm text-red-400">Missing verification token.</p>;
  }

  return <VerifyEmailRequest token={token} />;
}

function VerifyEmailRequest({ token }: { token: string }) {
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending');
  const [message, setMessage] = useState('Verifying…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await graphqlRequest(VERIFY_MUTATION, { input: { token } });
        if (!cancelled) {
          setStatus('ok');
          setMessage('Email verified. You can continue shopping.');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage(getErrorMessage(err));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <p className={`mt-8 text-sm ${status === 'error' ? 'text-red-400' : 'text-foreground'}`}>
      {message}
    </p>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="relative flex min-h-screen flex-col">
      <header className="relative z-10 border-b border-border px-6 py-4 md:px-10">
        <BrandMark />
      </header>
      <section className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-display text-3xl tracking-tight">Verify email</h1>
        <Suspense fallback={<p className="mt-8 text-sm text-muted">Verifying…</p>}>
          <VerifyEmailInner />
        </Suspense>
        <p className="mt-6 text-sm text-muted">
          <Link href="/login" className="underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
