'use client';

import { createLazyCanvas } from '@/components/3d/createLazyCanvas';
import type { ProductViewerCanvasProps } from './ProductViewerCanvas';

export const Product3DViewer = createLazyCanvas<ProductViewerCanvasProps>(
  () => import(/* webpackChunkName: "vorqen-3d-pdp" */ './ProductViewerCanvas'),
);
