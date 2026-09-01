import { create } from 'zustand';
import {
  BUILDER_STEPS,
  type BuilderStep,
  type BuildComponentInput,
  type ComponentSlot,
  isComponentSlot,
} from '@vorqen/types';

export type DraftPart = {
  slot: ComponentSlot;
  productId: string;
  variantId?: string;
  quantity: number;
  productName: string;
  brandName: string;
  imageUrl: string | null;
  /** Display-only cache; live total always from previewBuild. */
  unitPrice: string | null;
};

type BuilderStore = {
  step: BuilderStep;
  buildId: string | null;
  buildName: string;
  parts: DraftPart[];
  setStep: (step: BuilderStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  selectPart: (part: DraftPart) => void;
  removePart: (slot: ComponentSlot, productId: string) => void;
  clearSlot: (slot: ComponentSlot) => void;
  setQuantity: (slot: ComponentSlot, productId: string, quantity: number) => void;
  setBuildName: (name: string) => void;
  loadDraft: (args: {
    buildId: string | null;
    buildName: string;
    parts: DraftPart[];
  }) => void;
  reset: () => void;
  toComponents: () => BuildComponentInput[];
  partForSlot: (slot: ComponentSlot) => DraftPart | undefined;
  partsForSlot: (slot: ComponentSlot) => DraftPart[];
};

const MULTI: ReadonlySet<ComponentSlot> = new Set(['RAM', 'STORAGE']);

export function stepIndex(step: BuilderStep): number {
  return BUILDER_STEPS.indexOf(step);
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  step: 'CPU',
  buildId: null,
  buildName: 'Untitled build',
  parts: [],

  setStep: (step) => set({ step }),

  nextStep: () => {
    const idx = stepIndex(get().step);
    const next = BUILDER_STEPS[Math.min(idx + 1, BUILDER_STEPS.length - 1)];
    if (next) set({ step: next });
  },

  prevStep: () => {
    const idx = stepIndex(get().step);
    const prev = BUILDER_STEPS[Math.max(idx - 1, 0)];
    if (prev) set({ step: prev });
  },

  selectPart: (part) =>
    set((state) => {
      if (MULTI.has(part.slot)) {
        const others = state.parts.filter(
          (p) => !(p.slot === part.slot && p.productId === part.productId),
        );
        return { parts: [...others, part] };
      }
      return {
        parts: [...state.parts.filter((p) => p.slot !== part.slot), part],
      };
    }),

  removePart: (slot, productId) =>
    set((state) => ({
      parts: state.parts.filter(
        (p) => !(p.slot === slot && p.productId === productId),
      ),
    })),

  clearSlot: (slot) =>
    set((state) => ({
      parts: state.parts.filter((p) => p.slot !== slot),
    })),

  setQuantity: (slot, productId, quantity) =>
    set((state) => ({
      parts: state.parts.map((p) =>
        p.slot === slot && p.productId === productId
          ? { ...p, quantity: Math.min(16, Math.max(1, quantity)) }
          : p,
      ),
    })),

  setBuildName: (buildName) => set({ buildName }),

  loadDraft: ({ buildId, buildName, parts }) =>
    set({ buildId, buildName, parts, step: 'REVIEW' }),

  reset: () =>
    set({
      step: 'CPU',
      buildId: null,
      buildName: 'Untitled build',
      parts: [],
    }),

  toComponents: () =>
    get().parts.map(({ slot, productId, variantId, quantity }) => ({
      slot,
      productId,
      variantId,
      quantity,
    })),

  partForSlot: (slot) => get().parts.find((p) => p.slot === slot),

  partsForSlot: (slot) => get().parts.filter((p) => p.slot === slot),
}));

export function slotLabel(slot: ComponentSlot | 'REVIEW'): string {
  switch (slot) {
    case 'CPU':
      return 'CPU';
    case 'GPU':
      return 'GPU';
    case 'MOTHERBOARD':
      return 'Motherboard';
    case 'RAM':
      return 'Memory';
    case 'STORAGE':
      return 'Storage';
    case 'PSU':
      return 'Power supply';
    case 'CASE':
      return 'Case';
    case 'COOLER':
      return 'Cooling';
    case 'REVIEW':
      return 'Review';
    default:
      return slot;
  }
}

export function isBuilderStep(value: string): value is BuilderStep {
  return (BUILDER_STEPS as readonly string[]).includes(value);
}

export { isComponentSlot, BUILDER_STEPS };
