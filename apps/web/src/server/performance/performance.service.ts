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
