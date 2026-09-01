'use client';

import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import { ThreeDBudgetContext, useThreeDBudget } from './useThreeDBudget';
import { cn } from '@/lib/utils';

export type SceneCanvasProps = {
  children: ReactNode;
  className?: string;
  /** Auto-rotate the camera orbit (pausable via enable). */
  autoRotate?: boolean;
  cameraPosition?: [number, number, number];
  /** Disable orbit on reduced-motion preference callers. */
  enableControls?: boolean;
};

/**
 * Shared R3F canvas — lights, optional HDRI, orbit.
 * Always load via next/dynamic ssr:false from parent wrappers.
 * Off-screen / hidden tabs drop to `frameloop="demand"`.
 */
export function SceneCanvas({
  children,
  className,
  autoRotate = false,
  cameraPosition = [2.2, 1.4, 2.6],
  enableControls = true,
}: SceneCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const budget = useThreeDBudget(hostRef);
  const spin = autoRotate && !budget.paused && budget.frameloop === 'always';

  return (
    <div ref={hostRef} className={cn('h-full min-h-[220px] w-full', className)}>
      <Canvas
          className="h-full w-full"
          dpr={budget.dpr}
          frameloop={budget.frameloop}
          camera={{ position: cameraPosition, fov: 42, near: 0.1, far: 40 }}
          gl={{
            antialias: budget.antialias,
            alpha: true,
            powerPreference: budget.powerPreference,
            stencil: false,
            depth: true,
          }}
          style={{ touchAction: 'none' }}
        >
          <ThreeDBudgetContext.Provider value={budget}>
            <color attach="background" args={['#0a0b0d']} />
            <ambientLight intensity={0.35} />
            <directionalLight
              position={[4, 6, 3]}
              intensity={1.15}
              castShadow={budget.shadows}
              shadow-mapSize={[budget.shadowMapSize, budget.shadowMapSize]}
            />
            <directionalLight position={[-3, 2, -2]} intensity={0.35} />
            {budget.environment ? (
              <Environment preset="city" environmentIntensity={0.35} />
            ) : null}
            {children}
            {budget.shadows ? (
              <ContactShadows
                position={[0, -0.85, 0]}
                opacity={0.45}
                scale={8}
                blur={2.4}
                far={4}
              />
            ) : null}
            {enableControls ? (
              <OrbitControls
                makeDefault
                enablePan={false}
                minDistance={1.6}
                maxDistance={6}
                maxPolarAngle={Math.PI / 1.85}
                autoRotate={spin}
                autoRotateSpeed={0.55}
              />
            ) : null}
          </ThreeDBudgetContext.Provider>
        </Canvas>
    </div>
  );
}
