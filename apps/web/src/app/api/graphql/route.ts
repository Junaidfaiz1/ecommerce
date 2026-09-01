import type { NextRequest } from 'next/server';
import { getYoga } from '@/server/graphql/yoga';

export const dynamic = 'force-dynamic';

const yoga = getYoga();

export async function GET(request: NextRequest) {
  return yoga.fetch(request);
}

export async function POST(request: NextRequest) {
  return yoga.fetch(request);
}

export async function OPTIONS(request: NextRequest) {
  return yoga.fetch(request);
}
