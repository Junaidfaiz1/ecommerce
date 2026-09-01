'use client';

import { createLazyCanvas } from '@/components/3d/createLazyCanvas';
import type { HeroPcCanvasProps } from './HeroPcCanvas';

export const HeroPcViewer = createLazyCanvas<HeroPcCanvasProps>(
  () => import(/* webpackChunkName: "vorqen-3d-hero" */ './HeroPcCanvas'),
);
