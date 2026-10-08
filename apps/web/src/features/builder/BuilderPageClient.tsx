'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { BuilderShell } from './components/BuilderShell';
import { BUILD_QUERY, DUPLICATE_BUILD_MUTATION } from './graphql';
import { useBuilderStore, type DraftPart } from './store';
import type { ComponentSlot } from '@vorqen/types';

type LoadedBuild = {
  id: string;
  name: string;
  items: Array<{
    slot: ComponentSlot;
    productId: string;
    variantId: string | null;
    quantity: number;
    productName: string;
    brandName: string;
    imageUrl: string | null;
    unitPrice: string | null;
  }>;
};

export function BuilderPageClient() {
  const searchParams = useSearchParams();
  const loadDraft = useBuilderStore((s) => s.loadDraft);
  const loadedKey = useRef<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const duplicate = searchParams.get('duplicate');
    const key = `${id ?? ''}:${slug ?? ''}:${duplicate ?? ''}`;

    if (!id && !slug) {
      if (loadedKey.current !== 'fresh') {
        loadedKey.current = 'fresh';
      }
      return;
    }

    if (loadedKey.current === key) return;
    loadedKey.current = key;

    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{ build: LoadedBuild }>(BUILD_QUERY, {
          id: id ?? undefined,
          slug: slug ?? undefined,
        });
        if (cancelled) return;

        const parts: DraftPart[] = data.build.items.map((item) => ({
          slot: item.slot,
          productId: item.productId,
          variantId: item.variantId ?? undefined,
          quantity: item.quantity,
          productName: item.productName,
          brandName: item.brandName,
          imageUrl: item.imageUrl,
          unitPrice: item.unitPrice,
        }));

        if (duplicate === '1') {
          const dup = await graphqlRequest<{
            duplicateBuild: { id: string; name: string };
          }>(DUPLICATE_BUILD_MUTATION, {
            input: { id: data.build.id },
          });
          if (cancelled) return;
          loadDraft({
            buildId: dup.duplicateBuild.id,
            buildName: dup.duplicateBuild.name,
            parts,
          });
        } else {
          loadDraft({
            buildId: data.build.id,
            buildName: data.build.name,
            parts,
          });
        }
      } catch (err) {
        console.warn('[builder] failed to load build', getErrorMessage(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, loadDraft]);

  return <BuilderShell />;
}
