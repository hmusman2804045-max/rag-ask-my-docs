import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html, Point, PointMaterial, Points } from '@react-three/drei';
import * as THREE from 'three';
import { createGlowTexture, fibonacciSphere } from './textures';
import { SCENE } from './palette';
import type { CodexActivity, IndexedDocument } from '@/types';

/** Concentric golden rings — the outer shell of the codex. */
const RINGS: {
  radius: number;
  tube: number;
  tilt: [number, number, number];
  speed: number;
  color: string;
}[] = [
  { radius: 1.52, tube: 0.016, tilt: [Math.PI / 2.1, 0, 0], speed: 0.24, color: SCENE.gold },
  {
    radius: 1.88,
    tube: 0.012,
    tilt: [Math.PI / 2.6, Math.PI / 5, 0],
    speed: -0.17,
    color: SCENE.champagne,
  },
  {
    radius: 2.22,
    tube: 0.009,
    tilt: [Math.PI / 3.4, -Math.PI / 6, Math.PI / 8],
    speed: 0.11,
    color: SCENE.amber,
  },
];

function Core({ activity }: { activity: CodexActivity }) {
  const shell = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const lattice = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Sprite>(null);
  const bloom = useRef<THREE.Sprite>(null);
  const glow = useMemo(() => createGlowTexture('rgba(253,230,138,0.95)'), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    // Ingestion drives the core faster and brighter; retrieval gives it a slow, deliberate pulse.
    const spin = activity === 'ingesting' ? 0.55 : activity === 'retrieving' ? 0.3 : 0.14;

    if (shell.current) {
      shell.current.rotation.y += delta * spin;
      shell.current.rotation.x += delta * spin * 0.35;
    }
    if (inner.current) {
      inner.current.rotation.y -= delta * spin * 0.6;
      const pulse = 1 + Math.sin(t * (activity === 'idle' ? 1.2 : 2.6)) * 0.035;
      inner.current.scale.setScalar(pulse);
    }
    if (lattice.current) {
      lattice.current.rotation.y += delta * spin * 0.9;
      lattice.current.rotation.z -= delta * spin * 0.4;
    }
    if (halo.current) {
      const base = activity === 'idle' ? 3.0 : 3.6;
      halo.current.scale.setScalar(base + Math.sin(t * 1.8) * 0.2);
    }
    if (bloom.current) {
      const base = activity === 'idle' ? 7.5 : 8.8;
      bloom.current.scale.setScalar(base + Math.sin(t * 1.1) * 0.45);
    }
  });

  return (
    <group>
      <sprite ref={bloom} scale={5.5}>
        <spriteMaterial
          map={glow}
          color={SCENE.amber}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      <sprite ref={halo} scale={2.2}>
        <spriteMaterial
          map={glow}
          color={SCENE.gold}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Faceted amber core — lit metal, not a flat fill. */}
      <mesh ref={inner}>
        <icosahedronGeometry args={[0.52, 1]} />
        <meshStandardMaterial
          color="#8A3D07"
          emissive={SCENE.amber}
          emissiveIntensity={activity === 'idle' ? 0.5 : 1.15}
          roughness={0.28}
          metalness={0.95}
          flatShading
        />
      </mesh>

      {/* Inner champagne lattice, for depth between core and shell. */}
      <mesh ref={lattice}>
        <icosahedronGeometry args={[0.84, 1]} />
        <meshBasicMaterial
          color={SCENE.champagne}
          wireframe
          transparent
          opacity={activity === 'idle' ? 0.16 : 0.3}
        />
      </mesh>

      {/* Golden metallic wireframe shell. */}
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.18, 2]} />
        <meshStandardMaterial
          color={SCENE.gold}
          emissive={SCENE.gold}
          emissiveIntensity={activity === 'idle' ? 0.55 : 1.05}
          metalness={0.85}
          roughness={0.15}
          wireframe
          transparent
          opacity={activity === 'idle' ? 0.7 : 0.95}
        />
      </mesh>
    </group>
  );
}

