import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Line, Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';

const PALETTE = {
  amber: '#F5A623',
  gold: '#FFB52E',
  softGold: '#D99A25',
  cardBg: '#10141B',
  border: '#334155',
  emerald: '#22C55E',
};

interface PipelineNodeProps {
  label: string;
  sublabel: string;
  angle: number;
  radius: number;
  color?: string;
  active?: boolean;
}

function PipelineNode({ label, angle, radius, color = PALETTE.amber, active }: PipelineNodeProps) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    // Slow, stately rotation (approx 25s per cycle)
    const t = clock.getElapsedTime() * 0.12;
    const currentAngle = angle + t;
    meshRef.current.position.x = Math.cos(currentAngle) * radius;
    meshRef.current.position.z = Math.sin(currentAngle) * (radius * 0.5);
    meshRef.current.position.y = Math.sin(currentAngle * 2) * 0.1;
  });

  return (
    <group ref={meshRef}>
      {/* Node Halo Sphere */}
      <Sphere args={[0.13, 16, 16]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 1.0 : 0.45}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>

      {/* Outer Rotating Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.21, 32]} />
        <meshBasicMaterial color={color} opacity={0.35} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Floating Tag */}
      <group position={[0, 0.28, 0]}>
        <Text
          fontSize={0.11}
          color="#F5F7FA"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_eeA.woff"
        >
          {label}
        </Text>
      </group>
    </group>
  );
}

function CentralDocumentCard({ active }: { active?: boolean }) {
  const cardRef = useRef<THREE.Group>(null);

  useFrame(({ clock, mouse }) => {
    if (!cardRef.current) return;
    const t = clock.getElapsedTime();
    // Subtle float & smooth mouse tilt
    cardRef.current.rotation.y = Math.sin(t * 0.3) * 0.12 + mouse.x * 0.15;
    cardRef.current.rotation.x = Math.cos(t * 0.25) * 0.06 - mouse.y * 0.12;
    cardRef.current.position.y = 0.3 + Math.sin(t * 0.6) * 0.06;
  });

  return (
    <group ref={cardRef}>
      {/* 3D Glass Document Slate */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.3, 1.7, 0.05]} />
        <meshPhysicalMaterial
          color="#0B0E13"
          metalness={0.7}
          roughness={0.2}
          transmission={0.25}
          thickness={0.4}
          clearcoat={0.9}
        />
      </mesh>

      {/* Glowing Amber Border Frame */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.31, 1.71, 0.052)]} />
        <lineBasicMaterial color={PALETTE.gold} linewidth={1.5} transparent opacity={0.7} />
      </lineSegments>

      {/* Document Header Text */}
      <group position={[0, 0.45, 0.035]}>
        <Text
          fontSize={0.11}
          color={PALETTE.gold}
          anchorX="center"
          anchorY="middle"
          maxWidth={1.1}
          font="https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_eeA.woff"
        >
          ASKMYDOCS AI
        </Text>
      </group>

      {/* Schematic Lines on Document Surface */}
      {[-0.05, -0.22, -0.38, -0.54].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0.035]}>
          <planeGeometry args={[0.9 - idx * 0.1, 0.025]} />
          <meshBasicMaterial color="#334155" opacity={0.7} transparent />
        </mesh>
      ))}

      {/* Central Diamond Emblem */}
      <group position={[0, 0.15, 0.035]}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.18, 0.18]} />
          <meshBasicMaterial color={PALETTE.amber} opacity={0.85} transparent />
        </mesh>
      </group>
    </group>
  );
}

function OrbitalRings() {
  const points1 = useMemo(() => {
    const pts = [];
    const radius = 2.2;
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0.3 + Math.sin(theta * 2) * 0.06, Math.sin(theta) * (radius * 0.5)));
    }
    return pts;
  }, []);

  return (
    <group>
      <Line points={points1} color={PALETTE.softGold} opacity={0.25} transparent lineWidth={1} />
    </group>
  );
}

function AmbientParticles({ count = 35 }: { count?: number }) {
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 7;
      const y = (Math.random() - 0.5) * 4;
      const z = (Math.random() - 0.5) * 4;
      const scale = Math.random() * 0.03 + 0.012;
      temp.push({ position: [x, y, z] as [number, number, number], scale });
    }
    return temp;
  }, [count]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.015;
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <Sphere key={i} args={[p.scale, 8, 8]} position={p.position}>
          <meshBasicMaterial color={PALETTE.amber} opacity={0.3} transparent />
        </Sphere>
      ))}
    </group>
  );
}

export function DocumentPipeline3D() {
  const activity = useAppStore((state) => state.activity);

  const pipelineNodes = [
    { label: 'PDF Document', sublabel: 'Ingestion', angle: 0, radius: 2.2, color: '#F5A623' },
    { label: 'Chunking', sublabel: 'LangChain', angle: (Math.PI * 2) / 5, radius: 2.2, color: '#FFB52E' },
    { label: 'Embeddings', sublabel: 'FastEmbed 384d', angle: (Math.PI * 4) / 5, radius: 2.2, color: '#D99A25' },
    { label: 'Vector Search', sublabel: 'MongoDB Atlas', angle: (Math.PI * 6) / 5, radius: 2.2, color: '#22C55E' },
    { label: 'LLM Reasoning', sublabel: 'Groq LLaMA 3.3', angle: (Math.PI * 8) / 5, radius: 2.2, color: '#FFB52E' },
  ];

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
      <CentralDocumentCard active={activity !== 'idle'} />
      <OrbitalRings />
      {pipelineNodes.map((node) => (
        <PipelineNode key={node.label} {...node} active={activity !== 'idle'} />
      ))}
      <AmbientParticles count={30} />
    </Float>
  );
}
