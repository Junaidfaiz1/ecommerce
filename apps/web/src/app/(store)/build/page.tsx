import { Suspense } from 'react';
import { BuilderPageClient } from '@/features/builder/BuilderPageClient';
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
        fallback={
          <p className="mx-auto max-w-[1360px] px-4 py-16 text-sm text-muted md:px-10">
            Loading builder…
          </p>
        }
      >
        <BuilderPageClient />
      </Suspense>
    </main>
  );
}
