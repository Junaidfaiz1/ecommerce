'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { FormSkeleton } from '@/components/shared/Skeleton';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { registerInputSchema } from '@vorqen/types';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { goAfterAuth } from '@/lib/auth-redirect';
import { AuthShell } from '@/components/layout/AuthShell';

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user { id email role }
    }
  }
`;

function RegisterForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = registerInputSchema.safeParse({
      email,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your details.');
      return;
    }

    setPending(true);
    try {
      const data = await graphqlRequest<{
        register: { user: { role: string } };
      }>(REGISTER_MUTATION, { input: parsed.data });
      goAfterAuth(next, data.register.user.role);
    } catch (err) {
      setError(getErrorMessage(err));
      setPending(false);
    }
  }

  const inputClass =
    'glass-input h-11 rounded-2xl px-4 outline-none focus:border-accent';

  return (
    <>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">First name</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Last name</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
          />
          <span className="text-xs text-muted">
            At least 8 characters, with a letter and a number.
          </span>
        </label>

        {error ? <p className="text-sm text-accent">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="glass-btn mt-2 h-12 rounded-full px-5 text-sm font-medium disabled:opacity-60"
        >
          {pending ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Already have an account?{' '}
        <Link
          href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Join VORQEN"
      title="Create account"
      subtitle="Save builds, sync wishlist, and check out with Stripe."
    >
      <Suspense fallback={<FormSkeleton fields={2} label="Loading form" className="mt-8" />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
