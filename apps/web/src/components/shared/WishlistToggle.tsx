'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { graphqlRequest, GraphQLClientError } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { loginHref } from '@/lib/auth-redirect';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ADD_TO_WISHLIST,
  REMOVE_FROM_WISHLIST,
  WISHLIST_CONTAINS,
  type WishlistData,
} from '@/features/wishlist/graphql';

type WishlistToggleProps = {
  variantId: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
};

export function WishlistToggle({
  variantId,
  className,
  size = 'sm',
}: WishlistToggleProps) {
  const pathname = usePathname();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{ wishlistContains: boolean }>(
          WISHLIST_CONTAINS,
          { variantId },
        );
        if (!cancelled) {
          setSaved(data.wishlistContains);
          setNeedsAuth(false);
        }
      } catch (e) {
        if (
          e instanceof GraphQLClientError &&
          e.code === 'UNAUTHENTICATED'
        ) {
          if (!cancelled) setNeedsAuth(true);
          return;
        }
        // Silent — toggle still usable after sign-in.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [variantId]);

  async function onToggle() {
    setError(null);
    setPending(true);
    try {
      if (saved) {
        await graphqlRequest<{ removeFromWishlist: WishlistData }>(
          REMOVE_FROM_WISHLIST,
          { input: { variantId } },
        );
        setSaved(false);
      } else {
        await graphqlRequest<{ addToWishlist: WishlistData }>(
          ADD_TO_WISHLIST,
          { input: { variantId } },
        );
        setSaved(true);
      }
      setNeedsAuth(false);
    } catch (e) {
      if (e instanceof GraphQLClientError && e.code === 'UNAUTHENTICATED') {
        setNeedsAuth(true);
        setError('Sign in to save items.');
      } else {
        setError(getErrorMessage(e));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      <Button
        type="button"
        variant={saved ? 'default' : 'outline'}
        size={size}
        disabled={pending || !variantId}
        aria-pressed={saved}
        onClick={onToggle}
      >
        {pending ? '…' : saved ? 'Saved' : 'Wishlist'}
      </Button>
      {needsAuth && error ? (
        <p className="text-xs text-muted">
          <Link href={loginHref(pathname)} className="text-accent hover:underline">
            Sign in
          </Link>{' '}
          to use wishlist.
        </p>
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
