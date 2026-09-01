import type { ApiHealth } from '@vorqen/types';
import { logger } from '../common/logger';

export async function getHealth(): Promise<ApiHealth> {
  let status: ApiHealth['status'] = 'ok';
  let database: ApiHealth['database'] = 'up';

  try {
    const { prisma } = await import('../common/prisma');
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    status = 'degraded';
    database = 'down';
    logger.warn('Health check: database unreachable', {
      error: error instanceof Error ? error.message : 'unknown',
    });
  }

  return {
    status,
    service: 'vorqen',
    timestamp: new Date().toISOString(),
    database,
  };
}
