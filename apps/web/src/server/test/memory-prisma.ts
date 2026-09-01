/**
 * In-memory Prisma stand-in for Phase 17 service integration tests.
 * Implements the delegates/filters the domain services actually call.
 */
import type { PrismaClient } from '@/generated/prisma/client';

export type MemoryRow = Record<string, unknown>;

type Relation = {
  table: string;
  /** Field on this row that matches `foreign` on the related table. */
  local: string;
  foreign: string;
  many: boolean;
};

const RELATIONS: Record<string, Record<string, Relation>> = {
  user: {
    addresses: { table: 'address', local: 'id', foreign: 'userId', many: true },
    cart: { table: 'cart', local: 'id', foreign: 'userId', many: false },
    orders: { table: 'order', local: 'id', foreign: 'userId', many: true },
    builds: { table: 'pCBuild', local: 'id', foreign: 'userId', many: true },
  },
  address: {
    user: { table: 'user', local: 'userId', foreign: 'id', many: false },
  },
  brand: {
    products: { table: 'product', local: 'id', foreign: 'brandId', many: true },
  },
  category: {
    products: { table: 'product', local: 'id', foreign: 'categoryId', many: true },
  },
  product: {
    brand: { table: 'brand', local: 'brandId', foreign: 'id', many: false },
    category: { table: 'category', local: 'categoryId', foreign: 'id', many: false },
    variants: { table: 'productVariant', local: 'id', foreign: 'productId', many: true },
    images: { table: 'productImage', local: 'id', foreign: 'productId', many: true },
    cpu: { table: 'cpu', local: 'id', foreign: 'productId', many: false },
    gpu: { table: 'gpu', local: 'id', foreign: 'productId', many: false },
    motherboard: { table: 'motherboard', local: 'id', foreign: 'productId', many: false },
    ram: { table: 'ram', local: 'id', foreign: 'productId', many: false },
    storage: { table: 'storageDrive', local: 'id', foreign: 'productId', many: false },
    psu: { table: 'psu', local: 'id', foreign: 'productId', many: false },
    pcCase: { table: 'pcCase', local: 'id', foreign: 'productId', many: false },
    cooler: { table: 'cooler', local: 'id', foreign: 'productId', many: false },
  },
  productVariant: {
    product: { table: 'product', local: 'productId', foreign: 'id', many: false },
    inventory: { table: 'inventory', local: 'id', foreign: 'variantId', many: false },
  },
  productImage: {
    product: { table: 'product', local: 'productId', foreign: 'id', many: false },
  },
  cart: {
    items: { table: 'cartItem', local: 'id', foreign: 'cartId', many: true },
    user: { table: 'user', local: 'userId', foreign: 'id', many: false },
    abandonedCarts: {
      table: 'abandonedCart',
      local: 'id',
      foreign: 'cartId',
      many: true,
    },
  },
  cartItem: {
    cart: { table: 'cart', local: 'cartId', foreign: 'id', many: false },
    variant: {
      table: 'productVariant',
      local: 'variantId',
      foreign: 'id',
      many: false,
    },
  },
  coupon: {
    usages: { table: 'couponUsage', local: 'id', foreign: 'couponId', many: true },
  },
  couponUsage: {
    coupon: { table: 'coupon', local: 'couponId', foreign: 'id', many: false },
    user: { table: 'user', local: 'userId', foreign: 'id', many: false },
    order: { table: 'order', local: 'orderId', foreign: 'id', many: false },
  },
  order: {
    items: { table: 'orderItem', local: 'id', foreign: 'orderId', many: true },
    payments: { table: 'payment', local: 'id', foreign: 'orderId', many: true },
    user: { table: 'user', local: 'userId', foreign: 'id', many: false },
    couponUsage: {
      table: 'couponUsage',
      local: 'id',
      foreign: 'orderId',
      many: false,
    },
  },
  orderItem: {
    order: { table: 'order', local: 'orderId', foreign: 'id', many: false },
    variant: {
      table: 'productVariant',
      local: 'variantId',
      foreign: 'id',
      many: false,
    },
  },
  payment: {
    order: { table: 'order', local: 'orderId', foreign: 'id', many: false },
    refunds: { table: 'refund', local: 'id', foreign: 'paymentId', many: true },
  },
  inventory: {
    variant: {
      table: 'productVariant',
      local: 'variantId',
      foreign: 'id',
      many: false,
    },
    transactions: {
      table: 'inventoryTransaction',
      local: 'id',
      foreign: 'inventoryId',
      many: true,
    },
  },
  inventoryTransaction: {
    inventory: {
      table: 'inventory',
      local: 'inventoryId',
      foreign: 'id',
      many: false,
    },
  },
  pCBuild: {
    items: { table: 'pCBuildItem', local: 'id', foreign: 'buildId', many: true },
    user: { table: 'user', local: 'userId', foreign: 'id', many: false },
  },
  pCBuildItem: {
    build: { table: 'pCBuild', local: 'buildId', foreign: 'id', many: false },
    product: { table: 'product', local: 'productId', foreign: 'id', many: false },
    variant: {
      table: 'productVariant',
      local: 'variantId',
      foreign: 'id',
      many: false,
    },
  },
  abandonedCart: {
    cart: { table: 'cart', local: 'cartId', foreign: 'id', many: false },
    user: { table: 'user', local: 'userId', foreign: 'id', many: false },
    emails: {
      table: 'abandonedCartEmail',
      local: 'id',
      foreign: 'abandonedCartId',
      many: true,
    },
  },
  abandonedCartEmail: {
    abandonedCart: {
      table: 'abandonedCart',
      local: 'abandonedCartId',
      foreign: 'id',
      many: false,
    },
  },
};

