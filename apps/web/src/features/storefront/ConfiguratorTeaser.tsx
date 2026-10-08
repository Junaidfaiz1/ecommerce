import Link from 'next/link';
import { COMPONENT_SLOTS, type ComponentSlot } from '@vorqen/types';
import { SectionHeader, sectionLinkClass } from '@/components/shared/SectionStates';

const SLOT_COPY: Record<ComponentSlot, { label: string; hint: string }> = {
  CPU: { label: 'Processor', hint: 'Socket sets the platform' },
  MOTHERBOARD: { label: 'Motherboard', hint: 'Form factor + memory type' },
  RAM: { label: 'Memory', hint: 'DDR generation must match' },
  GPU: { label: 'Graphics', hint: 'Length vs. case clearance' },
  STORAGE: { label: 'Storage', hint: 'NVMe and SATA' },
  PSU: { label: 'Power', hint: 'Wattage margin over draw' },
  CASE: { label: 'Case', hint: 'Board and GPU must fit' },
  COOLER: { label: 'Cooling', hint: 'Socket + TDP rating' },
};

/** The server-side compatibility rules, in plain language. */
export const COMPATIBILITY_CHECKS = [
  'CPU ↔ motherboard socket',
  'RAM ↔ motherboard memory type',
  'GPU ↔ case clearance',
  'PSU wattage margin',
  'Cooler ↔ CPU socket',
  'Motherboard ↔ case form factor',
] as const;

/**
 * Homepage configurator teaser — the eight slots as a spec sheet beside the
 * checks the server runs on every change.
 */
export function ConfiguratorTeaser() {
  return (
    <section className="mx-auto max-w-[1360px] px-4 pt-24 md:px-10 md:pt-32">
      <SectionHeader
        index="01"
        eyebrow="Configurator"
        title="Configure it like a car, not a catalog."
        action={
          <Link
            href="/build"
            className="inline-flex h-12 items-center gap-2 self-start rounded-full border border-border-strong px-5 text-[15px] transition-colors hover:border-foreground md:self-auto"
          >
            Open the builder <span aria-hidden>→</span>
          </Link>
        }
      />
      <div className="flex flex-wrap overflow-hidden rounded-md border border-border">
        <ol className="min-w-0 flex-[999_1_560px]">
          {COMPONENT_SLOTS.map((slot, i) => (
            <li
              key={slot}
              className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-4 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[48px_150px_minmax(0,1fr)] md:px-6"
            >
              <span className="font-mono text-xs text-subtle">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="label-mono">{SLOT_COPY[slot].label}</span>
              <span className="col-start-2 text-[15px] text-muted sm:col-start-auto">
                {SLOT_COPY[slot].hint}
              </span>
            </li>
          ))}
        </ol>
        <aside className="flex flex-[1_1_320px] flex-col gap-6 border-t border-border bg-surface p-6 md:p-7 lg:border-t-0 lg:border-l">
          <p className="label-mono">Checked on the server</p>
          <ul className="flex flex-col gap-3 text-sm">
            {COMPATIBILITY_CHECKS.map((check) => (
              <li key={check} className="flex items-center gap-2.5 text-foreground/85">
                <svg
                  aria-hidden
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 text-pass"
                >
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                {check}
              </li>
            ))}
          </ul>
          <p className="mt-auto text-sm text-muted">
            Totals and stock are recomputed server-side — a client-side green
            check is never trusted.
          </p>
          <Link href="/build" className={sectionLinkClass}>
            Start with a processor
          </Link>
        </aside>
      </div>
    </section>
  );
}
