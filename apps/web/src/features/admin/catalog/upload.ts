import { GraphQLClientError } from '@/lib/graphql-client';

export type UploadedAdminImage = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

export async function uploadProductImage(input: {
  productId: string;
  file: File;
  alt?: string;
  isPrimary?: boolean;
}): Promise<{ image: UploadedAdminImage | null; productId: string }> {
  const form = new FormData();
  form.set('productId', input.productId);
  form.set('file', input.file);
  if (input.alt) form.set('alt', input.alt);
  if (input.isPrimary) form.set('isPrimary', 'true');

  const res = await fetch('/api/admin/catalog/images', {
    method: 'POST',
    credentials: 'include',
    body: form,
  });

  let json: {
    code?: string;
    message?: string;
    image?: UploadedAdminImage | null;
    productId?: string;
  } = {};
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new GraphQLClientError({
      message: 'Upload failed.',
      extensions: { code: 'INTERNAL' },
    });
  }

  if (!res.ok) {
    throw new GraphQLClientError({
      message: json.message ?? 'Upload failed.',
      extensions: { code: json.code ?? 'INTERNAL' },
    });
  }

  return {
    image: json.image ?? null,
    productId: json.productId ?? input.productId,
  };
}
