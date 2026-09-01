'use client';

import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { ReactNode } from 'react';

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
 * Shared R3F canvas — lights, soft environment, orbit.
 * Always load via next/dynamic ssr:false from parent wrappers.
 */
export function SceneCanvas({
  children,
  className,
  autoRotate = false,
  cameraPosition = [2.2, 1.4, 2.6],
  enableControls = true,
}: SceneCanvasProps) {
  return (
    <Canvas
      className={className}
      dpr={[1, 1.75]}
      camera={{ position: cameraPosition, fov: 42, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'none' }}
    >
      <color attach="background" args={['#0a0b0d']} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.15}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <Environment preset="city" environmentIntensity={0.35} />
      {children}
      <ContactShadows
        position={[0, -0.85, 0]}
        opacity={0.45}
        scale={8}
        blur={2.4}
        far={4}
      />
      {enableControls ? (
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={1.6}
          maxDistance={6}
          maxPolarAngle={Math.PI / 1.85}
          autoRotate={autoRotate}
          autoRotateSpeed={0.55}
        />
      ) : null}
    </Canvas>
  );
}
