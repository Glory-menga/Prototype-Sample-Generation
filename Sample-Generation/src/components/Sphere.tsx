import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SimplexNoise } from 'three-stdlib';

const simplex = new SimplexNoise();

interface SphereProps {
  analyser: AnalyserNode | null;
}

const Sphere: React.FC<SphereProps> = ({ analyser }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const basePositions = useRef<Float32Array | null>(null);
  const time = useRef(0);
  const dataArray = useRef<Uint8Array | null>(null);

  useFrame((_, delta) => {
    time.current += delta;
    const mesh = meshRef.current;
    const geometry = mesh.geometry as THREE.SphereGeometry;
    const position = geometry.attributes.position;

    if (!basePositions.current) {
      basePositions.current = position.array.slice() as Float32Array;
    }

    if (analyser) {
      if (!dataArray.current) {
        dataArray.current = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(dataArray.current);
    }

    const avgFrequency = dataArray.current
      ? dataArray.current.reduce((sum, val) => sum + val, 0) / dataArray.current.length
      : 0;

    let boost = 1;
    if (analyser && dataArray.current) {
      const normalized = avgFrequency / 128;
      if (normalized > 0.05) {
        boost += normalized * 10; 
      }
    }

    const noiseStrength = 0.02; 

    for (let i = 0; i < position.count; i++) {
      const ix = i * 3;
      const x = basePositions.current[ix];
      const y = basePositions.current[ix + 1];
      const z = basePositions.current[ix + 2];

      const noise = noiseStrength * simplex.noise4d(
        x * 1.5,
        y * 1.5,
        z * 1.5,
        time.current * 0.5
      );

      const scale = 1 + noise * boost;
      position.setXYZ(i, x * scale, y * scale, z * scale);
    }


    position.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 128, 128]} />
      <meshPhysicalMaterial
        color="#000"
        roughness={0}
        metalness={10}
        clearcoat={5}
        clearcoatRoughness={0}
      />
    </mesh>
  );
};

export default Sphere;
