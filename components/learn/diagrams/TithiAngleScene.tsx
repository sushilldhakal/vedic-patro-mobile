/**
 * The tithi angle, from where it is actually measured: Earth.
 *
 * The Sun is pinned to one side, the Moon swings round, and the arc between
 * them is the elongation. Every 12° of that arc closes one tithi — and because
 * the Moon is lit by the same Sun, its phase in the diagram is the phase the
 * angle implies, not a drawing of one.
 */

import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { DiagramClockRef } from "@/components/learn/diagrams/diagram-clock";
import { useSceneClock } from "@/components/learn/diagrams/diagram-clock";
import type { DiagramLabel } from "@/components/learn/diagrams/diagram-labels";
import { useLabelProjector } from "@/components/learn/diagrams/diagram-labels";
import { useLearnTextures } from "@/components/learn/diagrams/learn-textures";
import {
  EclipticPlane,
  Globe,
  OrbitPath,
  SunBody,
  ellipsePoints,
  orientRay,
  setArcSweep,
} from "@/components/learn/diagrams/scene-parts";
import { DIAGRAM_COLOR, DIAGRAM_LABEL_COLOR } from "@/lib/learn/diagram-theme";
import {
  EARTH_AXIAL_TILT,
  RAD,
  elongationFromDay,
  tithiIndexFromElongation,
} from "@/lib/learn/sun-earth-moon-math";

const EARTH_R = 0.16;
const MOON_R = 0.06;
const MOON_ORBIT = 0.78;
const SUN_AT: [number, number, number] = [1.5, 0, 0];
const SUN_R = 0.2;
const ARC_R = 0.44;
const ARC_THICKNESS = 0.011;

type Props = {
  clock: DiagramClockRef;
  onSample?: (day: number) => void;
  onLabels?: (labels: DiagramLabel[]) => void;
  labels: {
    sun: string;
    earth: string;
    moon: string;
    /** "तिथि" / "Tithi" — the running count is appended. */
    tithi: string;
  };
  digits: (v: string | number) => string;
};

export const TithiAngleScene = memo(function TithiAngleScene({
  clock,
  onSample,
  onLabels,
  labels: copy,
  digits,
}: Props) {
  const textures = useLearnTextures();
  const readClock = useSceneClock(clock, onSample);
  const projector = useLabelProjector(onLabels);

  const moonRef = useRef<THREE.Group>(null);
  const moonRayRef = useRef<THREE.Mesh>(null);
  const sunRayRef = useRef<THREE.Mesh>(null);
  const arcRef = useRef<THREE.Group>(null);
  const arcMeshRef = useRef<THREE.Mesh>(null);
  const arcSweep = useRef({ deg: -1 });
  const orbitPoints = useRef(ellipsePoints(MOON_ORBIT, 0, 72)).current;

  useFrame((_state, delta) => {
    const day = readClock(delta);
    const elong = elongationFromDay(day);
    /* Elongation is measured from the Sun, so the Moon starts on the Sun's own
       side (new moon) and swings anticlockwise from there. */
    const angle = elong * RAD;
    const moonAt: [number, number, number] = [
      MOON_ORBIT * Math.cos(angle),
      0,
      -MOON_ORBIT * Math.sin(angle),
    ];

    moonRef.current?.position.set(...moonAt);
    orientRay(moonRayRef.current, [0, 0, 0], moonAt);
    orientRay(sunRayRef.current, [0, 0, 0], [SUN_AT[0] * 0.7, 0, 0]);

    setArcSweep(arcMeshRef.current, ARC_R, ARC_THICKNESS, angle, arcSweep.current);

    if (projector.begin()) {
      projector.push(
        { id: "earth", text: copy.earth, color: DIAGRAM_LABEL_COLOR.earth },
        [0, EARTH_R + 0.12, 0],
      );
      projector.push(
        { id: "moon", text: copy.moon, color: DIAGRAM_LABEL_COLOR.moon, size: 9 },
        [moonAt[0], MOON_R + 0.1, moonAt[2]],
      );
      projector.push(
        { id: "sun", text: copy.sun, color: DIAGRAM_LABEL_COLOR.sun },
        [SUN_AT[0], SUN_R + 0.16, 0],
      );
      const half = angle / 2;
      projector.push(
        {
          id: "angle",
          text: `${digits(Math.round(elong))}°`,
          color: DIAGRAM_LABEL_COLOR.arc,
          size: 11,
        },
        [0.6 * Math.cos(half), 0.02, -0.6 * Math.sin(half)],
      );
      projector.push(
        {
          id: "tithi",
          text: `${copy.tithi} ${digits(tithiIndexFromElongation(elong))}`,
          color: DIAGRAM_LABEL_COLOR.arc,
          size: 10,
          dy: 14,
        },
        [0.6 * Math.cos(half), 0.02, -0.6 * Math.sin(half)],
      );
      projector.end();
    }
  });

  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={SUN_AT} intensity={4.5} distance={0} decay={0} />

      <group position={SUN_AT}>
        <SunBody radius={SUN_R} map={textures.sun} />
      </group>

      <EclipticPlane radius={MOON_ORBIT * 1.25} opacity={0.05} />
      <OrbitPath points={orbitPoints} color={DIAGRAM_COLOR.moon} opacity={0.3} radius={0.004} />

      <Globe radius={EARTH_R} map={textures.earth} tiltDeg={EARTH_AXIAL_TILT} axis />
      <Globe ref={moonRef} radius={MOON_R} map={textures.moon} />

      {/* Sight lines out of Earth, and the arc between them. */}
      <mesh ref={sunRayRef}>
        <cylinderGeometry args={[0.005, 0.005, 1, 6]} />
        <meshBasicMaterial color={DIAGRAM_COLOR.sun} transparent opacity={0.75} depthWrite={false} />
      </mesh>
      <mesh ref={moonRayRef}>
        <cylinderGeometry args={[0.005, 0.005, 1, 6]} />
        <meshBasicMaterial color={DIAGRAM_COLOR.moon} transparent opacity={0.6} depthWrite={false} />
      </mesh>
      <group ref={arcRef} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh ref={arcMeshRef}>
          <torusGeometry args={[ARC_R, ARC_THICKNESS, 8, 4, 0.05]} />
          <meshBasicMaterial color={DIAGRAM_COLOR.arc} depthWrite={false} />
        </mesh>
      </group>

      {/* Every 12° — the tithi boundaries, drawn once. */}
      <TithiTicks />
    </>
  );
});

/** The thirty 12° marks the arc is counted in. */
function TithiTicks() {
  return (
    <group>
      {Array.from({ length: 30 }, (_, i) => {
        const a = i * 12 * RAD;
        const inner = 0.5;
        const outer = i % 15 === 0 ? 0.6 : 0.55;
        const mid = (inner + outer) / 2;
        return (
          <mesh
            key={i}
            position={[mid * Math.cos(a), 0, -mid * Math.sin(a)]}
            rotation={[0, a, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.004, 0.004, outer - inner, 4]} />
            <meshBasicMaterial
              color={i % 15 === 0 ? DIAGRAM_COLOR.sun : DIAGRAM_COLOR.orbitFaint}
              transparent
              opacity={i % 15 === 0 ? 0.9 : 0.5}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
