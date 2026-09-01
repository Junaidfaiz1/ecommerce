import type {
  CreateAddressInput,
  DeleteAddressInput,
  UpdateAddressInput,
} from '@vorqen/types';
import type { Address, PrismaClient } from '@/generated/prisma/client';
import { NotFoundError } from '../common/errors';

export type PublicAddress = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  type: Address['type'];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

function mapAddress(address: Address): PublicAddress {
  return {
    id: address.id,
    label: address.label,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone,
    type: address.type,
    isDefault: address.isDefault,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  };
}

async function clearDefault(
  prisma: PrismaClient,
  userId: string,
  exceptId?: string,
) {
  await prisma.address.updateMany({
    where: {
      userId,
      isDefault: true,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    data: { isDefault: false },
  });
}

export async function listAddresses(
  prisma: PrismaClient,
  userId: string,
): Promise<PublicAddress[]> {
  const rows = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });
  return rows.map(mapAddress);
}

export async function createAddress(
  prisma: PrismaClient,
  userId: string,
  input: CreateAddressInput,
): Promise<PublicAddress> {
  if (input.isDefault) {
    await clearDefault(prisma, userId);
  }

  const created = await prisma.address.create({
    data: {
      userId,
      label: input.label ?? null,
      line1: input.line1,
      line2: input.line2 ?? null,
      city: input.city,
      state: input.state ?? null,
      postalCode: input.postalCode,
      country: input.country,
      phone: input.phone ?? null,
      type: input.type,
      isDefault: input.isDefault,
    },
  });

  return mapAddress(created);
}

export async function updateAddress(
  prisma: PrismaClient,
  userId: string,
  input: UpdateAddressInput,
): Promise<PublicAddress> {
  const existing = await prisma.address.findFirst({
    where: { id: input.id, userId },
  });
  if (!existing) {
    throw new NotFoundError('Address not found.', { id: 'Unknown address.' });
  }

  if (input.isDefault === true) {
    await clearDefault(prisma, userId, input.id);
  }

  const updated = await prisma.address.update({
    where: { id: input.id },
    data: {
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.line1 !== undefined ? { line1: input.line1 } : {}),
      ...(input.line2 !== undefined ? { line2: input.line2 } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
    },
  });

  return mapAddress(updated);
}

export async function deleteAddress(
  prisma: PrismaClient,
  userId: string,
  input: DeleteAddressInput,
): Promise<{ ok: true }> {
  const existing = await prisma.address.findFirst({
    where: { id: input.id, userId },
  });
  if (!existing) {
    throw new NotFoundError('Address not found.', { id: 'Unknown address.' });
  }

  await prisma.address.delete({ where: { id: input.id } });
  return { ok: true };
}
