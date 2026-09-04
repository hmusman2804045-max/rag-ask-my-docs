import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { createGlowTexture } from './textures';
import { SCENE } from './palette';
import { formatPercent, truncateMiddle } from '@/lib/utils';
import type { Citation, CodexActivity } from '@/types';

const UP = new THREE.Vector3(0, 1, 0);

/** Deterministic spread so the same answer always detangles its chunks the same way. */
function nodeDirection(index: number, total: number): THREE.Vector3 {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 + index * 0.35;
  const lift = Math.sin(index * 1.7) * 0.55;
  return new THREE.Vector3(Math.cos(angle), lift, Math.sin(angle)).normalize();
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

interface ChunkNodeProps {
  citation: Citation | null;
  index: number;
  total: number;
  spawnRef: MutableRefObject<number>;
  isActive: boolean;
  onSelect: (citation: Citation) => void;
}

function ChunkNode({ citation, index, total, spawnRef, isActive, onSelect }: ChunkNodeProps) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Sprite>(null);
  const tether = useRef<THREE.Mesh>(null);

  const glow = useMemo(() => createGlowTexture(), []);
  const direction = useMemo(() => nodeDirection(index, total), [index, total]);

  // Stronger matches settle closer to the codex, weaker ones drift further out.
  const distance = useMemo(() => {
    const score = citation?.similarity_score ?? 0.5;
    return 2.05 + (1 - Math.max(0, Math.min(1, score))) * 1.15;
  }, [citation]);

  useFrame((state) => {
    if (!group.current) return;

    const age = state.clock.elapsedTime - spawnRef.current;
    const travel = easeOutBack(Math.min(1, Math.max(0, age / 0.9)));
    const radius = 0.45 + (distance - 0.45) * travel;
    const drift = Math.sin(state.clock.elapsedTime * 1.1 + index) * 0.06;

    group.current.position.copy(direction).multiplyScalar(radius);
    group.current.position.y += drift;

    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3.4 + index * 0.8) * 0.12;
    const scale = (isActive ? 1.75 : 1) * pulse * Math.min(1, age / 0.35);
    group.current.scale.setScalar(Math.max(0.001, scale));

    if (halo.current) {
      halo.current.scale.setScalar((isActive ? 1.5 : 1) * (0.85 + Math.sin(state.clock.elapsedTime * 2.6 + index) * 0.12));
    }
    if (core.current) {
      core.current.rotation.x += 0.01;
      core.current.rotation.y += 0.015;
    }

    // The tether is redrawn every frame from the codex core out to this node.
    // Its transform is divided by the node scale, which children would otherwise inherit.
    if (tether.current) {
      const end = group.current.position;
      const length = end.length();
      const nodeScale = Math.max(0.001, group.current.scale.x);
      tether.current.position.copy(end).multiplyScalar(-0.5 / nodeScale);
      tether.current.scale.set(1, length / nodeScale, 1);
      tether.current.quaternion.setFromUnitVectors(UP, end.clone().normalize());
    }
  });

  return (
    <group ref={group}>
      <mesh ref={tether}>
        <cylinderGeometry args={[0.004, 0.012, 1, 6, 1, true]} />
        <meshBasicMaterial
          color={isActive ? SCENE.champagne : SCENE.gold}
          transparent
          opacity={isActive ? 0.55 : 0.28}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <sprite ref={halo} scale={0.9}>
        <spriteMaterial
          map={glow}
          color={isActive ? SCENE.champagne : SCENE.gold}
          transparent
          opacity={isActive ? 0.85 : 0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      <mesh
        ref={core}
        onClick={(event) => {
          if (!citation) return;
          event.stopPropagation();
          onSelect(citation);
        }}
        onPointerOver={(event) => {
          if (!citation) return;
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <octahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial
          color={isActive ? SCENE.champagne : SCENE.gold}
          emissive={isActive ? SCENE.champagne : SCENE.gold}
          emissiveIntensity={isActive ? 3.2 : 1.6}
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>

      {isActive && citation && (
        <Html center distanceFactor={8} zIndexRange={[20, 0]}>
          <div className="pointer-events-none -translate-y-12 whitespace-nowrap rounded-lg border border-champagne-300/50 bg-titanium-900/90 px-3 py-2 text-[11px] shadow-gold backdrop-blur-xl">
            <p className="font-medium text-champagne-300">
              {truncateMiddle(citation.doc_name, 24)}
            </p>
            <p className="mt-0.5 text-data text-[10px] text-ink-400">
              {formatPercent(citation.similarity_score)} match
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

interface ChunkNodesProps {
  activity: CodexActivity;
  citations: Citation[];
  placeholderCount: number;
  activeChunkId: string | null;
  onSelect: (citation: Citation) => void;
}

/**
 * The retrieval metaphor: chunk nodes detangle from the codex whenever the
 * pipeline pulls context out of Chroma, and stay pinned while a citation is inspected.
 */
export function ChunkNodes({
  activity,
  citations,
  placeholderCount,
  activeChunkId,
  onSelect,
}: ChunkNodesProps) {
  const group = useRef<THREE.Group>(null);
  const spawnedAt = useRef(0);
  const needsRespawn = useRef(false);

  const nodes = useMemo<(Citation | null)[]>(() => {
    if (citations.length > 0) return citations;
    return Array.from({ length: Math.max(1, placeholderCount) }, () => null);
  }, [citations, placeholderCount]);

  const visible = activity === 'retrieving' || activeChunkId !== null;

  // Real citations replacing the search placeholders should fly out again, not pop into place.
  useEffect(() => {
    needsRespawn.current = true;
  }, [nodes]);

  useFrame((state, delta) => {
    if (!group.current) return;

    if (visible && (spawnedAt.current === 0 || needsRespawn.current)) {
      spawnedAt.current = state.clock.elapsedTime;
      needsRespawn.current = false;
    }
    if (!visible && spawnedAt.current !== 0) spawnedAt.current = 0;

    group.current.rotation.y += delta * 0.08;

    const target = visible ? 1 : 0;
    const current = group.current.scale.x;
    const next = THREE.MathUtils.lerp(current, target, 0.08);
    group.current.scale.setScalar(next);
    group.current.visible = next > 0.01;
  });

  return (
    <group ref={group} scale={0}>
      {nodes.map((citation, index) => (
        <ChunkNode
          key={citation?.chunk_id ?? `pending_${index}`}
          citation={citation}
          index={index}
          total={nodes.length}
          spawnRef={spawnedAt}
          isActive={Boolean(citation && activeChunkId === citation.chunk_id)}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}
