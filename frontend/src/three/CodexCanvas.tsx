import { Component, Suspense, useMemo, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, OrbitControls, Preload } from '@react-three/drei';
import { QuantumCodex } from './QuantumCodex';
import { ChunkNodes } from './ChunkNodes';
import { IngestStream, ScanBeam } from './Ingestion';
import { SCENE } from './palette';
import { useAppStore } from '@/store/useAppStore';

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl')),
    );
  } catch {
    return false;
  }
}

/** A lost WebGL context must degrade to a still frame, never take the chat down with it. */
class CanvasBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function StaticCodex() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative h-56 w-56">
        <div className="absolute inset-0 animate-[spin_18s_linear_infinite] rounded-full border border-gold-400/30" />
        <div className="absolute inset-6 animate-[spin_12s_linear_infinite_reverse] rounded-full border border-champagne-300/25" />
        <div className="absolute inset-16 rounded-full bg-gold-500/25 blur-2xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="max-w-[12rem] text-center text-xs text-ink-400">
            3D rendering is unavailable in this browser. The pipeline still works.
          </p>
        </div>
      </div>
    </div>
  );
}

export function CodexCanvas() {
  const activity = useAppStore((state) => state.activity);
  const documents = useAppStore((state) => state.documents);
  const lastCitations = useAppStore((state) => state.lastCitations);
  const activeChunkCount = useAppStore((state) => state.activeChunkCount);
  const activeCitation = useAppStore((state) => state.activeCitation);
  const isInspectorOpen = useAppStore((state) => state.isInspectorOpen);
  const openCitation = useAppStore((state) => state.openCitation);

  const webglAvailable = useMemo(supportsWebGL, []);
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  if (!webglAvailable) return <StaticCodex />;

  const activeChunkId = isInspectorOpen && activeCitation ? activeCitation.chunk_id : null;

  return (
    <CanvasBoundary fallback={<StaticCodex />}>
      <Canvas
        camera={{ position: [0, 0.15, 5.0], fov: 44 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        className="!absolute inset-0"
      >
        {/* No background colour: the page's warm titanium ambience shows through. */}
        <fog attach="fog" args={[SCENE.titanium, 7.5, 17]} />

        <ambientLight intensity={0.4} />
        <pointLight position={[4, 3, 5]} intensity={30} color={SCENE.gold} distance={22} />
        <pointLight position={[-5, -2, 3]} intensity={20} color={SCENE.amber} distance={20} />
        <pointLight position={[0, 0, 0]} intensity={14} color={SCENE.champagne} distance={6} />
        <directionalLight position={[0, 6, 4]} intensity={1.2} color={SCENE.ivory} />

        <Suspense fallback={null}>
          <QuantumCodex activity={activity} documents={documents} />
          <ChunkNodes
            activity={activity}
            citations={lastCitations}
            placeholderCount={activeChunkCount}
            activeChunkId={activeChunkId}
            onSelect={openCitation}
          />
          <ScanBeam active={activity === 'ingesting'} />
          <IngestStream active={activity === 'ingesting'} />
          <Preload all />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={2.4}
          maxDistance={10}
          autoRotate={!reducedMotion && activity === 'idle'}
          autoRotateSpeed={0.35}
          rotateSpeed={0.55}
          dampingFactor={0.06}
          enableDamping
        />
        <AdaptiveDpr pixelated />
      </Canvas>
    </CanvasBoundary>
  );
}
