'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmptyState, ErrorState } from '@/components/shared/SectionStates';
import { Price } from '@/components/shared/Price';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';

const MY_BUILDS = `
  query AccountBuilds {
    myBuilds {
      id
      name
      slug
      visibility
      totalPriceSnapshot
      currency
      updatedAt
      items { slot productName }
    }
  }
`;

type Build = {
  id: string;
  name: string;
  slug: string | null;
  visibility: string;
  totalPriceSnapshot: string;
  currency: string;
  updatedAt: string;
  items: Array<{ slot: string; productName: string }>;
};

export default function AccountBuildsPage() {
  const router = useRouter();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{ myBuilds: Build[] }>(MY_BUILDS);
        if (!cancelled) setBuilds(data.myBuilds);
      } catch (err) {
        if (!cancelled) {
          const msg = getErrorMessage(err);
          if (msg.toLowerCase().includes('auth')) {
            router.replace('/login?next=/account/builds');
            return;
          }
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return <p className="text-sm text-muted">Loading builds…</p>;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div>
      <h1 className="font-display text-3xl tracking-tight">Saved builds</h1>
      <p className="mt-2 text-sm text-muted">
        Reopen any configuration in the PC Builder.
      </p>

      {builds.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No saved builds"
          description="Configure a machine and save it from the builder."
          action={
            <Link href="/build" className="text-sm text-accent">
              Open Builder
            </Link>
          }
        />
      ) : (
        <ul className="mt-8 space-y-4">
          {builds.map((build) => (
            <li
              key={build.id}
              className="border border-border bg-surface/40 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/build?id=${build.id}`}
                    className="font-display text-lg tracking-tight hover:text-accent"
                  >
                    {build.name}
                  </Link>
                  <p className="mt-1 font-mono text-[10px] text-muted uppercase">
                    {build.visibility} ·{' '}
                    {new Date(build.updatedAt).toLocaleDateString()}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {build.items.map((i) => i.productName).join(' · ') ||
                      'Empty draft'}
                  </p>
                </div>
                <Price
                  amount={build.totalPriceSnapshot}
                  currency={build.currency}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
