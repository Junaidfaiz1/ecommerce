import { NextResponse } from 'next/server';
import { getHealth } from '@/server/health/health.service';

export async function GET() {
  const health = await getHealth();
  const httpStatus = health.status === 'down' ? 503 : 200;
  return NextResponse.json(health, { status: httpStatus });
}
