'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateProfileInputSchema } from '@vorqen/types';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/shared/SectionStates';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';

const ME_QUERY = `
  query AccountMe {
    me {
      id
      email
      firstName
      lastName
      role
      emailVerifiedAt
    }
  }
`;

const UPDATE_PROFILE = `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      firstName
      lastName
    }
  }
`;

type Me = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  emailVerifiedAt: string | null;
};

export default function AccountProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{ me: Me | null }>(ME_QUERY);
        if (cancelled) return;
        if (!data.me) {
          router.replace('/login?next=/account');
          return;
        }
        setMe(data.me);
        setFirstName(data.me.firstName ?? '');
        setLastName(data.me.lastName ?? '');
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const parsed = updateProfileInputSchema.safeParse({
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your details.');
      return;
    }
    setPending(true);
    try {
      const data = await graphqlRequest<{
        updateProfile: { firstName: string | null; lastName: string | null };
      }>(UPDATE_PROFILE, { input: parsed.data });
      setMe((prev) =>
        prev
          ? {
              ...prev,
              firstName: data.updateProfile.firstName,
              lastName: data.updateProfile.lastName,
            }
          : prev,
      );
      setNotice('Profile updated.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading account…</p>;
  }

  if (error && !me) {
    return (
      <ErrorState
        message={error}
        action={
          <Link href="/login?next=/account" className="text-sm text-accent">
            Sign in
          </Link>
        }
      />
    );
  }

  if (!me) return null;

  return (
    <div>
      <h1 className="font-display text-3xl tracking-tight">Profile</h1>
      <p className="mt-2 text-sm text-muted">{me.email}</p>
      <p className="mt-1 font-mono text-[11px] text-muted uppercase">
        Role · {me.role}
        {me.emailVerifiedAt ? ' · Verified' : ' · Unverified'}
      </p>

      <form onSubmit={onSubmit} className="mt-8 max-w-md space-y-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">First name</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="glass-input rounded-2xl px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Last name</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="glass-input rounded-2xl px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {notice ? <p className="text-sm text-ink">{notice}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
    </div>
  );
}
