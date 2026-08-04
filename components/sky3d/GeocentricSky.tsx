import { useMemo, useRef, useState } from "react";
import { PanResponder, View } from "react-native";
import { Canvas } from "@react-three/fiber/native";
import * as THREE from "three";
import { Text } from "@/components/ui/Text";
import { useLocale } from "@/lib/i18n";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { formatRashiByNumber } from "@/lib/rashi-i18n";
import {
  beltDivisions,
  buildSkyGrahas,
  DEG,
  eclipticToVec3,
  NAKSHATRA_ARC,
  RASHI_ARC,
  type LongitudeSource,
  type SkyGraha,
} from "@/lib/sky3d/geocentric-model";
import { useThemeColors } from "@/lib/theme-context";

/** Belt radii — nakshatra ring sits just outside the rashi ring. */
const RASHI_INNER = 7.2;
const RASHI_OUTER = 8.4;
const NAK_INNER = 8.5;
const NAK_OUTER = 9.1;

const INK = "#eaf3f1";
const INK_DIM = "#a7c4c3";
const SEP = "rgba(143,191,193,0.42)";
const ACCENT = "#c62828";

/* ── primitives ────────────────────────────────────────────────────────── */

/** A flat annulus lying in the ecliptic plane. */
function Belt({
  inner,
  outer,
  color,
  opacity,
}: {
  inner: number;
  outer: number;
  color: string;
  opacity: number;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[inner, outer, 128]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Radial spokes marking segment boundaries on a belt. */
function BeltDivisions({
  count,
  inner,
  outer,
  color,
  width = 1,
}: {
  count: number;
  inner: number;
  outer: number;
  color: string;
  width?: number;
}) {
  const geometry = useMemo(() => {
    const points: number[] = [];
    for (const deg of beltDivisions(count)) {
      const a = deg * DEG;
      points.push(
        inner * Math.cos(a), 0, -inner * Math.sin(a),
        outer * Math.cos(a), 0, -outer * Math.sin(a),
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return g;
  }, [count, inner, outer]);

  const object = useMemo(
    () =>
      new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({
          color,
          linewidth: width,
          transparent: true,
          opacity: 0.8,
        }),
      ),
    [geometry, color, width],
  );

  return <primitive object={object} />;
}

/** A circle drawn in the ecliptic plane. */
function EclipticCircle({ radius, color }: { radius: number; color: string }) {
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i += 1) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(radius * Math.cos(a), 0, -radius * Math.sin(a)));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);

  const object = useMemo(
    () =>
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 }),
      ),
    [geometry, color],
  );

  return <primitive object={object} />;
}

/** The orbital shell a graha rides on. */
function ShellRing({ radius, color }: { radius: number; color: string }) {
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i += 1) {
      const a = (i / 96) * Math.PI * 2;
      pts.push(new THREE.Vector3(radius * Math.cos(a), 0, -radius * Math.sin(a)));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);

  const object = useMemo(
    () =>
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.18 }),
      ),
    [geometry, color],
  );

  return <primitive object={object} />;
}

function Earth() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color="#1d6fa5" roughness={0.75} metalness={0.05} />
      </mesh>
      {/* polar axis — the diurnal spin that makes lagna move */}
      <mesh rotation={[0, 0, 23.44 * DEG]}>
        <cylinderGeometry args={[0.012, 0.012, 1.7, 8]} />
        <meshBasicMaterial color={INK_DIM} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function GrahaBody({ graha, onSelect }: { graha: SkyGraha; onSelect: () => void }) {
  return (
    <group position={graha.position}>
      <mesh onClick={onSelect}>
        <sphereGeometry args={[graha.size, 24, 24]} />
        <meshStandardMaterial
          color={graha.color}
          emissive={graha.color}
          emissiveIntensity={graha.key === "sun" ? 0.9 : 0.35}
          roughness={0.5}
        />
      </mesh>
      {graha.retrograde ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[graha.size * 1.5, graha.size * 1.8, 24]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
    </group>
  );
}

/** Line from Earth out to the belt, showing where a graha projects on the zodiac. */
function SightLine({ graha }: { graha: SkyGraha }) {
  const geometry = useMemo(() => {
    const end = eclipticToVec3(graha.longitude, graha.latitude, RASHI_OUTER);
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(...end),
    ]);
  }, [graha.longitude, graha.latitude]);

  const object = useMemo(
    () =>
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: graha.color,
          transparent: true,
          opacity: 0.55,
        }),
      ),
    [geometry, graha.color],
  );

  return <primitive object={object} />;
}

/* ── scene ─────────────────────────────────────────────────────────────── */

