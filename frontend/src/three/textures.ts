import * as THREE from 'three';

/**
 * Soft radial sprite used for every glowing element in the scene.
 * Additive sprites give us a bloom-like falloff without a postprocessing pass,
 * which keeps the canvas cheap enough to run alongside the chat UI.
 */
export function createGlowTexture(core = 'rgba(255,255,255,0.95)'): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, core);
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.35)');
    gradient.addColorStop(0.55, 'rgba(255,255,255,0.08)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** Evenly distributed points on a sphere (Fibonacci lattice) — no clustering at the poles. */
export function fibonacciSphere(count: number, radius: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    points.push([
      Math.cos(theta) * ringRadius * radius,
      y * radius,
      Math.sin(theta) * ringRadius * radius,
    ]);
  }

  return points;
}
