'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { BuildVisibility } from '@vorqen/types';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { ADD_BUILD_TO_CART, type CartData } from '@/features/cart/graphql';
import { syncCartUi } from '@/features/cart/sync';
import { ME_QUERY, SAVE_BUILD_MUTATION } from '../graphql';
import { useBuilderStore } from '../store';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function SaveBuildPanel() {
  const parts = useBuilderStore((s) => s.parts);
  const buildId = useBuilderStore((s) => s.buildId);
  const buildName = useBuilderStore((s) => s.buildName);
  const setBuildName = useBuilderStore((s) => s.setBuildName);
  const loadDraft = useBuilderStore((s) => s.loadDraft);

  const [visibility, setVisibility] = useState<BuildVisibility>('PRIVATE');
  const [slug, setSlug] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cartPending, setCartPending] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setNeedsAuth(false);

    if (parts.length === 0) {
      setError('Add at least one component before saving.');
      return;
    }

    setPending(true);
    try {
      const me = await graphqlRequest<{ me: { id: string } | null }>(ME_QUERY);
      if (!me.me) {
        setNeedsAuth(true);
        setError('Sign in to save this build.');
        return;
      }

      const autoSlug =
        visibility !== 'PRIVATE'
          ? slug || slugify(buildName) || `build-${Date.now()}`
          : undefined;

      const data = await graphqlRequest<{
        saveBuild: { id: string; name: string };
      }>(SAVE_BUILD_MUTATION, {
        input: {
          id: buildId ?? undefined,
          name: buildName.trim() || 'Untitled build',
          notes: notes.trim() || undefined,
          visibility,
          slug: autoSlug,
          components: parts.map(
            ({ slot, productId, variantId, quantity }) => ({
              slot,
              productId,
              variantId,
              quantity,
            }),
          ),
        },
      });

      loadDraft({
        buildId: data.saveBuild.id,
        buildName: data.saveBuild.name,
        parts,
      });
      setSuccess('Build saved.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function onAddToCart() {
    setError(null);
    setSuccess(null);

    if (!buildId) {
      setError('Save the build before adding it to the cart.');
      return;
    }
    if (parts.length === 0) {
      setError('Add at least one component first.');
      return;
    }

    setCartPending(true);
    try {
      const data = await graphqlRequest<{ addBuildToCart: CartData }>(
        ADD_BUILD_TO_CART,
        { input: { buildId } },
      );
      syncCartUi(data.addBuildToCart);
      setSuccess('Build added to cart.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCartPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 border-t border-border pt-6">
      <div>
        <h3 className="font-display text-xl tracking-tight">Save build</h3>
        <p className="mt-1 text-sm text-muted">
          Server re-checks prices and compatibility on save.
        </p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Name</span>
        <input
          value={buildName}
          onChange={(e) => setBuildName(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
          maxLength={120}
          required
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={2000}
          className="resize-y rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Visibility</span>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as BuildVisibility)}
          className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
        >
          <option value="PRIVATE">Private</option>
          <option value="UNLISTED">Unlisted (link)</option>
          <option value="PUBLIC">Public</option>
        </select>
      </label>

      {visibility !== 'PRIVATE' ? (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={slugify(buildName) || 'my-build'}
            className="rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-accent"
          />
        </label>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
      {needsAuth ? (
        <p className="text-sm text-muted">
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>{' '}
          or{' '}
          <Link
            href="/register"
            className="text-foreground underline-offset-4 hover:underline"
          >
            create an account
          </Link>
          .
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending || parts.length === 0}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Saving…' : buildId ? 'Update build' : 'Save build'}
        </button>
        <button
          type="button"
          disabled={cartPending || !buildId || parts.length === 0}
          title={
            buildId
              ? 'Add all parts to cart (server prices + compatibility)'
              : 'Save the build first'
          }
          onClick={() => void onAddToCart()}
          className="rounded-md border border-border px-5 py-2.5 text-sm transition-colors hover:bg-elevated disabled:opacity-60"
        >
          {cartPending ? 'Adding…' : 'Add to cart'}
        </button>
        {buildId ? (
          <Link
            href="/cart"
            className="inline-flex items-center px-2 text-sm text-muted hover:text-accent"
          >
            View cart
          </Link>
        ) : null}
      </div>
    </form>
  );
}
