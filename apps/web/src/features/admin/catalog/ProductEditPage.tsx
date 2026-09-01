'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  PRODUCT_STATUSES,
  PRODUCT_TYPES,
  upsertAdminProductInputSchema,
  upsertAdminVariantInputSchema,
} from '@vorqen/types';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/shared/SectionStates';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import {
  ADMIN_CATALOG_META,
  ADMIN_PRODUCT,
  UPSERT_ADMIN_PRODUCT,
  UPSERT_ADMIN_VARIANT,
} from '../graphql';
import { AdminHeader, Field, fieldClass } from '../ui';
import {
  ProductMediaPanel,
  type AdminProductImage,
} from './ProductMediaPanel';
import { uploadProductImage } from './upload';

type Brand = { id: string; name: string; slug: string };
type Category = { id: string; name: string; slug: string };
type Variant = {
  id: string;
  sku: string;
  name: string | null;
  price: string;
  compareAtPrice: string | null;
  isDefault: boolean;
  isActive: boolean;
  quantityOnHand: number;
  lowStockThreshold: number;
};

export function ProductEditPage({ productId }: { productId?: string }) {
  const router = useRouter();
  const isNew = !productId;
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<(typeof PRODUCT_TYPES)[number]>('GPU');
  const [status, setStatus] = useState<(typeof PRODUCT_STATUSES)[number]>('DRAFT');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [featured, setFeatured] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('0.00');
  const [onHand, setOnHand] = useState('0');
  const [cpuSocket, setCpuSocket] = useState('AM5');
  const [cpuCores, setCpuCores] = useState('8');
  const [cpuThreads, setCpuThreads] = useState('16');
  const [cpuBase, setCpuBase] = useState('4.2');
  const [cpuBoost, setCpuBoost] = useState('5.0');
  const [cpuTdp, setCpuTdp] = useState('120');
  const [cpuMem, setCpuMem] = useState('DDR5');
  const [gpuChipset, setGpuChipset] = useState('');
  const [gpuLength, setGpuLength] = useState('300');
  const [gpuTdp, setGpuTdp] = useState('320');
  const [gpuVram, setGpuVram] = useState('16');
  const [gpuConnectors, setGpuConnectors] = useState('3x 8-pin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [pending, setPending] = useState(false);
  const [variantTick, setVariantTick] = useState(0);
  const [images, setImages] = useState<AdminProductImage[]>([]);
  const pendingFilesRef = useRef<File[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isNew) {
          const meta = await graphqlRequest<{
            adminBrands: Brand[];
            adminCategories: Category[];
          }>(ADMIN_CATALOG_META);
          if (cancelled) return;
          setBrands(meta.adminBrands);
          setCategories(meta.adminCategories);
          setBrandId(meta.adminBrands[0]?.id ?? '');
          setCategoryId(meta.adminCategories[0]?.id ?? '');
        } else {
          const data = await graphqlRequest<{
            adminProduct: {
              name: string;
              slug: string;
              description: string | null;
              type: string;
              status: string;
              isFeatured: boolean;
              brand: Brand;
              category: Category;
              cpu: {
                socket: string;
                cores: number;
                threads: number;
                baseClockGhz: number;
                boostClockGhz: number;
                tdpWatts: number;
                memoryType: string;
              } | null;
              gpu: {
                chipset: string;
                lengthMm: number;
                tdpWatts: number;
                vramGb: number;
                powerConnectors: string;
              } | null;
              variants: Variant[];
              images: AdminProductImage[];
            };
            adminBrands: Brand[];
            adminCategories: Category[];
          }>(ADMIN_PRODUCT, { id: productId });
          if (cancelled) return;
          const p = data.adminProduct;
          setName(p.name);
          setSlug(p.slug);
          setDescription(p.description ?? '');
          setType(p.type as (typeof PRODUCT_TYPES)[number]);
          setStatus(p.status as (typeof PRODUCT_STATUSES)[number]);
          setBrandId(p.brand.id);
          setCategoryId(p.category.id);
          setFeatured(p.isFeatured);
          setVariants(p.variants);
          setImages(p.images ?? []);
          if (p.cpu) {
            setCpuSocket(p.cpu.socket);
            setCpuCores(String(p.cpu.cores));
            setCpuThreads(String(p.cpu.threads));
            setCpuBase(String(p.cpu.baseClockGhz));
            setCpuBoost(String(p.cpu.boostClockGhz));
            setCpuTdp(String(p.cpu.tdpWatts));
            setCpuMem(p.cpu.memoryType);
          }
          if (p.gpu) {
            setGpuChipset(p.gpu.chipset);
            setGpuLength(String(p.gpu.lengthMm));
            setGpuTdp(String(p.gpu.tdpWatts));
            setGpuVram(String(p.gpu.vramGb));
            setGpuConnectors(p.gpu.powerConnectors);
          }
          setBrands(data.adminBrands);
          setCategories(data.adminCategories);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, productId, variantTick]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const hardware =
      type === 'CPU'
        ? {
            cpu: {
              socket: cpuSocket,
              cores: Number(cpuCores),
              threads: Number(cpuThreads),
              baseClockGhz: Number(cpuBase),
              boostClockGhz: Number(cpuBoost),
              tdpWatts: Number(cpuTdp),
              memoryType: cpuMem,
              hasIntegratedGpu: false,
            },
          }
        : type === 'GPU'
          ? {
              gpu: {
                chipset: gpuChipset,
                lengthMm: Number(gpuLength),
                tdpWatts: Number(gpuTdp),
                vramGb: Number(gpuVram),
                powerConnectors: gpuConnectors,
              },
            }
          : {};
    const parsed = upsertAdminProductInputSchema.safeParse({
      ...(productId ? { id: productId } : {}),
      brandId,
      categoryId,
      type,
      name,
      slug,
      description: description || null,
      status,
      isFeatured: featured,
      ...hardware,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check product fields.');
      return;
    }
    setPending(true);
    try {
      const data = await graphqlRequest<{
        upsertAdminProduct: { id: string };
      }>(UPSERT_ADMIN_PRODUCT, { input: parsed.data });
      const savedId = data.upsertAdminProduct.id;
      const queued = pendingFilesRef.current;
      if (isNew && queued.length > 0) {
        for (const [index, file] of queued.entries()) {
          await uploadProductImage({
            productId: savedId,
            file,
            alt: name || file.name,
            isPrimary: index === 0,
          });
        }
        pendingFilesRef.current = [];
      }
      if (isNew) {
        router.replace(`/admin/catalog/${savedId}`);
        return;
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function onAddVariant(e: FormEvent) {
    e.preventDefault();
    if (!productId) return;
    const parsed = upsertAdminVariantInputSchema.safeParse({
      productId,
      sku,
      price,
      isDefault: variants.length === 0,
      quantityOnHand: Number(onHand),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check variant fields.');
      return;
    }
    setPending(true);
    try {
      await graphqlRequest(UPSERT_ADMIN_VARIANT, { input: parsed.data });
      setSku('');
      setVariantTick((n) => n + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading product…</p>;
  if (error && isNew && brands.length === 0) return <ErrorState message={error} />;

  return (
    <div>
      <AdminHeader
        title={isNew ? 'New product' : name || 'Edit product'}
        description="Prices, stock, and photos are stored on the server. Hardware specs feed the compatibility engine."
      />
      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]">
      <form onSubmit={(e) => void onSave(e)} className="space-y-4 rounded-2xl border border-white/10 bg-elevated/40 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Slug">
            <input className={fieldClass} value={slug} onChange={(e) => setSlug(e.target.value)} />
          </Field>
          <Field label="Type">
            <select
              className={fieldClass}
              value={type}
              onChange={(e) => setType(e.target.value as (typeof PRODUCT_TYPES)[number])}
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={fieldClass}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as (typeof PRODUCT_STATUSES)[number])
              }
            >
              {PRODUCT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Brand">
            <select className={fieldClass} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select
              className={fieldClass}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea
            className={fieldClass}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          Featured
        </label>

        {type === 'CPU' ? (
          <div className="grid gap-3 border border-border p-4 sm:grid-cols-3">
            <Field label="Socket">
              <input className={fieldClass} value={cpuSocket} onChange={(e) => setCpuSocket(e.target.value)} />
            </Field>
            <Field label="Cores">
              <input className={fieldClass} value={cpuCores} onChange={(e) => setCpuCores(e.target.value)} />
            </Field>
            <Field label="Threads">
              <input className={fieldClass} value={cpuThreads} onChange={(e) => setCpuThreads(e.target.value)} />
            </Field>
            <Field label="Base GHz">
              <input className={fieldClass} value={cpuBase} onChange={(e) => setCpuBase(e.target.value)} />
            </Field>
            <Field label="Boost GHz">
              <input className={fieldClass} value={cpuBoost} onChange={(e) => setCpuBoost(e.target.value)} />
            </Field>
            <Field label="TDP W">
              <input className={fieldClass} value={cpuTdp} onChange={(e) => setCpuTdp(e.target.value)} />
            </Field>
            <Field label="Memory">
              <input className={fieldClass} value={cpuMem} onChange={(e) => setCpuMem(e.target.value)} />
            </Field>
          </div>
        ) : null}
        {type === 'GPU' ? (
          <div className="grid gap-3 border border-border p-4 sm:grid-cols-3">
            <Field label="Chipset">
              <input className={fieldClass} value={gpuChipset} onChange={(e) => setGpuChipset(e.target.value)} />
            </Field>
            <Field label="Length mm">
              <input className={fieldClass} value={gpuLength} onChange={(e) => setGpuLength(e.target.value)} />
            </Field>
            <Field label="TDP W">
              <input className={fieldClass} value={gpuTdp} onChange={(e) => setGpuTdp(e.target.value)} />
            </Field>
            <Field label="VRAM GB">
              <input className={fieldClass} value={gpuVram} onChange={(e) => setGpuVram(e.target.value)} />
            </Field>
            <Field label="Power connectors">
              <input className={fieldClass} value={gpuConnectors} onChange={(e) => setGpuConnectors(e.target.value)} />
            </Field>
          </div>
        ) : null}

        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save product'}
        </Button>
      </form>

      <ProductMediaPanel
        productId={productId}
        images={images}
        productName={name}
        pending={pending}
        pendingFilesRef={pendingFilesRef}
        onImagesChange={setImages}
        onError={setError}
      />
      </div>

      {productId ? (
        <section className="mt-10 max-w-3xl rounded-2xl border border-white/10 bg-elevated/40 p-5">
          <h2 className="text-lg">Variants</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {variants.map((v) => (
              <li key={v.id} className="rounded-lg border border-white/10 px-3 py-2">
                <span className="font-mono">{v.sku}</span> · {v.price} · on-hand{' '}
                {v.quantityOnHand}
                {v.isDefault ? ' · default' : ''}
              </li>
            ))}
          </ul>
          <form onSubmit={(e) => void onAddVariant(e)} className="mt-4 grid gap-3 sm:grid-cols-3">
            <Field label="SKU">
              <input className={fieldClass} value={sku} onChange={(e) => setSku(e.target.value)} />
            </Field>
            <Field label="Price">
              <input className={fieldClass} value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
            <Field label="Initial on-hand">
              <input className={fieldClass} value={onHand} onChange={(e) => setOnHand(e.target.value)} />
            </Field>
            <Button type="submit" disabled={pending}>
              Add variant
            </Button>
          </form>
        </section>
      ) : (
        <p className="mt-6 text-sm text-muted">Save the product first, then add variants.</p>
      )}
    </div>
  );
}