function Rings({ activity }: { activity: CodexActivity }) {
  const group = useRef<THREE.Group>(null);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    const boost = activity === 'idle' ? 1 : 1.9;
    refs.current.forEach((mesh, index) => {
      if (!mesh) return;
      mesh.rotation.z += delta * RINGS[index].speed * boost;
    });
    if (group.current) group.current.rotation.y += delta * 0.05;
  });

  return (
    <group ref={group}>
      {RINGS.map((ring, index) => (
        <mesh
          key={ring.radius}
          ref={(mesh) => {
            refs.current[index] = mesh;
          }}
          rotation={ring.tilt}
        >
          <torusGeometry args={[ring.radius, ring.tube, 12, 160]} />
          <meshStandardMaterial
            color={ring.color}
            emissive={ring.color}
            emissiveIntensity={activity === 'idle' ? 0.8 : 1.4}
            metalness={0.85}
            roughness={0.15}
            transparent
            opacity={activity === 'idle' ? 0.8 : 1}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Orbiting field of golden dust — the embedding space around the codex. */
function GoldDust({ count = 700 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const sprite = useMemo(() => createGlowTexture(), []);

  const { positions, colors } = useMemo(() => {
    const positionArray = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);
    const gold = new THREE.Color(SCENE.gold);
    const champagne = new THREE.Color(SCENE.champagne);

    for (let i = 0; i < count; i += 1) {
      const radius = 2.5 + Math.random() * 2.3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positionArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positionArray[i * 3 + 1] = radius * Math.cos(phi) * 0.7;
      positionArray[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const tone = Math.random() > 0.65 ? champagne : gold;
      const shade = 0.5 + Math.random() * 0.5;
      colorArray[i * 3] = tone.r * shade;
      colorArray[i * 3 + 1] = tone.g * shade;
      colorArray[i * 3 + 2] = tone.b * shade;
    }

    return { positions: positionArray, colors: colorArray };
  }, [count]);

  useFrame((state, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * 0.035;
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.14) * 0.09;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.075}
        map={sprite}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/** A few brighter motes floating on their own, for depth beyond the dust shell. */
function DriftingMotes() {
  const motes = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        position: [
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 6,
        ] as [number, number, number],
        color: index % 3 === 0 ? SCENE.champagne : SCENE.gold,
      })),
    [],
  );

  return (
    <Float speed={1.1} rotationIntensity={0.2} floatIntensity={1.4}>
      <Points limit={motes.length}>
        <PointMaterial
          transparent
          vertexColors
          size={0.11}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
        {motes.map((mote, index) => (
          <Point key={index} position={mote.position} color={mote.color} />
        ))}
      </Points>
    </Float>
  );
}

/** One node per indexed PDF, orbiting the codex and inspectable on hover. */
function DocNode({
  doc,
  position,
  index,
}: {
  doc: IndexedDocument;
  position: [number, number, number];
  index: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.x += delta * 0.6;
    mesh.current.rotation.y += delta * 0.4;
    const bob = Math.sin(state.clock.elapsedTime * 0.9 + index) * 0.05;
    mesh.current.position.y = position[1] + bob;
    const target = hovered ? 1.9 : 1;
    mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.15);
  });

  return (
    <group position={position}>
      <mesh
        ref={mesh}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <octahedronGeometry args={[0.085, 0]} />
        <meshStandardMaterial
          color={hovered ? SCENE.champagne : SCENE.gold}
          emissive={hovered ? SCENE.champagne : SCENE.gold}
          emissiveIntensity={hovered ? 2.6 : 1.3}
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>

      {hovered && (
        <Html center distanceFactor={9} zIndexRange={[20, 0]}>
          <div className="pointer-events-none -translate-y-10 whitespace-nowrap rounded-lg border border-gold-500/40 bg-titanium-900/90 px-3 py-2 text-[11px] shadow-gold backdrop-blur-xl">
            <p className="font-medium text-ink-100">{doc.doc_name}</p>
            <p className="mt-0.5 text-data text-[10px] text-champagne-300">
              {doc.page_count} pages · {doc.chunk_count} chunks
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

function DocNodes({ documents }: { documents: IndexedDocument[] }) {
  const group = useRef<THREE.Group>(null);
  const positions = useMemo(
    () => fibonacciSphere(Math.max(documents.length, 1), 1.45),
    [documents.length],
  );

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={group}>
      {documents.map((doc, index) => (
        <DocNode
          key={doc.doc_name}
          doc={doc}
          position={positions[index] ?? [0, 0, 0]}
          index={index}
        />
      ))}
    </group>
  );
}

export function QuantumCodex({
  activity,
  documents,
}: {
  activity: CodexActivity;
  documents: IndexedDocument[];
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    // A gentle parallax lean toward the pointer, so the codex feels physically present.
    const { x, y } = state.pointer;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x * 0.25, 0.04);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -y * 0.18, 0.04);
  });

  return (
    <group ref={group}>
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.5}>
        <Core activity={activity} />
        <Rings activity={activity} />
        <DocNodes documents={documents} />
      </Float>
      <GoldDust />
      <DriftingMotes />
    </group>
  );
}
