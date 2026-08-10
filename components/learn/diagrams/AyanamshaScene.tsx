import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { lahiriAyanamsha } from "@/lib/learn/sun-earth-moon-math";

const RASHI_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
];

function RashiRing() {
  const segments = useMemo(() => {
    return RASHI_COLORS.map((color, i) => {
      const start = (i / 12) * Math.PI * 2;
      const end = ((i + 1) / 12) * Math.PI * 2;
      const shape = new THREE.Shape();
      const rIn = 0.55;
      const rOut = 0.95;
      shape.moveTo(rIn * Math.cos(start), rIn * Math.sin(start));
      shape.lineTo(rOut * Math.cos(start), rOut * Math.sin(start));
      shape.absarc(0, 0, rOut, start, end, false);
      shape.lineTo(rIn * Math.cos(end), rIn * Math.sin(end));
      shape.absarc(0, 0, rIn, end, start, true);
      const geom = new THREE.ShapeGeometry(shape);
      return { geom, color };
    });
  }, []);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {segments.map(({ geom, color }, i) => (
        <mesh key={i} geometry={geom}>
          <meshStandardMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Markers({ yearCe }: { yearCe: number }) {
  const eqRef = useRef<THREE.Mesh>(null);
  const ayan = lahiriAyanamsha(yearCe);
  const eqLon = ((360 - (ayan % 360)) % 360) * (Math.PI / 180);

  useFrame(() => {
    if (eqRef.current) {
      const r = 1.05;
      eqRef.current.position.set(r * Math.cos(eqLon), 0.02, r * Math.sin(eqLon));
    }
  });

  return (
    <>
      <mesh position={[0.75, 0.02, 0]}>
        <coneGeometry args={[0.06, 0.14, 8]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <mesh ref={eqRef}>
        <coneGeometry args={[0.06, 0.14, 8]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
    </>
  );
}

export function AyanamshaScene({ yearCe }: { yearCe: number }) {
  return (
    <>
      <RashiRing />
      <Markers yearCe={yearCe} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 3]} intensity={0.9} />
    </>
  );
}
