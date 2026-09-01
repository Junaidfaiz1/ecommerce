import Link from 'next/link';
import { SectionHeader } from '@/components/shared/SectionStates';

const STEPS = [
  {
    n: '01',
    title: 'Choose parts',
    body: 'Pick CPU, GPU, and the rest of the nine slots in the builder — or start from the shop.',
  },
  {
    n: '02',
    title: 'Server checks',
    body: 'Socket, RAM, clearance, and PSU margin run on the server. Prices are recomputed there too.',
  },
  {
    n: '03',
    title: 'Checkout',
    body: 'Add a compatible build to cart. Stripe charges the server grand total — never a client figure.',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
      <SectionHeader
        eyebrow="Process"
        title="How it works"
        description="Three steps. Compatibility and prices never trust the browser."
        action={
          <Link
            href="/build"
            className="text-sm text-muted transition-colors hover:text-sage"
          >
            Open builder →
          </Link>
        }
      />
      <ol className="rounded-[2rem] glass-panel px-5 py-2 sm:px-6 md:grid md:grid-cols-3 md:divide-x md:divide-white/10 md:px-0 md:py-2">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="border-b border-white/10 py-7 last:border-b-0 md:border-b-0 md:px-8 md:py-10"
          >
            <p className="font-mono text-[11px] tracking-[0.22em] text-sage">
              {step.n}
            </p>
            <h3 className="mt-3 font-display text-xl tracking-tight md:text-2xl">
              {step.title}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted md:text-[15px]">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
