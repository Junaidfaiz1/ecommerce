'use client';

import { useEffect } from 'react';
import { useCompareStore } from './store';

/** Sync URL `ids` into the compare tray when present. */
export function CompareClientSync({ ids }: { ids: string[] }) {
  const setIds = useCompareStore((s) => s.setIds);

  useEffect(() => {
    if (ids.length > 0) setIds(ids);
  }, [ids, setIds]);

  return null;
}
