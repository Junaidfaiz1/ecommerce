import type { CatalogProduct } from '@/server/catalog/catalog.mappers';

function rowsFor(product: CatalogProduct): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ['Brand', product.brand.name],
    ['Category', product.category.name],
    ['Type', product.type],
  ];

  if (product.cpu) {
    const c = product.cpu;
    rows.push(
      ['Socket', c.socket],
      ['Cores / Threads', `${c.cores} / ${c.threads}`],
      ['Base / Boost GHz', `${c.baseClockGhz} / ${c.boostClockGhz}`],
      ['TDP', `${c.tdpWatts} W`],
      ['Memory', c.memoryType],
      ['iGPU', c.hasIntegratedGpu ? 'Yes' : 'No'],
    );
  }
  if (product.gpu) {
    const g = product.gpu;
    rows.push(
      ['Chipset', g.chipset],
      ['VRAM', `${g.vramGb} GB`],
      ['Length', `${g.lengthMm} mm`],
      ['TDP', `${g.tdpWatts} W`],
      ['Bus', g.interfaceBus],
      ['Power', g.powerConnectors],
    );
  }
  if (product.motherboard) {
    const m = product.motherboard;
    rows.push(
      ['Socket', m.socket],
      ['Chipset', m.chipset],
      ['Form factor', m.formFactor],
      ['Memory', `${m.memoryType} · ${m.memorySlots} slots · ${m.maxMemoryGb} GB`],
      ['M.2 / SATA', `${m.m2Slots} / ${m.sataPorts}`],
      ['Wi‑Fi', m.wifi ? 'Yes' : 'No'],
    );
  }
  if (product.ram) {
    const r = product.ram;
    rows.push(
      ['Type', r.memoryType],
      ['Capacity', `${r.capacityGb} GB (${r.modules} modules)`],
      ['Speed', `${r.speedMhz} MHz`],
    );
  }
  if (product.storage) {
    const s = product.storage;
    rows.push(
      ['Interface', s.interface],
      ['Capacity', `${s.capacityGb} GB`],
      ['Form factor', s.formFactor],
    );
  }
  if (product.psu) {
    const p = product.psu;
    rows.push(
      ['Wattage', `${p.wattage} W`],
      ['Efficiency', p.efficiency],
      ['Modular', p.modular],
      ['Form factor', p.formFactor],
    );
  }
  if (product.pcCase) {
    const c = product.pcCase;
    rows.push(
      ['Form factors', c.supportedFormFactors.join(', ')],
      ['Max GPU length', `${c.maxGpuLengthMm} mm`],
      ['Max cooler height', `${c.maxCoolerHeightMm} mm`],
      ['PSU', c.psuFormFactor],
    );
  }
  if (product.cooler) {
    const c = product.cooler;
    rows.push(
      ['Type', c.coolerType],
      ['Sockets', c.supportedSockets.join(', ')],
      ...(c.heightMm ? ([['Height', `${c.heightMm} mm`]] as Array<[string, string]>) : []),
      ...(c.radiatorMm
        ? ([['Radiator', `${c.radiatorMm} mm`]] as Array<[string, string]>)
        : []),
    );
  }

  return rows;
}

export function SpecTable({ product }: { product: CatalogProduct }) {
  const rows = rowsFor(product);
  return (
    <dl className="divide-y divide-border border border-border">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-2 gap-4 px-4 py-3 text-sm md:grid-cols-3"
        >
          <dt className="font-mono text-xs tracking-wide text-muted uppercase">
            {label}
          </dt>
          <dd className="md:col-span-2 text-foreground/90">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
