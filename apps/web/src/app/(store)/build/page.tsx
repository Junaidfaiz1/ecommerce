import { Suspense } from 'react';
import { BuilderPageClient } from '@/features/builder/BuilderPageClient';
import { BuilderSkeleton } from '@/features/builder/components/BuilderSkeleton';
import { publicPageMetadata } from '@/server/seo';

export const metadata = publicPageMetadata({
  title: 'PC Builder',
  description:
    'Configure a gaming PC slot by slot — live server pricing and compatibility checks.',
  path: '/build',
});

export default function BuildPage() {
  return (
    <main>
      <Suspense
        fallback={<BuilderSkeleton />}
      >
        <BuilderPageClient />
      </Suspense>
    </main>
  );
}
