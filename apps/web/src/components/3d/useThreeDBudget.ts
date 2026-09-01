'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from 'react';
import {
  resolveThreeDBudget,
  type ThreeDBudget,
} from '@vorqen/types';

export const ThreeDBudgetContext = createContext<ThreeDBudget>(
  resolveThreeDBudget(),
);

export function useThreeDBudgetValue(): ThreeDBudget {
  return useContext(ThreeDBudgetContext);
}

type NetworkConnection = {
  saveData?: boolean;
};

function readSaveData(): boolean {
  if (typeof navigator === 'undefined') return false;
  const connection = (
    navigator as Navigator & { connection?: NetworkConnection }
  ).connection;
  return Boolean(connection?.saveData);
}

/**
 * Viewport / motion / battery-style flags → 3D budget.
 * Pauses the R3F loop when the canvas is off-screen or the tab is hidden.
 */
export function useThreeDBudget(
  hostRef: RefObject<HTMLElement | null>,
): ThreeDBudget {
  const [inViewport, setInViewport] = useState(true);
  const [documentHidden, setDocumentHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [narrowViewport, setNarrowViewport] = useState(false);
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInViewport(Boolean(entry?.isIntersecting));
      },
      { rootMargin: '80px', threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hostRef]);

  useEffect(() => {
    const onVisibility = () => setDocumentHidden(document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = window.matchMedia('(max-width: 767px)');
    const sync = () => {
      setReducedMotion(motion.matches);
      setNarrowViewport(narrow.matches);
      setSaveData(readSaveData());
    };
    sync();
    motion.addEventListener('change', sync);
    narrow.addEventListener('change', sync);
    return () => {
      motion.removeEventListener('change', sync);
      narrow.removeEventListener('change', sync);
    };
  }, []);

  return useMemo(
    () =>
      resolveThreeDBudget({
        inViewport,
        documentHidden,
        reducedMotion,
        narrowViewport,
        saveData,
      }),
    [inViewport, documentHidden, reducedMotion, narrowViewport, saveData],
  );
}
