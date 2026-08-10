import { useMemo } from "react";
import * as THREE from "three";
import { sunEarthMoonLayout3D, tithiIndexFromElongation } from "@/lib/learn/sun-earth-moon-math";

export function TithiAngleScene({ day }: { day: number }) {
  const layout = useMemo(() => sunEarthMoonLayout3D(day), [day]);
  const arcTheta = Math.max(0.05, (layout.elongDeg * Math.PI) / 180);

  const moonPos: [number, number, number] = [
    layout.moon[0] * 0.55,
    0,
    layout.moon[2] * 0.55,
  ];

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 2]} intensity={0.8} />
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh position={moonPos}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.008, 8, 48, arcTheta]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.52, 64]} />
        <meshBasicMaterial color="#334155" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

export function tithiFromDay(day: number): number {
  return tithiIndexFromElongation(sunEarthMoonLayout3D(day).elongDeg);
}
