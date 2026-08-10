import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sunEarthMoonLayout3D } from "@/lib/learn/sun-earth-moon-math";

const SUN_R = 0.35;
const EARTH_R = 0.12;
const MOON_R = 0.04;

function OrbitRing({ radius, color }: { radius: number; color: string }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.004, 8, 128]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} />
    </mesh>
  );
}

function Bodies({ day }: { day: number }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const layout = useMemo(() => sunEarthMoonLayout3D(day), [day]);

  useFrame(() => {
    if (earthRef.current) earthRef.current.position.set(...layout.earth);
    if (moonRef.current) moonRef.current.position.set(...layout.moon);
  });

  return (
    <>
      <mesh position={layout.sun}>
        <sphereGeometry args={[SUN_R, 32, 32]} />
        <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.6} />
      </mesh>
      <OrbitRing radius={0.95} color="#64748b" />
      <mesh ref={earthRef} position={layout.earth}>
        <sphereGeometry args={[EARTH_R, 24, 24]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh ref={moonRef} position={layout.moon}>
        <sphereGeometry args={[MOON_R, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <directionalLight position={[5, 8, 2]} intensity={1.2} />
      <ambientLight intensity={0.35} />
    </>
  );
}

export function SunEarthMoonScene({ day }: { day: number }) {
  return <Bodies day={day} />;
}