function Scene({
  grahas,
  yaw,
  pitch,
  selectedKey,
  onSelect,
}: {
  grahas: SkyGraha[];
  yaw: number;
  pitch: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const shells = useMemo(
    () => [...new Set(grahas.map((g) => g.shell))].sort((a, b) => a - b),
    [grahas],
  );

  return (
    <group rotation={[pitch, yaw, 0]}>
      <ambientLight intensity={0.65} />
      <pointLight position={[0, 0, 0]} intensity={1.1} distance={40} />
      <directionalLight position={[6, 8, 4]} intensity={0.5} />

      <Earth />

      {shells.map((r) => (
        <ShellRing key={r} radius={r} color={INK_DIM} />
      ))}

      {/* rashi belt: 12 × 30° */}
      <Belt inner={RASHI_INNER} outer={RASHI_OUTER} color="#0f3234" opacity={0.85} />
      <BeltDivisions count={12} inner={RASHI_INNER} outer={RASHI_OUTER} color={SEP} width={2} />

      {/* nakshatra belt: 27 × 13°20′, with pada ticks at 108 */}
      <Belt inner={NAK_INNER} outer={NAK_OUTER} color="#0a2426" opacity={0.85} />
      <BeltDivisions count={27} inner={NAK_INNER} outer={NAK_OUTER} color={SEP} />
      <BeltDivisions
        count={108}
        inner={NAK_OUTER - 0.18}
        outer={NAK_OUTER}
        color={INK_DIM}
      />

      <EclipticCircle radius={RASHI_INNER} color={INK} />

      {grahas.map((g) => (
        <group key={g.key}>
          <GrahaBody graha={g} onSelect={() => onSelect(g.key)} />
          {selectedKey === g.key || selectedKey === null ? <SightLine graha={g} /> : null}
        </group>
      ))}
    </group>
  );
}

/* ── public component ──────────────────────────────────────────────────── */

export type GeocentricSkyProps = {
  /** Any payload keyed by graha carrying a sidereal `longitude`. */
  source: Partial<Record<string, LongitudeSource>>;
  height?: number;
  /** Auto-spin until the user drags. */
  autoSpin?: boolean;
};

/**
 * Geocentric solar system with the rashi and nakshatra belts, in 3D.
 *
 * Earth sits at the origin; each graha rides a schematic shell at its true
 * sidereal longitude, and a sight line projects it onto the zodiac belt — which
 * is precisely what the 2D wheel shows flattened. Drag to orbit, pinch to zoom.
 */
export function GeocentricSky({ source, height = 340, autoSpin = true }: GeocentricSkyProps) {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();

  const grahas = useMemo(() => buildSkyGrahas(source), [source]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [yaw, setYaw] = useState(0.6);
  const [pitch, setPitch] = useState(-0.85);
  const [zoom, setZoom] = useState(1);
  const gesture = useRef({ yaw: 0.6, pitch: -0.85, zoom: 1, pinch: 0 });

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          gesture.current.yaw = yaw;
          gesture.current.pitch = pitch;
          gesture.current.zoom = zoom;
          gesture.current.pinch = 0;
        },
        onPanResponderMove: (e, g) => {
          const touches = e.nativeEvent.touches;
          if (touches.length >= 2) {
            const [a, b] = touches;
            const dist = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
            if (!gesture.current.pinch) gesture.current.pinch = dist;
            const next = gesture.current.zoom * (dist / gesture.current.pinch);
            setZoom(Math.max(0.55, Math.min(2.4, next)));
            return;
          }
          setYaw(gesture.current.yaw + g.dx * 0.006);
          setPitch(
            Math.max(-1.5, Math.min(-0.05, gesture.current.pitch + g.dy * 0.005)),
          );
        },
      }),
    [yaw, pitch, zoom],
  );

  const selected = grahas.find((g) => g.key === selectedKey) ?? null;

  return (
    <View className="overflow-hidden rounded-2xl border border-border">
      <View
        style={{ height, backgroundColor: "#050c0d" }}
        {...responder.panHandlers}
      >
        <Canvas
          camera={{ position: [0, 0, 22 / zoom], fov: 45 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => gl.setClearColor("#050c0d")}
        >
          <Scene
            grahas={grahas}
            yaw={yaw}
            pitch={pitch}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
          />
        </Canvas>
      </View>

      <View className="gap-1 border-t border-border bg-card px-4 py-3">
        {selected ? (
          <>
            <Text className="text-sm font-bold text-foreground" style={nepaliTextStyle(14)}>
              {formatRashiByNumber(
                Math.floor(selected.longitude / RASHI_ARC) + 1,
                lang,
              )}{" "}
              · {digits(selected.longitude.toFixed(2))}°
            </Text>
            <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
              {(() => {
                const idx = Math.floor(selected.longitude / NAKSHATRA_ARC);
                const nak = NAKSHATRA_ICONS[idx];
                return nak ? (lang === "en" ? nak.en : nak.ne) : "—";
              })()}
              {selected.retrograde ? pick(" · वक्री", " · retrograde") : ""}
            </Text>
          </>
        ) : (
          <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
            {pick(
              "ग्रह छुनुहोस् · तानेर घुमाउनुहोस् · चिम्टेर जुम",
              "Tap a graha · drag to orbit · pinch to zoom",
            )}
          </Text>
        )}
      </View>
    </View>
  );
}

export default GeocentricSky;
