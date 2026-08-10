import { useMemo } from "react";
import { sunEarthMoonLayout3D } from "@/lib/learn/sun-earth-moon-math";

type Mode = "solar" | "lunar";

export function EclipseScene({ day, mode }: { day: number; mode: Mode }) {
  const layout = useMemo(() => {
    if (mode === "solar") return sunEarthMoonLayout3D(day % 29.53);
    return sunEarthMoonLayout3D(14.7);
  }, [day, mode]);

  const earth = layout.earth;
  const moon =
    mode === "lunar"
      ? ([-earth[0] * 0.35, 0, -earth[2] * 0.35] as [number, number, number])
      : layout.moon;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[0, 0, -6]} intensity={1.4} />
      <mesh position={[0, 0, -2.5]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={earth}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
      <mesh position={moon}>
        <sphereGeometry args={[0.08, 20, 20]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
    </>
  );
}
