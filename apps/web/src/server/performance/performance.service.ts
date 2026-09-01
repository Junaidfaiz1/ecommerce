import type { EstimatePerformanceInput, GraphicsQuality } from '@vorqen/types';
import type { PrismaClient } from '@/generated/prisma/client';
import { NotFoundError } from '../common/errors';

export type PerformanceEstimate = {
  gameId: string;
  gameName: string;
  gameSlug: string;
  resolution: string;
  quality: GraphicsQuality;
  avgFps: number;
  /** Always true — UI must label results as estimates. */
  isEstimate: true;
  source: string | null;
};

export type EstimatePerformanceResult = {
  estimates: PerformanceEstimate[];
  /** True when no benchmark rows matched the CPU/GPU (and optional filters). */
  missing: boolean;
  message: string | null;
};

export type MappedGame = {
  id: string;
  name: string;
  slug: string;
  coverUrl: string | null;
};

export type ShowcaseFrame = {
  gameName: string;
  resolution: string;
  quality: GraphicsQuality;
  avgFps: number;
};

export type HomepagePerformanceShowcase = {
  cpuName: string;
  gpuName: string;
  cpuSlug: string;
  gpuSlug: string;
  buildSlug: string | null;
  gameName: string;
  frames: ShowcaseFrame[];
};

const RESOLUTION_RANK: Record<string, number> = {
  '1080p': 0,
  '1440p': 1,
  '4K': 2,
  '2160p': 2,
};

const QUALITY_RANK: Record<GraphicsQuality, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  ULTRA: 4,
};

/** Pick one game (most samples) and one row per resolution, preferring higher quality. */
export function toShowcaseFrames(
  estimates: PerformanceEstimate[],
): ShowcaseFrame[] {
  if (estimates.length === 0) return [];

  const counts = new Map<string, number>();
  for (const row of estimates) {
    counts.set(row.gameId, (counts.get(row.gameId) ?? 0) + 1);
  }

  let bestGameId = estimates[0]!.gameId;
  let bestCount = 0;
  for (const [id, n] of counts) {
    if (n > bestCount) {
      bestGameId = id;
      bestCount = n;
    }
  }

  const byResolution = new Map<string, PerformanceEstimate>();
  for (const row of estimates) {
    if (row.gameId !== bestGameId) continue;
    const existing = byResolution.get(row.resolution);
    if (
      !existing ||
      QUALITY_RANK[row.quality] > QUALITY_RANK[existing.quality]
    ) {
      byResolution.set(row.resolution, row);
    }
  }

  return [...byResolution.values()]
    .sort((a, b) => {
      const ra = RESOLUTION_RANK[a.resolution] ?? 50;
      const rb = RESOLUTION_RANK[b.resolution] ?? 50;
      if (ra !== rb) return ra - rb;
      return a.resolution.localeCompare(b.resolution);
    })
    .map((row) => ({
      gameName: row.gameName,
      resolution: row.resolution,
      quality: row.quality,
      avgFps: row.avgFps,
    }));
}

/**
 * Look up seeded benchmark rows for a CPU + GPU pair.
 * Returns labeled estimates only — never invents FPS without data.
 */
export async function estimatePerformance(
  prisma: PrismaClient,
  input: EstimatePerformanceInput,
): Promise<EstimatePerformanceResult> {
  const [cpu, gpu] = await Promise.all([
    prisma.product.findFirst({
      where: { id: input.cpuProductId, status: 'ACTIVE', type: 'CPU' },
      select: { id: true },
    }),
    prisma.product.findFirst({
      where: { id: input.gpuProductId, status: 'ACTIVE', type: 'GPU' },
      select: { id: true },
    }),
  ]);

  if (!cpu) {
    throw new NotFoundError('CPU product not found.', {
      cpuProductId: input.cpuProductId,
    });
  }
  if (!gpu) {
    throw new NotFoundError('GPU product not found.', {
      gpuProductId: input.gpuProductId,
    });
  }

  let gameId = input.gameId;
  if (input.gameSlug) {
    const game = await prisma.game.findUnique({ where: { slug: input.gameSlug } });
    if (!game) {
      throw new NotFoundError('Game not found.', { gameSlug: input.gameSlug });
    }
    gameId = game.id;
  }

  const rows = await prisma.benchmark.findMany({
    where: {
      cpuProductId: input.cpuProductId,
      gpuProductId: input.gpuProductId,
      ...(gameId ? { gameId } : {}),
      ...(input.resolution ? { resolution: input.resolution } : {}),
      ...(input.quality ? { quality: input.quality } : {}),
    },
    include: { game: true },
    orderBy: [{ game: { name: 'asc' } }, { resolution: 'asc' }, { quality: 'asc' }],
  });

  if (rows.length === 0) {
    return {
      estimates: [],
      missing: true,
      message:
        'No benchmark data for this CPU/GPU combination yet. Estimates appear when samples are available.',
    };
  }

  return {
    estimates: rows.map((row) => ({
      gameId: row.gameId,
      gameName: row.game.name,
      gameSlug: row.game.slug,
      resolution: row.resolution,
      quality: row.quality,
      avgFps: Number(row.avgFps.toString()),
      isEstimate: true as const,
      source: row.source,
    })),
    missing: false,
    message: null,
  };
}

export async function listGames(prisma: PrismaClient): Promise<MappedGame[]> {
  const rows = await prisma.game.findMany({
    orderBy: { name: 'asc' },
  });
  return rows.map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    coverUrl: g.coverUrl,
  }));
}

/**
 * Homepage FPS strip from seeded benchmark rows.
 * Returns null when catalog/benchmarks are empty — never invents FPS.
 */
export async function getHomepagePerformanceShowcase(
  prisma: PrismaClient,
): Promise<HomepagePerformanceShowcase | null> {
  const sample = await prisma.benchmark.findFirst({
    orderBy: { avgFps: 'desc' },
    select: { cpuProductId: true, gpuProductId: true },
  });
  if (!sample) return null;

  const [cpu, gpu, result, build] = await Promise.all([
    prisma.product.findFirst({
      where: {
        id: sample.cpuProductId,
        status: 'ACTIVE',
        type: 'CPU',
      },
      select: { name: true, slug: true },
    }),
    prisma.product.findFirst({
      where: {
        id: sample.gpuProductId,
        status: 'ACTIVE',
        type: 'GPU',
      },
      select: { name: true, slug: true },
    }),
    estimatePerformance(prisma, {
      cpuProductId: sample.cpuProductId,
      gpuProductId: sample.gpuProductId,
    }),
    prisma.pCBuild.findFirst({
      where: {
        visibility: 'PUBLIC',
        AND: [
          { items: { some: { productId: sample.cpuProductId } } },
          { items: { some: { productId: sample.gpuProductId } } },
        ],
      },
      select: { slug: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!cpu || !gpu || result.missing) return null;

  const frames = toShowcaseFrames(result.estimates);
  if (frames.length === 0) return null;

  return {
    cpuName: cpu.name,
    gpuName: gpu.name,
    cpuSlug: cpu.slug,
    gpuSlug: gpu.slug,
    buildSlug: build?.slug ?? null,
    gameName: frames[0]!.gameName,
    frames,
  };
}
