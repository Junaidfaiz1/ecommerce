'use client';

import { createLazyCanvas } from '@/components/3d/createLazyCanvas';
import type { BuilderPcCanvasProps } from './BuilderPcCanvas';

export const BuilderPcViewer = createLazyCanvas<BuilderPcCanvasProps>(
  () => import(/* webpackChunkName: "vorqen-3d-builder" */ './BuilderPcCanvas'),
);
