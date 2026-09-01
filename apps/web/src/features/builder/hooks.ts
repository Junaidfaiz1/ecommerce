'use client';

import { useEffect, useState, useTransition } from 'react';
import type { CompatibilityResult, ComponentSlot, ProductType } from '@vorqen/types';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import {
  ESTIMATE_PERFORMANCE_QUERY,
  PREVIEW_BUILD_QUERY,
  PRODUCTS_FOR_SLOT_QUERY,
} from './graphql';
import { useBuilderStore, type DraftPart } from './store';

export type CatalogPick = {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  brand: { name: string };
  images: Array<{ url: string; isPrimary: boolean }>;
  defaultVariant: {
    id: string;
    price: string;
    currency: string;
    inStock: boolean;
    availableQuantity: number;
  } | null;
};

export type BuildPreviewData = {
  totalPrice: string;
  currency: string;
  lineItems: Array<{
    slot: ComponentSlot;
    productId: string;
    productName: string;
    variantId: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  compatibility: CompatibilityResult;
};

export type PerfEstimate = {
  gameId: string;
  gameName: string;
  gameSlug: string;
  resolution: string;
  quality: string;
  avgFps: number;
  isEstimate: boolean;
  source: string | null;
};

const SLOT_TO_TYPE: Record<ComponentSlot, ProductType> = {
  CPU: 'CPU',
  GPU: 'GPU',
  MOTHERBOARD: 'MOTHERBOARD',
  RAM: 'RAM',
  STORAGE: 'STORAGE',
  PSU: 'PSU',
  CASE: 'CASE',
  COOLER: 'COOLER',
};

type SlotCache = { slot: ComponentSlot; items: CatalogPick[]; error: string | null };

export function useSlotProducts(slot: ComponentSlot | null) {
  const [cache, setCache] = useState<SlotCache | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!slot) return;

    let cancelled = false;
    startTransition(async () => {
      try {
        const data = await graphqlRequest<{
          products: { items: CatalogPick[] };
        }>(PRODUCTS_FOR_SLOT_QUERY, {
          type: SLOT_TO_TYPE[slot],
          pageSize: 48,
        });
        if (!cancelled) {
          setCache({ slot, items: data.products.items, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setCache({ slot, items: [], error: getErrorMessage(err) });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [slot]);

  if (!slot) {
    return { items: [] as CatalogPick[], error: null as string | null, pending: false };
  }

  const fresh = cache?.slot === slot ? cache : null;
  return {
    items: fresh?.items ?? [],
    error: fresh?.error ?? null,
    pending: pending || !fresh,
  };
}

type PreviewCache = {
  key: string;
  preview: BuildPreviewData | null;
  error: string | null;
};

function partsKey(parts: DraftPart[]): string {
  return parts
    .map((p) => `${p.slot}:${p.productId}:${p.quantity}:${p.variantId ?? ''}`)
    .sort()
    .join('|');
}

export function useBuildPreview(parts: DraftPart[]) {
  const key = partsKey(parts);
  const [cache, setCache] = useState<PreviewCache | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (parts.length === 0) return;

    const handle = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const components = parts.map(
            ({ slot, productId, variantId, quantity }) => ({
              slot,
              productId,
              variantId,
              quantity,
            }),
          );
          const data = await graphqlRequest<{ previewBuild: BuildPreviewData }>(
            PREVIEW_BUILD_QUERY,
            { input: { components } },
          );
          setCache({ key, preview: data.previewBuild, error: null });
        } catch (err) {
          setCache({ key, preview: null, error: getErrorMessage(err) });
        }
      });
    }, 280);

    return () => window.clearTimeout(handle);
  }, [key, parts]);

  if (parts.length === 0) {
    return { preview: null, error: null, pending: false };
  }

  const fresh = cache?.key === key ? cache : null;
  return {
    preview: fresh?.preview ?? null,
    error: fresh?.error ?? null,
    pending: pending || !fresh,
  };
}

type PerfCache = {
  key: string;
  result: {
    estimates: PerfEstimate[];
    missing: boolean;
    message: string | null;
  } | null;
  error: string | null;
};

export function usePerformanceEstimates() {
  const parts = useBuilderStore((s) => s.parts);
  const cpuId = parts.find((p) => p.slot === 'CPU')?.productId;
  const gpuId = parts.find((p) => p.slot === 'GPU')?.productId;
  const key = cpuId && gpuId ? `${cpuId}:${gpuId}` : '';

  const [cache, setCache] = useState<PerfCache | null>(null);

  useEffect(() => {
    if (!cpuId || !gpuId) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{
          estimatePerformance: {
            estimates: PerfEstimate[];
            missing: boolean;
            message: string | null;
          };
        }>(ESTIMATE_PERFORMANCE_QUERY, {
          input: {
            cpuProductId: cpuId,
            gpuProductId: gpuId,
          },
        });
        if (!cancelled) {
          setCache({ key, result: data.estimatePerformance, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setCache({ key, result: null, error: getErrorMessage(err) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cpuId, gpuId, key]);

  if (!cpuId || !gpuId) {
    return { result: null, error: null, ready: false };
  }

  const fresh = cache?.key === key ? cache : null;
  return {
    result: fresh?.result ?? null,
    error: fresh?.error ?? null,
    ready: true,
  };
}

export function catalogPickToDraft(
  slot: ComponentSlot,
  product: CatalogPick,
): DraftPart {
  const image =
    product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url ?? null;
  return {
    slot,
    productId: product.id,
    variantId: product.defaultVariant?.id,
    quantity: 1,
    productName: product.name,
    brandName: product.brand.name,
    imageUrl: image,
    unitPrice: product.defaultVariant?.price ?? null,
  };
}
