'use client';

import { useEffect, useRef, useState } from 'react';

/** Smooth 0→1 explode factor driven by a boolean toggle. */
export function useExplodeAmount(explode: boolean): number {
  const [amount, setAmount] = useState(explode ? 1 : 0);
  const amountRef = useRef(amount);

  useEffect(() => {
    let raf = 0;
    const target = explode ? 1 : 0;
    const step = () => {
      const next = amountRef.current + (target - amountRef.current) * 0.12;
      const settled = Math.abs(next - target) < 0.004;
      amountRef.current = settled ? target : next;
      setAmount(amountRef.current);
      if (!settled) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [explode]);

  return amount;
}
