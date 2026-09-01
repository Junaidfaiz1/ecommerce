'use client';

import { useEffect, useRef, useState, type FormEvent, type MutableRefObject } from 'react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { IMAGE_SIZES, MAX_ADMIN_PRODUCT_IMAGES } from '@vorqen/types';
import { CatalogImage } from '@/components/shared/CatalogImage';
import { Button } from '@/components/ui/button';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import {
  DELETE_ADMIN_PRODUCT_IMAGE,
  UPDATE_ADMIN_PRODUCT_IMAGE,
} from '../graphql';
import { uploadProductImage } from './upload';

export type AdminProductImage = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

type Props = {
  productId?: string;
  images: AdminProductImage[];
  productName: string;
  pending: boolean;
  onImagesChange: (images: AdminProductImage[]) => void;
  pendingFilesRef?: MutableRefObject<File[]>;
  onError: (message: string | null) => void;
};

export function ProductMediaPanel({
  productId,
  images,
  productName,
  pending,
  onImagesChange,
  pendingFilesRef,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Array<{ file: File; preview: string }>>(
    [],
  );
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;

  useEffect(() => {
    return () => {
      draftsRef.current.forEach((d) => URL.revokeObjectURL(d.preview));
    };
  }, []);

  useEffect(() => {
    if (pendingFilesRef) pendingFilesRef.current = drafts.map((d) => d.file);
  }, [drafts, pendingFilesRef]);

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    onError(null);
    const incoming = Array.from(list);
    if (!productId) {
      const room = Math.max(0, MAX_ADMIN_PRODUCT_IMAGES - drafts.length);
      const next = incoming.slice(0, room).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setDrafts((current) => [...current, ...next]);
      return;
    }
    setBusy(true);
    try {
      let current = images;
      for (const file of incoming) {
        if (current.length >= MAX_ADMIN_PRODUCT_IMAGES) break;
        const result = await uploadProductImage({
          productId,
          file,
          alt: productName || file.name,
          isPrimary: current.length === 0,
        });
        if (result.image) current = [...current, result.image];
      }
      onImagesChange(current);
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function setPrimary(id: string) {
    if (!productId) return;
    setBusy(true);
    onError(null);
    try {
      const data = await graphqlRequest<{
        updateAdminProductImage: { images: AdminProductImage[] };
      }>(UPDATE_ADMIN_PRODUCT_IMAGE, { input: { id, isPrimary: true } });
      onImagesChange(data.updateAdminProductImage.images);
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeSaved(id: string) {
    if (!productId) return;
    setBusy(true);
    onError(null);
    try {
      const data = await graphqlRequest<{
        deleteAdminProductImage: { images: AdminProductImage[] };
      }>(DELETE_ADMIN_PRODUCT_IMAGE, { input: { id } });
      onImagesChange(data.deleteAdminProductImage.images);
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function removeDraft(preview: string) {
    setDrafts((current) => {
      const hit = current.find((d) => d.preview === preview);
      if (hit) URL.revokeObjectURL(hit.preview);
      return current.filter((d) => d.preview !== preview);
    });
  }

  const disabled = pending || busy;
  const canAdd =
    (productId ? images.length : drafts.length) < MAX_ADMIN_PRODUCT_IMAGES;

  return (
    <section className="rounded-2xl border border-white/10 bg-elevated/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium tracking-tight">Media</h2>
          <p className="mt-1 text-xs text-muted">
            JPEG, PNG, or WebP · up to 8 MB · {MAX_ADMIN_PRODUCT_IMAGES} photos
            max. Storefront shows these database URLs.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !canAdd}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="mr-1.5 size-3.5" />
          {busy ? 'Uploading…' : 'Upload'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {images.length === 0 && drafts.length === 0 ? (
        <button
          type="button"
          disabled={disabled || !canAdd}
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-surface/50 text-sm text-muted transition hover:border-sage/40 hover:text-cream"
        >
          <ImagePlus className="mb-2 size-6 text-sage" />
          Drop in a product photo
        </button>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <li
              key={image.id}
              className={cn(
                'group relative overflow-hidden rounded-xl border bg-surface',
                image.isPrimary ? 'border-sage/50' : 'border-white/10',
              )}
            >
              <div className="relative aspect-square">
                <CatalogImage
                  src={image.url}
                  alt={image.alt ?? productName}
                  sizes={IMAGE_SIZES.adminThumb}
                />
              </div>
              {image.isPrimary ? (
                <span className="absolute top-2 left-2 rounded-full bg-ink/80 px-2 py-0.5 font-mono text-[10px] tracking-wide text-sage uppercase">
                  Primary
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-ink/80 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                {!image.isPrimary ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void setPrimary(image.id)}
                    className="rounded-md bg-elevated/90 p-1.5 text-cream hover:text-sage"
                    aria-label="Set as primary image"
                  >
                    <Star className="size-3.5" />
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => void removeSaved(image.id)}
                  className="rounded-md bg-elevated/90 p-1.5 text-cream hover:text-accent"
                  aria-label="Remove image"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
          {drafts.map((draft) => (
            <li
              key={draft.preview}
              className="relative overflow-hidden rounded-xl border border-dashed border-white/20 bg-surface"
            >
              <div className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draft.preview}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <span className="absolute top-2 left-2 rounded-full bg-ink/80 px-2 py-0.5 font-mono text-[10px] text-muted uppercase">
                Pending
              </span>
              <button
                type="button"
                onClick={() => removeDraft(draft.preview)}
                className="absolute right-2 bottom-2 rounded-md bg-elevated/90 p-1.5 text-cream hover:text-accent"
                aria-label="Remove pending image"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