const COMPOUND: Record<string, Record<string, string[]>> = {
  cartItem: { cartId_variantId: ['cartId', 'variantId'] },
};

const NESTED_CREATE: Record<string, Record<string, { table: string; fk: string }>> =
  {
    order: {
      items: { table: 'orderItem', fk: 'orderId' },
      payments: { table: 'payment', fk: 'orderId' },
    },
    product: {
      variants: { table: 'productVariant', fk: 'productId' },
      images: { table: 'productImage', fk: 'productId' },
    },
    pCBuild: {
      items: { table: 'pCBuildItem', fk: 'buildId' },
    },
    cart: {
      items: { table: 'cartItem', fk: 'cartId' },
    },
  };

export function asDecimal(value: string | number): {
  toString(): string;
  toNumber(): number;
  toFixed(digits?: number): string;
} {
  const text =
    typeof value === 'number' ? Number(value).toFixed(2) : value;
  const numeric = Number(text);
  return {
    toString: () => text,
    toNumber: () => numeric,
    toFixed: (digits = 2) => numeric.toFixed(digits),
  };
}

function newId(): string {
  return `c${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
}

function cloneShallow(row: MemoryRow): MemoryRow {
  const out: MemoryRow = { ...row };
  for (const [key, value] of Object.entries(out)) {
    if (value instanceof Date) {
      out[key] = new Date(value);
    }
  }
  return out;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !(value instanceof Date);
}

function compareValues(a: unknown, b: unknown): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const left = String(a);
  const right = String(b);
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sortRows(
  rows: MemoryRow[],
  orderBy: unknown,
): MemoryRow[] {
  if (!orderBy) return rows;
  const specs = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((left, right) => {
    for (const spec of specs) {
      if (!isPlainObject(spec)) continue;
      const [key, dir] = Object.entries(spec)[0] ?? [];
      if (!key) continue;
      const cmp = compareValues(left[key], right[key]);
      if (cmp !== 0) return dir === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}

export function createMemoryPrisma(): PrismaClient {
  const db: Record<string, MemoryRow[]> = {};

  function table(name: string): MemoryRow[] {
    if (!db[name]) db[name] = [];
    return db[name];
  }

  function relatedRows(
    fromTable: string,
    row: MemoryRow,
    field: string,
  ): MemoryRow[] {
    const rel = RELATIONS[fromTable]?.[field];
    if (!rel) return [];
    const local = row[rel.local];
    if (local == null) return [];
    return table(rel.table).filter((candidate) => candidate[rel.foreign] === local);
  }

  function matches(
    fromTable: string,
    row: MemoryRow,
    where: unknown,
  ): boolean {
    if (!where || !isPlainObject(where)) return true;

    for (const [key, expected] of Object.entries(where)) {
      if (key === 'AND') {
        const parts = Array.isArray(expected) ? expected : [expected];
        if (!parts.every((part) => matches(fromTable, row, part))) return false;
        continue;
      }
      if (key === 'OR') {
        const parts = Array.isArray(expected) ? expected : [expected];
        if (!parts.some((part) => matches(fromTable, row, part))) return false;
        continue;
      }

      const rel = RELATIONS[fromTable]?.[key];
      if (rel && isPlainObject(expected)) {
        const related = relatedRows(fromTable, row, key);
        if ('some' in expected) {
          if (!related.some((item) => matches(rel.table, item, expected.some))) {
            return false;
          }
          continue;
        }
        if ('none' in expected) {
          if (related.some((item) => matches(rel.table, item, expected.none))) {
            return false;
          }
          continue;
        }
        if ('every' in expected) {
          if (
            related.length === 0 ||
            !related.every((item) => matches(rel.table, item, expected.every))
          ) {
            return false;
          }
          continue;
        }
        const one = rel.many ? related[0] : related[0];
        if (!one || !matches(rel.table, one, expected)) return false;
        continue;
      }

      const actual = row[key];
      if (expected === undefined) continue;
      if (expected === null) {
        if (actual != null) return false;
        continue;
      }
      if (isPlainObject(expected)) {
        if ('in' in expected) {
          const list = expected.in as unknown[];
          if (!list.includes(actual)) return false;
          continue;
        }
        if ('notIn' in expected) {
          const list = expected.notIn as unknown[];
          if (list.includes(actual)) return false;
          continue;
        }
        if ('not' in expected) {
          if (actual === expected.not) return false;
          continue;
        }
        if ('lte' in expected) {
          if (compareValues(actual, expected.lte) > 0) return false;
          continue;
        }
        if ('lt' in expected) {
          if (compareValues(actual, expected.lt) >= 0) return false;
          continue;
        }
        if ('gte' in expected) {
          if (compareValues(actual, expected.gte) < 0) return false;
          continue;
        }
        if ('gt' in expected) {
          if (compareValues(actual, expected.gt) <= 0) return false;
          continue;
        }
      }
      if (actual !== expected) return false;
    }
    return true;
  }

  function applyInclude(
    fromTable: string,
    row: MemoryRow,
    include: unknown,
  ): MemoryRow {
    const result = cloneShallow(row);
    if (!include || include === true || !isPlainObject(include)) return result;

    for (const [field, spec] of Object.entries(include)) {
      if (!spec) continue;
      const rel = RELATIONS[fromTable]?.[field];
      if (!rel) continue;
      let related = relatedRows(fromTable, row, field);
      const nested = isPlainObject(spec) ? spec : {};
      if (nested.where) {
        related = related.filter((item) => matches(rel.table, item, nested.where));
      }
      related = sortRows(related, nested.orderBy);
      if (typeof nested.take === 'number') {
        related = related.slice(0, nested.take);
      }
      const withNested = related.map((item) => {
        if (spec === true) return cloneShallow(item);
        if (isPlainObject(spec) && spec.include) {
          return applyInclude(rel.table, item, spec.include);
        }
        return cloneShallow(item);
      });
      result[field] = rel.many ? withNested : (withNested[0] ?? null);
    }
    return result;
  }

  function findByWhere(name: string, where: unknown): MemoryRow | undefined {
    if (!isPlainObject(where)) return undefined;
    const compounds = COMPOUND[name];
    if (compounds) {
      for (const [compoundKey, fields] of Object.entries(compounds)) {
        const compound = where[compoundKey];
        if (isPlainObject(compound)) {
          return table(name).find((row) =>
            fields.every((field) => row[field] === compound[field]),
          );
        }
      }
    }
    return table(name).find((row) => matches(name, row, where));
  }

  function createRow(name: string, data: Record<string, unknown>): MemoryRow {
    const now = new Date();
    const nested = NESTED_CREATE[name] ?? {};
    const row: MemoryRow = {
      createdAt: now,
      updatedAt: now,
    };

    const childCreates: Array<{ table: string; fk: string; data: unknown }> = [];

    for (const [key, value] of Object.entries(data)) {
      const nestedSpec = nested[key];
      if (nestedSpec && isPlainObject(value) && 'create' in value) {
        childCreates.push({
          table: nestedSpec.table,
          fk: nestedSpec.fk,
          data: value.create,
        });
        continue;
      }
      row[key] = value;
    }

    if (typeof row.id !== 'string') {
      row.id = newId();
    }

    table(name).push(row);

    for (const child of childCreates) {
      const items = Array.isArray(child.data) ? child.data : [child.data];
      for (const item of items) {
        if (!isPlainObject(item)) continue;
        createRow(child.table, { ...item, [child.fk]: row.id });
      }
    }

    return row;
  }

  function assign(row: MemoryRow, data: Record<string, unknown>): void {
    row.updatedAt = new Date();
    for (const [key, value] of Object.entries(data)) {
      row[key] = value;
    }
  }

  function delegate(name: string) {
    return {
      async findUnique(args: { where: unknown; include?: unknown }) {
        const row = findByWhere(name, args.where);
        if (!row) return null;
        return args.include ? applyInclude(name, row, args.include) : cloneShallow(row);
      },
      async findFirst(args: {
        where?: unknown;
        include?: unknown;
        orderBy?: unknown;
      } = {}) {
        const rows = sortRows(
          table(name).filter((row) => matches(name, row, args.where)),
          args.orderBy,
        );
        const row = rows[0];
        if (!row) return null;
        return args.include ? applyInclude(name, row, args.include) : cloneShallow(row);
      },
      async findMany(
        args: {
          where?: unknown;
          include?: unknown;
          orderBy?: unknown;
          take?: number;
          skip?: number;
        } = {},
      ) {
        let rows = table(name).filter((row) => matches(name, row, args.where));
        rows = sortRows(rows, args.orderBy);
        const skip = args.skip ?? 0;
        if (skip) rows = rows.slice(skip);
        if (typeof args.take === 'number') rows = rows.slice(0, args.take);
        return rows.map((row) =>
          args.include ? applyInclude(name, row, args.include) : cloneShallow(row),
        );
      },
      async create(args: { data: Record<string, unknown>; include?: unknown }) {
        const row = createRow(name, args.data);
        return args.include ? applyInclude(name, row, args.include) : cloneShallow(row);
      },
      async update(args: {
        where: unknown;
        data: Record<string, unknown>;
        include?: unknown;
      }) {
        const row = findByWhere(name, args.where);
        if (!row) {
          throw new Error(`Record to update not found in ${name}.`);
        }
        assign(row, args.data);
        return args.include ? applyInclude(name, row, args.include) : cloneShallow(row);
      },
      async updateMany(args: { where?: unknown; data: Record<string, unknown> }) {
        const rows = table(name).filter((row) => matches(name, row, args.where));
        for (const row of rows) assign(row, args.data);
        return { count: rows.length };
      },
      async delete(args: { where: unknown }) {
        const row = findByWhere(name, args.where);
        if (!row) {
          throw new Error(`Record to delete not found in ${name}.`);
        }
        const list = table(name);
        const index = list.indexOf(row);
        if (index >= 0) list.splice(index, 1);
        return cloneShallow(row);
      },
      async deleteMany(args: { where?: unknown } = {}) {
        const list = table(name);
        const keep: MemoryRow[] = [];
        let count = 0;
        for (const row of list) {
          if (matches(name, row, args.where)) {
            count += 1;
          } else {
            keep.push(row);
          }
        }
        db[name] = keep;
        return { count };
      },
      async count(args: { where?: unknown } = {}) {
        return table(name).filter((row) => matches(name, row, args.where)).length;
      },
      async upsert(args: {
        where: unknown;
        create: Record<string, unknown>;
        update: Record<string, unknown>;
        include?: unknown;
      }) {
        const existing = findByWhere(name, args.where);
        if (existing) {
          assign(existing, args.update);
          return args.include
            ? applyInclude(name, existing, args.include)
            : cloneShallow(existing);
        }
        const created = createRow(name, args.create);
        return args.include
          ? applyInclude(name, created, args.include)
          : cloneShallow(created);
      },
    };
  }

  const client = {
    user: delegate('user'),
    address: delegate('address'),
    brand: delegate('brand'),
    category: delegate('category'),
    product: delegate('product'),
    productVariant: delegate('productVariant'),
    productImage: delegate('productImage'),
    cpu: delegate('cpu'),
    gpu: delegate('gpu'),
    motherboard: delegate('motherboard'),
    ram: delegate('ram'),
    storageDrive: delegate('storageDrive'),
    psu: delegate('psu'),
    pcCase: delegate('pcCase'),
    cooler: delegate('cooler'),
    cart: delegate('cart'),
    cartItem: delegate('cartItem'),
    coupon: delegate('coupon'),
    couponUsage: delegate('couponUsage'),
    order: delegate('order'),
    orderItem: delegate('orderItem'),
    payment: delegate('payment'),
    inventory: delegate('inventory'),
    inventoryTransaction: delegate('inventoryTransaction'),
    pCBuild: delegate('pCBuild'),
    pCBuildItem: delegate('pCBuildItem'),
    abandonedCart: delegate('abandonedCart'),
    abandonedCartEmail: delegate('abandonedCartEmail'),
    async $transaction<T>(
      fn: ((tx: PrismaClient) => Promise<T>) | unknown[],
    ): Promise<T> {
      if (typeof fn === 'function') {
        return fn(client as unknown as PrismaClient);
      }
      throw new Error('Array transactions are not used in VORQEN tests.');
    },
    async $queryRaw() {
      return [{ ok: 1 }];
    },
  };

  return client as unknown as PrismaClient;
}
