import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { IcosahedronGeometry, Color, MeshPhysicalMaterial } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import CustomShaderMaterial from "three-custom-shader-material";
import vertex from './shaders/vertex.glsl';
import fragment from "./shaders/fragments.glsl";

const Sphere = () => {
  const materialRef = useRef<any>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new Color("#000000") },
    uNoiseStrength: { value: 0.9 },
  }), []);

  const geometry = useMemo(() => {
    const geo = mergeVertices(new IcosahedronGeometry(1.3, 200));
    geo.computeTangents();
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <CustomShaderMaterial
        ref={materialRef}
        vertexShader={vertex}
        fragmentShader={fragment}
        baseMaterial={MeshPhysicalMaterial}
        uniforms={uniforms}
        roughness={0.45}
        metalness={1}
        clearcoat={1}
        ior={2.5}
        iridescence={1}
        //@ts-ignore
        silent
      />
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} />
    </mesh>
  );
};

const Metaball = () => {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <Sphere />
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default Metaball;
