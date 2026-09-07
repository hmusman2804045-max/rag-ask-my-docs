import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Line, Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';

const PALETTE = {
  amber: '#F5A623',
  gold: '#FFB52E',
  softGold: '#D99A25',
  cardBg: '#11151C',
  border: '#334155',
  nodeBg: '#151A22',
};

interface PipelineNodeProps {
  label: string;
  sublabel: string;
  angle: number;
  radius: number;
  color?: string;
  active?: boolean;
}

function PipelineNode({ label, sublabel, angle, radius, color = PALETTE.amber, active }: PipelineNodeProps) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() * 0.15;
    const currentAngle = angle + t;
    meshRef.current.position.x = Math.cos(currentAngle) * radius;
    meshRef.current.position.z = Math.sin(currentAngle) * (radius * 0.55);
    meshRef.current.position.y = Math.sin(currentAngle * 2) * 0.12;
  });

  return (
    <group ref={meshRef}>
      {/* Node Halo */}
      <Sphere args={[0.16, 16, 16]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.9 : 0.4}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>

      {/* Outer Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.25, 32]} />
        <meshBasicMaterial color={color} opacity={0.35} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Floating Tag */}
      <group position={[0, 0.35, 0]}>
        <Text
          fontSize={0.13}
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
    // Gentle floating & tilt
    cardRef.current.rotation.y = Math.sin(t * 0.4) * 0.15 + mouse.x * 0.2;
    cardRef.current.rotation.x = Math.cos(t * 0.3) * 0.08 - mouse.y * 0.15;
    cardRef.current.position.y = Math.sin(t * 0.8) * 0.08;
  });

  return (
    <group ref={cardRef}>
      {/* 3D Glass Document Slate */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 2.0, 0.06]} />
        <meshPhysicalMaterial
          color="#10141B"
          metalness={0.6}
          roughness={0.25}
          transmission={0.3}
          thickness={0.5}
          clearcoat={0.8}
        />
      </mesh>

      {/* Glowing Amber Border Frame */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.51, 2.01, 0.062)]} />
        <lineBasicMaterial color={PALETTE.gold} linewidth={1.5} transparent opacity={0.65} />
      </lineSegments>

      {/* Document Heading Text */}
      <group position={[0, 0.55, 0.04]}>
        <Text
          fontSize={0.14}
          color={PALETTE.gold}
          anchorX="center"
          anchorY="middle"
          maxWidth={1.2}
          font="https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_eeA.woff"
        >
          ASKMYDOCS AI
        </Text>
      </group>

      {/* Schematic Lines on Document Surface */}
      {[-0.05, -0.25, -0.45, -0.65].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0.04]}>
          <planeGeometry args={[1.1 - idx * 0.12, 0.03]} />
          <meshBasicMaterial color="#334155" opacity={0.6} transparent />
        </mesh>
      ))}

      {/* Central Emblem */}
      <group position={[0, 0.2, 0.04]}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.22, 0.22]} />
          <meshBasicMaterial color={PALETTE.amber} opacity={0.8} transparent />
        </mesh>
      </group>
    </group>
  );
}

function OrbitalRings() {
  const points1 = useMemo(() => {
    const pts = [];
    const radius = 2.4;
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta * 2) * 0.08, Math.sin(theta) * (radius * 0.55)));
    }
    return pts;
  }, []);

  return (
    <group>
      <Line points={points1} color={PALETTE.softGold} opacity={0.2} transparent lineWidth={1} />
    </group>
  );
}

function AmbientParticles({ count = 40 }: { count?: number }) {
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 8;
      const y = (Math.random() - 0.5) * 5;
      const z = (Math.random() - 0.5) * 4;
      const scale = Math.random() * 0.04 + 0.015;
      temp.push({ position: [x, y, z] as [number, number, number], scale });
    }
    return temp;
  }, [count]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.02;
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <Sphere key={i} args={[p.scale, 8, 8]} position={p.position}>
          <meshBasicMaterial color={PALETTE.amber} opacity={0.35} transparent />
        </Sphere>
      ))}
    </group>
  );
}

export function DocumentPipeline3D() {
  const activity = useAppStore((state) => state.activity);

  const pipelineNodes = [
    { label: 'PDF Document', sublabel: 'Ingestion', angle: 0, radius: 2.4, color: '#F5A623' },
    { label: 'Chunking', sublabel: 'LangChain', angle: (Math.PI * 2) / 5, radius: 2.4, color: '#FFB52E' },
    { label: 'Embeddings', sublabel: 'FastEmbed 384d', angle: (Math.PI * 4) / 5, radius: 2.4, color: '#D99A25' },
    { label: 'Vector Search', sublabel: 'MongoDB Atlas', angle: (Math.PI * 6) / 5, radius: 2.4, color: '#22C55E' },
    { label: 'LLM Reasoning', sublabel: 'Groq LLaMA 3.3', angle: (Math.PI * 8) / 5, radius: 2.4, color: '#FFB52E' },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
      <CentralDocumentCard active={activity !== 'idle'} />
      <OrbitalRings />
      {pipelineNodes.map((node) => (
        <PipelineNode key={node.label} {...node} active={activity !== 'idle'} />
      ))}
      <AmbientParticles count={35} />
    </Float>
  );
}
