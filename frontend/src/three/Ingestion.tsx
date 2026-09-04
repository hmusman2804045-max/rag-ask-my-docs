import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createGlowTexture } from './textures';
import { SCENE } from './palette';

const SWEEP_TOP = 3.1;
const SWEEP_BOTTOM = -3.1;
const STREAM_COUNT = 220;

/**
 * The scanning laser: a horizontal blade of light that sweeps the codex top to
 * bottom while a PDF is being extracted, chunked, embedded and indexed.
 */
export function ScanBeam({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null);
  const blade = useRef<THREE.Mesh>(null);
  const wash = useRef<THREE.Sprite>(null);
  const opacity = useRef(0);
  const glow = useMemo(() => createGlowTexture('rgba(245,158,11,0.95)'), []);

  useFrame((state, delta) => {
    opacity.current = THREE.MathUtils.lerp(opacity.current, active ? 1 : 0, 0.12);

    if (group.current) {
      const cycle = (state.clock.elapsedTime * 0.55) % 1;
      group.current.position.y = SWEEP_TOP - cycle * (SWEEP_TOP - SWEEP_BOTTOM);
      group.current.rotation.y += delta * 0.4;
      group.current.visible = opacity.current > 0.01;
    }

    const bladeMaterial = blade.current?.material as THREE.MeshBasicMaterial | undefined;
    if (bladeMaterial) bladeMaterial.opacity = opacity.current * 0.55;

    const washMaterial = wash.current?.material as THREE.SpriteMaterial | undefined;
    if (washMaterial) washMaterial.opacity = opacity.current * 0.4;
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={blade} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 3.0, 96]} />
        <meshBasicMaterial
          color={SCENE.gold}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <sprite ref={wash} scale={6}>
        <spriteMaterial
          map={glow}
          color={SCENE.gold}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  );
}

/**
 * Data particles streaming from the upload card (screen left) into the codex core,
 * standing in for text chunks becoming 384-dimensional vectors.
 */
export function IngestStream({ active }: { active: boolean }) {
  const points = useRef<THREE.Points>(null);
  const opacity = useRef(0);
  const sprite = useMemo(() => createGlowTexture('rgba(253,230,138,0.95)'), []);

  const { positions, seeds, origins } = useMemo(() => {
    const positionArray = new Float32Array(STREAM_COUNT * 3);
    const seedArray = new Float32Array(STREAM_COUNT);
    const originArray = new Float32Array(STREAM_COUNT * 3);

    for (let i = 0; i < STREAM_COUNT; i += 1) {
      // Particles are born off-canvas to the left, where the upload card lives.
      originArray[i * 3] = -7.5 - Math.random() * 2.5;
      originArray[i * 3 + 1] = (Math.random() - 0.5) * 3.4;
      originArray[i * 3 + 2] = (Math.random() - 0.5) * 2.6;
      seedArray[i] = Math.random();
    }

    return { positions: positionArray, seeds: seedArray, origins: originArray };
  }, []);

  useFrame((state) => {
    opacity.current = THREE.MathUtils.lerp(opacity.current, active ? 1 : 0, 0.1);

    const geometry = points.current?.geometry as THREE.BufferGeometry | undefined;
    const material = points.current?.material as THREE.PointsMaterial | undefined;
    if (!geometry || !material || !points.current) return;

    material.opacity = opacity.current;
    points.current.visible = opacity.current > 0.01;
    if (!points.current.visible) return;

    const attribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < STREAM_COUNT; i += 1) {
      const progress = (time * 0.45 + seeds[i]) % 1;
      const eased = progress * progress;

      const ox = origins[i * 3];
      const oy = origins[i * 3 + 1];
      const oz = origins[i * 3 + 2];

      // Converge on the core, with a slight sinusoidal arc so the stream reads as a flow.
      const arc = Math.sin(progress * Math.PI) * 0.9;
      attribute.setXYZ(
        i,
        ox + (0 - ox) * eased,
        oy + (0 - oy) * eased + arc * (seeds[i] - 0.5),
        oz + (0 - oz) * eased + arc * 0.35,
      );
    }

    attribute.needsUpdate = true;
  });

  return (
    <points ref={points} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        map={sprite}
        color={SCENE.champagne}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
