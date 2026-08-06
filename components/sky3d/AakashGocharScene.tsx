/**
 * The 3D scene for Aakash Gochar — everything inside the <Canvas>.
 *
 * Two views of the same sky, both geocentric:
 *
 * • `space` — the solar system seen from outside, Earth at the centre. Grahas
 *   ride shells in the classical Moon-to-Saturn order at their true sidereal
 *   longitude and shara, so vakri loops and the belt geometry read directly.
 * • `horizon` — the sky standing over one place at one instant. Longitudes are
 *   carried through the equatorial frame into alt/az, so the rashi belt tips by
 *   the observer's latitude and swings with the hour, exactly as it does
 *   overhead. This is the view where the ecliptic is emphatically *not* flat.
 *
 * Per-frame work is deliberately imperative: positions are written straight
 * onto object refs and React only hears from the scene a few times a second,
 * via `onSample`.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import type { GrahaKey } from "@/lib/graha-details";
import {
  beltDivisions,
  DEG,
  eclipticToVec3,
  GRAHA_COLOR,
  NAKSHATRA_ARC,
  RASHI_ARC,
} from "@/lib/sky3d/geocentric-model";
import {
  altAzToVec3,
  eclipticToAltAz,
  equatorialToAltAz,
  lstDeg,
  obliquity,
  type Observer,
} from "@/lib/sky3d/horizon";
import {
  ayanamsa,
  bodyRadius,
  BODY_RADIUS,
  daysSinceJ2000,
  GEO_BODY_ORDER,
  geocentricBody,
  geocentricSky,
  shellRadius,
  type GeoBody,
  type SkyCalibration,
} from "@/lib/sky3d/orbital-model";
import {
  BAND_EDGES,
  COMPASS_POINTS,
  GLOBE_EQUATOR,
  GLOBE_MERIDIANS,
  GLOBE_PARALLELS,
  GLOBE_TROPICS,
  SOLAR_STATIONS,
  type GeoPoint,
  DEGREE_TICKS,
  GRID_AZIMUTH_LABELS,
  GRID_LINES,
  NAK_LABEL_LAT,
  NAKSHATRA_DIVIDERS,
  PADA_TICKS,
  RASHI_DIVIDERS,
  RASHI_LABEL_LAT,
  type EclipticPoint,
  type HorizonPoint,
} from "@/lib/sky3d/sky-geometry";
import {
  SKY_TEXTURE_KEYS,
  SKY_TEXTURE_SOURCES,
  type SkyTextureKey,
} from "@/lib/sky3d/sky-textures";

/** Belt radii in space view — the nakshatra ring sits just outside the rashi ring. */
export const RASHI_INNER = 9.0;
export const RASHI_OUTER = 10.3;
const NAK_INNER = 10.4;
const NAK_OUTER = 11.1;
const RASHI_MID = (RASHI_INNER + RASHI_OUTER) / 2;
const NAK_MID = (NAK_INNER + NAK_OUTER) / 2;

/** Radius of the horizon dome. Everything on the sky sits on it. */
const DOME = 100;
/** Zoom value up to which the observer stands inside the sphere. */
const INSIDE_ZOOM_MAX = 45;
/** How far back the camera sits in the Earth-globe view. */
const OUTSIDE_ZOOM_MAX = 120;

/** Radius of the Earth globe in the zoomed-out view. */
const GLOBE_R = 30;
/** Radius the zodiac ring hugs the globe at. */
const GLOBE_BAND_R = GLOBE_R * 1.42;
/** Where the globe camera sits — far enough back to read as orthographic. */
const GLOBE_CAM_R = 300;
/** Bodies are tuned for the 100-unit dome; bring them down to the ring's scale. */
const GLOBE_BODY_SCALE = 0.55;

const INK_DIM = "#a7c4c3";
const SEP = "#8fbfc1";
const RETRO = "#ef4444";
/** Star-atlas palette: the zodiac band in gold, the nakshatra strip in green. */
const ZODIAC = "#d8c84a";
const NAKSHATRA = "#35d05a";
const GRID = "#4d7fb5";
const EARTH_RADIUS = 0.75;

/** Bodies that get a photographic texture; the nodes are not bodies at all. */
const BODY_TEXTURE: Partial<Record<GrahaKey, SkyTextureKey>> = {
  sun: "sun",
  moon: "moon",
  mercury: "mercury",
  venus: "venus",
  mars: "mars",
  jupiter: "jupiter",
  saturn: "saturn",
};

/** Apparent radii on the horizon dome — exaggerated, or they would be sub-pixel. */
const DOME_RADIUS: Record<GrahaKey, number> = {
  sun: 1.7,
  moon: 1.7,
  mercury: 0.8,
  venus: 1.0,
  mars: 0.85,
  jupiter: 1.15,
  saturn: 1.0,
  rahu: 0.7,
  ketu: 0.7,
};

export type SkyMode = "space" | "horizon" | "globe";

/** What the camera is looking at. `earth` means the Earth itself / the observer. */
export type FocusKey = GrahaKey | "earth";

/** Mutable, ref-held simulation clock — advanced in `useFrame`, never in state. */
export type SimState = {
  /** Simulated instant, ms since epoch. */
  timeMs: number;
  /** Simulated seconds per real second. 1 = wall clock, 86400 = a day per second. */
  secondsPerRealSecond: number;
  playing: boolean;
};

/**
 * Ref-held camera state, so dragging never re-renders the tree.
 * In `space` view `distance` is how far the camera sits from its target; in
 * `horizon` view the observer cannot move, so it drives the field of view.
 */
export type ViewState = { yaw: number; pitch: number; distance: number };

/** A 3D anchor projected to canvas pixels, for the text overlay. */
export type ScreenLabel = {
  id: string;
  kind: "rashi" | "nakshatra" | "graha" | "cardinal" | "azimuth" | "station" | "tropic";
  /** 1–12 for rashi, 1–27 for nakshatra. */
  index?: number;
  key?: GrahaKey;
  text?: string;
  x: number;
  y: number;
};

export type SkySample = {
  timeMs: number;
  sky: Record<GrahaKey, GeoBody>;
  labels: ScreenLabel[];
  /** Sun altitude, deg — negative is night. Drives the daylight wash. */
  sunAltitude: number;
};

export type SceneToggles = {
  belts: boolean;
  /** The alt-az cage: almucantars and verticals every 15°. */
  grid: boolean;
  /**
   * Freeze the Earth's spin. The diurnal rotation drags the whole sky round
   * once a day, which drowns out planetary motion when the clock is running
   * fast; locked, the zodiac holds still and only the grahas move along it.
   */
  lockStars: boolean;
  labels: boolean;
};

/* ── shared primitives ─────────────────────────────────────────────────── */

/**
 * Earth-fixed latitude/longitude → scene vector, axis along +Y. Longitude runs
 * the mirrored way, to match the zodiac ring drawn around this globe.
 */
function geoToVec3(lat: number, lon: number, radius: number): [number, number, number] {
  const a = lat * DEG;
  const b = lon * DEG;
  const cosLat = Math.cos(a);
  return [radius * cosLat * Math.cos(b), radius * Math.sin(a), radius * cosLat * Math.sin(b)];
}

function circlePoints(radius: number, segments = 128): THREE.Vector3[] {
  return Array.from({ length: segments + 1 }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return new THREE.Vector3(radius * Math.cos(a), 0, -radius * Math.sin(a));
  });
}

function makeLine(points: THREE.Vector3[], color: string, opacity: number) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}

/** A line whose points are rewritten every frame. */
function makeDynamicLine(count: number, color: string, opacity: number, width = 1) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, linewidth: width }),
  );
}

/** The same, as disconnected pairs — dividers, ticks, grid cage. */
function makeDynamicSegments(count: number, color: string, opacity: number) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}

function setPoint(line: THREE.Line, i: number, v: [number, number, number]) {
  const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
  attr.setXYZ(i, v[0], v[1], v[2]);
}

function flushLine(line: THREE.Line) {
  const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
  attr.needsUpdate = true;
  line.geometry.computeBoundingSphere();
}

/** A flat annulus lying in the ecliptic plane (space view only). */
function Belt({ inner, outer, color, opacity }: { inner: number; outer: number; color: string; opacity: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[inner, outer, 128]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Radial spokes marking segment boundaries on a belt. */
function BeltDivisions({ count, inner, outer, color, opacity }: { count: number; inner: number; outer: number; color: string; opacity: number }) {
  const object = useMemo(() => {
    const points: number[] = [];
    for (const deg of beltDivisions(count)) {
      const a = deg * DEG;
      points.push(
        inner * Math.cos(a), 0, -inner * Math.sin(a),
        outer * Math.cos(a), 0, -outer * Math.sin(a),
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    );
  }, [count, inner, outer, color, opacity]);

  return <primitive object={object} />;
}

/* ── grahas ────────────────────────────────────────────────────────────── */

/**
 * Saturn's ring, sized from the globe it belongs to. The real ring system runs
 * from about 1.2 to 2.3 planet radii; the numbers here are those, so it stays
 * in proportion however the body is scaled.
 */
function SaturnRing({ texture, radius }: { texture: THREE.Texture; radius: number }) {
  const geometry = useMemo(() => {
    const inner = radius * 1.3;
    const outer = radius * 2.2;
    const geo = new THREE.RingGeometry(inner, outer, 96);
    // Remap UVs radially so the ring strip texture reads outward, not around.
    const uv = geo.attributes.uv;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      uv.setXY(i, (r - inner) / (outer - inner), 1);
    }
    return geo;
  }, [radius]);

  return (
    <mesh geometry={geometry} rotation={[Math.PI / 2 - 0.45, 0, 0]} renderOrder={1}>
      <meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent
        opacity={0.92}
        depthWrite={false}
        alphaTest={0.05}
      />
    </mesh>
  );
}

function GrahaBody({
  graha,
  textures,
  selected,
  groupRef,
  spinRef,
  retroRef,
  onSelect,
}: {
  graha: GrahaKey;
  textures: Record<SkyTextureKey, THREE.Texture>;
  selected: boolean;
  groupRef: (o: THREE.Group | null) => void;
  spinRef: (o: THREE.Mesh | null) => void;
  retroRef: (o: THREE.Group | null) => void;
  onSelect: () => void;
}) {
  const texKey = BODY_TEXTURE[graha];
  const radius = BODY_RADIUS[graha];
  const color = GRAHA_COLOR[graha];

  return (
    <group ref={groupRef}>
      {texKey ? (
        <mesh ref={spinRef} onClick={onSelect}>
          <sphereGeometry args={[radius, 40, 40]} />
          {graha === "sun" ? (
            <meshBasicMaterial map={textures.sun} />
          ) : (
            <meshStandardMaterial
              map={textures[texKey]}
              emissive="#ffffff"
              emissiveMap={textures[texKey]}
              /* A little self-lighting keeps outer grahas legible where the
                 Sun's falloff would otherwise leave them nearly black. */
              emissiveIntensity={0.22}
              roughness={0.85}
              metalness={0.03}
            />
          )}
        </mesh>
      ) : (
        /* Rahu and Ketu are the lunar nodes — points, not bodies. */
        <mesh onClick={onSelect} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.5, radius * 0.35, 8, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      )}

      {/* The Sun's torch: an emissive core wrapped in two additive haloes. */}
      {graha === "sun" ? (
        <group>
          <mesh>
            <sphereGeometry args={[radius * 1.5, 24, 24]} />
            <meshBasicMaterial
              color="#ffd166"
              transparent
              opacity={0.3}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[radius * 2.6, 24, 24]} />
            <meshBasicMaterial
              color="#ff9d3c"
              transparent
              opacity={0.12}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ) : null}

      {graha === "moon" ? (
        <mesh>
          <sphereGeometry args={[radius * 1.45, 20, 20]} />
          <meshBasicMaterial
            color="#dbe7ff"
            transparent
            opacity={0.08}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ) : null}

      {graha === "saturn" ? <SaturnRing texture={textures.saturnring} radius={radius} /> : null}

      {/* Vakri collar — shown only while the graha is actually retrograde. */}
      <group ref={retroRef} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.7, radius * 2.05, 32]} />
          <meshBasicMaterial color={RETRO} transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {selected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 2.4, radius * 2.65, 40]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
    </group>
  );
}

/* ── scene ─────────────────────────────────────────────────────────────── */

const TRAIL_DAYS = 45;
const TRAIL_STEPS = 90;
/** Sim seconds per Earth sidereal rotation. */
const SIDEREAL_DAY_S = 86164.0905;
/** Points along the ecliptic great circle in the horizon view. */
const ECLIPTIC_STEPS = 180;


export function AakashGocharScene({
  sim,
  view,
  mode,
  observer,
  calibration,
  selectedKey,
  focusKey,
  toggles,
  onSelect,
  onSample,
}: {
  sim: React.RefObject<SimState>;
  view: React.RefObject<ViewState>;
  mode: SkyMode;
  observer: Observer;
  calibration: SkyCalibration;
  selectedKey: GrahaKey | null;
  focusKey: FocusKey;
  toggles: SceneToggles;
  onSelect: (key: GrahaKey) => void;
  onSample: (sample: SkySample) => void;
}) {
  const loaded = useLoader(THREE.TextureLoader, SKY_TEXTURE_SOURCES as string[]);
  const textures = useMemo(() => {
    const map = {} as Record<SkyTextureKey, THREE.Texture>;
    SKY_TEXTURE_KEYS.forEach((key, i) => {
      const tex = loaded[i];
      tex.colorSpace = THREE.SRGBColorSpace;
      map[key] = tex;
    });
    return map;
  }, [loaded]);

  const bodyRefs = useRef<Partial<Record<GrahaKey, THREE.Group>>>({});
  const spinRefs = useRef<Partial<Record<GrahaKey, THREE.Mesh>>>({});
  const retroRefs = useRef<Partial<Record<GrahaKey, THREE.Group>>>({});
  const shellRefs = useRef<Partial<Record<GrahaKey, THREE.Line>>>({});
  const earthRef = useRef<THREE.Mesh | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const cloudRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.PointLight | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const starsRef = useRef<THREE.Mesh | null>(null);
  const groundRef = useRef<THREE.Group | null>(null);
  const horizonGroupRef = useRef<THREE.Group | null>(null);
  const shellRef = useRef<THREE.Mesh | null>(null);
  const globeRootRef = useRef<THREE.Group | null>(null);
  const globeSpinRef = useRef<THREE.Group | null>(null);
  const subsolarRef = useRef<THREE.Mesh | null>(null);
  const spaceOnlyRef = useRef<THREE.Group | null>(null);

  /* Sight rays: one two-point line per graha, rewritten every frame. */
  const rays = useMemo(() => {
    const out = {} as Record<GrahaKey, THREE.Line>;
    for (const key of GEO_BODY_ORDER) {
      out[key] = makeDynamicLine(2, GRAHA_COLOR[key], 0.5);
    }
    return out;
  }, []);

  /* Every graha's path over ±45 days — where the vakri loops show. Each keeps
     its own colour so a crowded belt still reads. */
  const trails = useMemo(() => {
    const out = {} as Record<GrahaKey, THREE.Line>;
    for (const key of GEO_BODY_ORDER) out[key] = makeDynamicLine(TRAIL_STEPS + 1, GRAHA_COLOR[key], 0.4);
    return out;
  }, []);

  /**
   * Horizon view furniture: the banded zodiac, the nakshatra strip inside it,
   * the degree scale, and the alt-az cage. Each entry keeps its source vertices
   * in sky coordinates and is re-projected onto the dome every frame.
   */
  const skyLines = useMemo(() => {
    const band = (src: EclipticPoint[], color: string, opacity: number, segments = false) => ({
      src,
      object: segments
        ? makeDynamicSegments(src.length, color, opacity)
        : makeDynamicLine(src.length, color, opacity),
    });
    return [
      band(BAND_EDGES.rashiOuter, ZODIAC, 0.85),
      band(BAND_EDGES.rashiInner, ZODIAC, 0.85),
      band(BAND_EDGES.nakOuter, NAKSHATRA, 0.7),
      band(BAND_EDGES.nakInner, NAKSHATRA, 0.7),
      band(BAND_EDGES.ecliptic, ZODIAC, 0.5),
      band(RASHI_DIVIDERS, ZODIAC, 0.75, true),
      band(NAKSHATRA_DIVIDERS, NAKSHATRA, 0.6, true),
      band(PADA_TICKS, NAKSHATRA, 0.35, true),
      band(DEGREE_TICKS, ZODIAC, 0.45, true),
    ];
  }, []);

  /**
   * The Earth globe's graticule, built once in Earth-fixed coordinates and
   * spun by the group it hangs in. Latitude/longitude only — the globe itself
   * is a dark ball, so the grid and the zodiac ring are all there is to read.
   */
  const globeLines = useMemo(() => {
    const asLine = (src: GeoPoint[], color: string, opacity: number) => ({
      src,
      object: makeLine(
        src.map((p) => new THREE.Vector3(...geoToVec3(p.lat, p.lon, GLOBE_R))),
        color,
        opacity,
      ),
    });
    return {
      parallels: GLOBE_PARALLELS.map((p) => asLine(p, GRID, 0.22)),
      meridians: GLOBE_MERIDIANS.map((m) => asLine(m, GRID, 0.22)),
      equator: asLine(GLOBE_EQUATOR, "#7fd4ff", 0.75),
      tropics: GLOBE_TROPICS.map((t) => ({ ...asLine(t.points, ZODIAC, 0.6), id: t.id, lat: t.lat })),
    };
  }, []);

  /** Earth centre → Sun, and where that ray lands on the globe. */
  const sunRay = useMemo(() => makeDynamicLine(2, "#ffd166", 0.75), []);

  /** The celestial equator — the reference the ecliptic is visibly tilted against. */
  const equatorLine = useMemo(() => makeDynamicLine(ECLIPTIC_STEPS + 1, "#5aa9e6", 0.45), []);

  /** Almucantars and verticals, flattened into one segment list. */
  const gridSegments = useMemo(() => {
    const pairs: HorizonPoint[] = [];
    for (const line of GRID_LINES) {
      for (let i = 0; i < line.length - 1; i += 1) pairs.push(line[i], line[i + 1]);
    }
    return { src: pairs, object: makeDynamicSegments(pairs.length, GRID, 0.32) };
  }, []);

  const horizonRing = useMemo(() => makeLine(circlePoints(DOME * 0.999, 128), "#8fbfc1", 0.5), []);

  const shells = useMemo(
    () =>
      GEO_BODY_ORDER.filter((k) => k !== "rahu" && k !== "ketu").map((key) => ({
        key,
        points: circlePoints(1, 96),
        attach: (o: THREE.Line | null) => {
          shellRefs.current[key] = o ?? undefined;
        },
      })),
    [],
  );

  /** Stable ref callbacks per graha — fresh closures would churn every render. */
  const handles = useMemo(
    () =>
      Object.fromEntries(
        GEO_BODY_ORDER.map((key) => [
          key,
          {
            group: (o: THREE.Group | null) => {
              bodyRefs.current[key] = o ?? undefined;
            },
            spin: (o: THREE.Mesh | null) => {
              spinRefs.current[key] = o ?? undefined;
            },
            retro: (o: THREE.Group | null) => {
              retroRefs.current[key] = o ?? undefined;
            },
          },
        ]),
      ) as Record<
        GrahaKey,
        {
          group: (o: THREE.Group | null) => void;
          spin: (o: THREE.Mesh | null) => void;
          retro: (o: THREE.Group | null) => void;
        }
      >,
    [],
  );

  const frame = useRef(0);
  const gridBuilt = useRef(false);
  const lockedLst = useRef<number | null>(null);
  const lastSample = useRef(0);
  const lastTrailKey = useRef("");
  const labels = useRef<ScreenLabel[]>([]);
  const scratch = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());

  // Re-derive the trail as soon as the graha or the calibration changes, and
  // re-anchor a locked sky to whatever date the nav has just jumped to.
  useEffect(() => {
    lastTrailKey.current = "";
    lockedLst.current = null;
  }, [selectedKey, calibration, mode, observer]);

  useFrame((state, delta) => {
    try {
      runFrame(state, delta);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("SKY FRAME ERROR", err);
    }
  });

  function runFrame(state: Parameters<Parameters<typeof useFrame>[0]>[0], delta: number) {
    const s = sim.current;
    if (s.playing) s.timeMs += delta * s.secondsPerRealSecond * 1000;

    const date = new Date(s.timeMs);
    const sky = geocentricSky(date, calibration);
    const dtDays = daysSinceJ2000(date);
    const horizon = mode === "horizon";
    const globe = mode === "globe";
    const space = mode === "space";
    /* Both the dome and the globe draw the banded zodiac and place grahas on
       it; only the space view uses the schematic shells. */
    const zodiac = horizon || globe;

    const ayan = ayanamsa(dtDays);
    const eps = obliquity(dtDays);
    /* Locked, the sky keeps the sidereal time it had when the lock went on, so
       the belt stays put and only the grahas walk along it. */
    const liveLst = lstDeg(date, observer.lon);
    if (!toggles.lockStars) lockedLst.current = null;
    else if (lockedLst.current == null) lockedLst.current = liveLst;
    const lst = lockedLst.current ?? liveLst;

    /**
     * Ecliptic → the globe frame: Earth upright with its axis along +Y and its
     * equator in the XZ plane, and the ecliptic tilted off it by the obliquity
     * about the line of equinoxes.
     *
     * That single tilt is the whole story of the ayana. At tropical longitude 0
     * and 180 the ring crosses the equator — the two sampat. At 90 it stands
     * `eps` north (Karka Sankranti) and at 270 `eps` south (Makara Sankranti),
     * and the Sun riding the ring drags the subsolar point between the tropics
     * over the year: uttarayana climbing north, dakshinayana falling south.
     */
    const globePlace = (lonSid: number, latEc: number, radius: number): [number, number, number] => {
      /* The globe view runs the zodiac the opposite way round from the space
         view, by request: the ring is mirrored so the rashi read anticlockwise
         from this camera. */
      const [x, y, z] = eclipticToVec3(-(lonSid + ayan), latEc, radius);
      const c = Math.cos(eps * DEG);
      const s = Math.sin(eps * DEG);
      /* The tilt is mirrored with it, so tropical 90° still comes out `eps`
         north — Karka Sankranti at the Tropic of Cancer — and 270° `eps` south.
         Flip one without the other and uttarayana runs backwards. */
      return [x, y * c + z * s, -y * s + z * c];
    };

    /**
     * Sidereal ecliptic longitude → scene position, in whichever frame is live.
     *
     * Inside the dome the horizon frame is the honest one: you are standing on
     * a spinning Earth, so the whole sky wheels past. Zoomed out, the frame is
     * the Earth's own: the zodiac becomes a ring round the globe, fixed to the
     * stars — it only creeps by the ayanamsa, a degree per 72 years.
     */
    const place = (lonSid: number, latEc: number, spaceRadius: number): [number, number, number] => {
      if (space) return eclipticToVec3(lonSid, latEc, spaceRadius);
      if (globe) return globePlace(lonSid, latEc, GLOBE_BAND_R);
      const { alt, az } = eclipticToAltAz(lonSid + ayan, latEc, eps, lst, observer.lat);
      return altAzToVec3(alt, az, DOME);
    };

    /**
     * Whether a label anchor should be drawn. Overlay text has no depth test,
     * so inside the dome anything under the horizon has to be culled by hand,
     * and from outside the sphere anything on the far hemisphere does.
     */
    const labelVisible = (at: [number, number, number]) => {
      if (space) return true;
      if (horizon) return at[1] > 0.5;
      // Facing hemisphere only — the globe is opaque, so far-side names would
      // otherwise float over it.
      const c = state.camera.position;
      return at[0] * c.x + at[1] * c.y + at[2] * c.z > 0;
    };

    const width = state.size.width;
    const height = state.size.height;
    const collect = toggles.labels && frame.current % 6 === 0;
    const collected: ScreenLabel[] = [];
    const project = (label: Omit<ScreenLabel, "x" | "y">, at: [number, number, number]) => {
      scratch.current.set(at[0], at[1], at[2]).project(state.camera);
      if (scratch.current.z > 1) return;
      const x = (scratch.current.x * 0.5 + 0.5) * width;
      const y = (-scratch.current.y * 0.5 + 0.5) * height;
      if (x < -60 || y < -30 || x > width + 60 || y > height + 30) return;
      collected.push({ ...label, x, y });
    };

    /* ── bodies ─────────────────────────────────────────────────────── */
    let sunAltitude = -90;
    for (const key of GEO_BODY_ORDER) {
      const body = sky[key];
      const spaceR = shellRadius(key, body.distanceAu);
      const at = place(body.longitude, body.latitude, spaceR);

      if (key === "sun") {
        const { alt } = eclipticToAltAz(body.longitude + ayan, body.latitude, eps, lst, observer.lat);
        sunAltitude = alt;
      }

      const group = bodyRefs.current[key];
      if (group) {
        group.position.set(at[0], at[1], at[2]);
        const scale = globe
          ? (DOME_RADIUS[key] * GLOBE_BODY_SCALE) / BODY_RADIUS[key]
          : horizon
            ? DOME_RADIUS[key] / BODY_RADIUS[key]
            : bodyRadius(key, body.distanceAu) / BODY_RADIUS[key];
        group.scale.setScalar(scale);
        // Below the horizon a graha is simply not in the sky.
        group.visible = !horizon || at[1] > -DOME * 0.06;
      }

      const spin = spinRefs.current[key];
      // Slow signature spin so each body reads as a globe, not a disc.
      if (spin) spin.rotation.y = (dtDays * (key === "sun" ? 0.25 : 1.6) * Math.PI * 2) % (Math.PI * 2);

      const retro = retroRefs.current[key];
      if (retro) retro.visible = body.retrograde;

      const shell = shellRefs.current[key];
      if (shell) {
        shell.scale.setScalar(spaceR);
        shell.visible = space;
      }

      const ray = rays[key];
      setPoint(ray, 0, [0, 0, 0]);
      setPoint(ray, 1, space ? eclipticToVec3(body.longitude, body.latitude, RASHI_OUTER) : at);
      flushLine(ray);
      // Always drawn: the sight line is what ties a graha to its rashi.
      ray.visible = space ? true : globe ? false : at[1] > 0;

      // Below the horizon the ground hides the body, but a DOM label has no
      // depth test — so it has to be filtered out explicitly.
      if (collect && labelVisible(at)) {
        project({ id: `g-${key}`, kind: "graha", key }, at);
      }
    }

    /* ── the banded zodiac, the equator and the alt-az cage ──────────── */
    if (zodiac && toggles.belts) {
      for (const { src, object } of skyLines) {
        for (let i = 0; i < src.length; i += 1) {
          setPoint(object, i, place(src[i].lon, src[i].lat, 0));
        }
        flushLine(object);
      }

      if (horizon) {
        for (let i = 0; i <= ECLIPTIC_STEPS; i += 1) {
          // Declination 0 all the way round — the celestial equator, which the
          // ecliptic crosses at the two equinoxes and nowhere else. On the
          // globe this is drawn on the sphere itself instead.
          const eq = equatorialToAltAz({ ra: (i / ECLIPTIC_STEPS) * 360, dec: 0 }, lst, observer.lat);
          setPoint(equatorLine, i, altAzToVec3(eq.alt, eq.az, DOME * 0.997));
        }
        flushLine(equatorLine);
      }
    }

    if (horizon && toggles.grid && !gridBuilt.current) {
      // The cage is fixed to the observer, so it only needs building once.
      gridBuilt.current = true;
      for (let i = 0; i < gridSegments.src.length; i += 1) {
        const p = gridSegments.src[i];
        setPoint(gridSegments.object, i, altAzToVec3(p.alt, p.az, DOME * 0.995));
      }
      flushLine(gridSegments.object);
    }

    if (collect && toggles.belts) {
      for (let i = 0; i < 12; i += 1) {
        const lon = (i + 0.5) * RASHI_ARC;
        const at = place(lon, zodiac ? RASHI_LABEL_LAT : 0, RASHI_MID);
        if (labelVisible(at)) {
          project({ id: `r-${i}`, kind: "rashi", index: i + 1 }, at);
        }
      }
      for (let i = 0; i < 27; i += 1) {
        const lon = (i + 0.5) * NAKSHATRA_ARC;
        const at = place(lon, zodiac ? NAK_LABEL_LAT : 0, NAK_MID);
        if (labelVisible(at)) {
          project({ id: `n-${i}`, kind: "nakshatra", index: i + 1 }, at);
        }
      }
    }

    if (collect && horizon && !globe) {
      for (const c of COMPASS_POINTS) {
        project(
          { id: `c-${c.en}`, kind: "cardinal", text: c.en },
          altAzToVec3(0, c.az, DOME * 0.94),
        );
      }
      if (toggles.grid) {
        for (const az of GRID_AZIMUTH_LABELS) {
          if (az % 45 === 0) continue; // the compass already names those
          project(
            { id: `az-${az}`, kind: "azimuth", text: `${az}°` },
            altAzToVec3(4, az, DOME * 0.93),
          );
        }
      }
    }

    if (collect && globe) {
      /* The four turning points of the solar year, marked on the ring where
         they actually fall: the sampat on the equator, the ayana ends level
         with the two tropics. */
      for (const st of SOLAR_STATIONS) {
        const at = globePlace(st.tropicalLon - ayan, 0, GLOBE_BAND_R * 1.06);
        if (labelVisible(at)) {
          project({ id: `st-${st.id}`, kind: "station", text: st.id }, at);
        }
      }
      for (const t of globeLines.tropics) {
        // Put the tropic's name on the limb facing the camera.
        const at = geoToVec3(t.lat, 0, GLOBE_R * 1.02);
        scratch.current.set(at[0], at[1], at[2]);
        if (globeSpinRef.current) scratch.current.applyQuaternion(globeSpinRef.current.quaternion);
        const world: [number, number, number] = [
          scratch.current.x,
          scratch.current.y,
          scratch.current.z,
        ];
        if (labelVisible(world)) {
          project({ id: `tr-${t.id}`, kind: "tropic", text: t.id }, world);
        }
      }
    }

    /* ── frame-level scenery ────────────────────────────────────────── */
    if (earthGroupRef.current) earthGroupRef.current.visible = space;
    // The globe replaces the ground: from out here you are looking at the whole
    // Earth, not standing on a patch of it.
    if (groundRef.current) groundRef.current.visible = horizon && !globe;
    if (spaceOnlyRef.current) spaceOnlyRef.current.visible = space;
    if (globeRootRef.current) globeRootRef.current.visible = globe;
    for (const { object } of skyLines) object.visible = zodiac && toggles.belts;
    equatorLine.visible = horizon && !globe && toggles.belts;
    gridSegments.object.visible = horizon && !globe && toggles.grid;
    horizonRing.visible = horizon && !globe;
    if (horizonGroupRef.current) horizonGroupRef.current.quaternion.identity();

    /* ── the Earth globe ────────────────────────────────────────────── */
    if (globe) {
      // The graticule turns with the Earth; the zodiac ring around it does not.
      if (globeSpinRef.current) {
        const spin = toggles.lockStars
          ? 0
          : ((dtDays * 86400) / SIDEREAL_DAY_S) * Math.PI * 2;
        // Mirrored frame, so the Earth's eastward turn is negative here.
        globeSpinRef.current.rotation.y = -(spin % (Math.PI * 2));
      }
      for (const { object } of globeLines.parallels) object.visible = toggles.grid;
      for (const { object } of globeLines.meridians) object.visible = toggles.grid;
      globeLines.equator.object.visible = true;
      for (const { object } of globeLines.tropics) object.visible = true;

      /* The Sun's ray, and the subsolar point it plants on the globe — the
         thing that climbs to the Tropic of Cancer and back. */
      const sunAt = place(sky.sun.longitude, sky.sun.latitude, GLOBE_BAND_R);
      const len = Math.hypot(sunAt[0], sunAt[1], sunAt[2]) || 1;
      setPoint(sunRay, 0, [0, 0, 0]);
      setPoint(sunRay, 1, sunAt);
      flushLine(sunRay);
      sunRay.visible = true;
      if (subsolarRef.current) {
        subsolarRef.current.position.set(
          (sunAt[0] / len) * GLOBE_R * 1.01,
          (sunAt[1] / len) * GLOBE_R * 1.01,
          (sunAt[2] / len) * GLOBE_R * 1.01,
        );
      }
    } else {
      sunRay.visible = false;
    }

    if (earthRef.current) {
      earthRef.current.rotation.y = ((dtDays * 86400) / SIDEREAL_DAY_S) * Math.PI * 2;
    }
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.04;

    // The Sun is the only real light source; put it exactly where the Sun is drawn.
    if (sunLightRef.current) {
      const sunGroup = bodyRefs.current.sun;
      if (sunGroup) sunLightRef.current.position.copy(sunGroup.position);
      sunLightRef.current.intensity = horizon ? 1400 : globe ? 700 : 90;
    }

    /* ── camera ─────────────────────────────────────────────────────── */
    const v = view.current;
    const cam = state.camera as THREE.PerspectiveCamera;
    if (horizon) {
      /* Standing at the centre, the only thing zoom can do is change the lens:
         a 6° telescopic crop at one end, a 160° fisheye that swallows nearly
         the whole dome at the other. The sky itself never changes shape. */
      const cosP = Math.cos(v.pitch);
      cam.position.set(0, 0, 0);
      target.current.set(
        DOME * cosP * Math.sin(v.yaw),
        DOME * Math.sin(v.pitch),
        -DOME * cosP * Math.cos(v.yaw),
      );
      cam.lookAt(target.current);
      const fov = Math.min(160, Math.max(6, (v.distance / 26) * 70));
      if (Math.abs(cam.fov - fov) > 0.01) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
      }
    } else if (globe) {
      /* A long lens from far back — as close to an orthographic globe as a
         perspective camera gets. The +Y matters: the camera has to stay on the
         side of the ecliptic the pitch asks for, because from underneath the
         whole zodiac runs backwards and every graha appears to go clockwise. */
      const cosP = Math.cos(v.pitch);
      /* Zoom is optical, not positional: the camera stays parked well outside
         the globe and the lens narrows, so you can push in to a couple of
         degrees of ring without ever ending up inside the Earth. */
      const t = Math.min(1, Math.max(0, v.distance / OUTSIDE_ZOOM_MAX));
      const framed = 1.4 + Math.pow(t, 1.25) * (GLOBE_BAND_R * 2 - 1.4);
      const radius = GLOBE_CAM_R;
      const fov = (2 * Math.atan(framed / radius)) / DEG;
      cam.position.set(
        radius * cosP * Math.sin(v.yaw),
        radius * Math.sin(v.pitch),
        radius * cosP * Math.cos(v.yaw),
      );
      target.current.set(0, 0, 0);
      cam.lookAt(target.current);
      if (Math.abs(cam.fov - fov) > 0.01) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
      }
    } else {
      const focusGroup = focusKey !== "earth" ? bodyRefs.current[focusKey] : null;
      if (focusGroup) target.current.copy(focusGroup.position);
      else target.current.set(0, 0, 0);

      const cosP = Math.cos(v.pitch);
      cam.position.set(
        target.current.x + v.distance * cosP * Math.sin(v.yaw),
        target.current.y + v.distance * Math.sin(v.pitch),
        target.current.z + v.distance * cosP * Math.cos(v.yaw),
      );
      cam.lookAt(target.current);
      if (Math.abs(cam.fov - 50) > 0.01) {
        cam.fov = 50;
        cam.updateProjectionMatrix();
      }
    }

    frame.current += 1;

    /* ── trails ─────────────────────────────────────────────────────── */
    if (frame.current % 12 === 0) {
      const epoch = `${mode}:${Math.floor(dtDays / 2)}`;
      if (epoch !== lastTrailKey.current) {
        lastTrailKey.current = epoch;
        for (const key of GEO_BODY_ORDER) {
          const line = trails[key];
          for (let i = 0; i <= TRAIL_STEPS; i += 1) {
            const offsetDays = -TRAIL_DAYS + (i / TRAIL_STEPS) * TRAIL_DAYS * 2;
            const at = new Date(s.timeMs + offsetDays * 86400000);
            const b = geocentricBody(key, at, calibration);
            if (space) {
              setPoint(line, i, eclipticToVec3(b.longitude, b.latitude, shellRadius(key, b.distanceAu)));
            } else {
              // Held at the current sidereal time, so the trail shows the
              // graha's own motion against the stars, not the Earth's spin.
              setPoint(line, i, place(b.longitude, b.latitude, DOME * 0.99));
            }
          }
          flushLine(line);
        }
      }
    }

    if (collect) labels.current = collected;

    if (state.clock.elapsedTime - lastSample.current > 0.2) {
      lastSample.current = state.clock.elapsedTime;
      onSample({ timeMs: s.timeMs, sky, labels: labels.current, sunAltitude });
    }
  }

  return (
    <group>
      <ambientLight ref={ambientRef} intensity={0.28} />
      <pointLight ref={sunLightRef} intensity={90} distance={0} decay={2} color="#fff6e0" />
      {/* A hint of fill so the night side is shape rather than a hole. */}
      <directionalLight position={[0, 12, 0]} intensity={0.1} />

      <mesh ref={starsRef}>
        <sphereGeometry args={[400, 48, 48]} />
        <meshBasicMaterial map={textures.background} side={THREE.BackSide} transparent />
      </mesh>

      {/* Space view: the Earth itself, tilted by the obliquity of the ecliptic. */}
      <group ref={earthGroupRef} rotation={[0, 0, 23.44 * DEG]}>
        <mesh ref={earthRef}>
          <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
          <meshStandardMaterial
            map={textures.earth}
            emissive="#ffffff"
            emissiveMap={textures.earth}
            emissiveIntensity={0.1}
            roughness={0.85}
            metalness={0.02}
          />
        </mesh>
        <mesh ref={cloudRef}>
          <sphereGeometry args={[EARTH_RADIUS * 1.02, 48, 48]} />
          <meshStandardMaterial map={textures.earthclouds} transparent opacity={0.45} depthWrite={false} />
        </mesh>
        {/* Polar axis — the diurnal spin that walks the lagna round the zodiac. */}
        <mesh>
          <cylinderGeometry args={[0.01, 0.01, EARTH_RADIUS * 3, 8]} />
          <meshBasicMaterial color={INK_DIM} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* The observer's own frame: the ground underfoot, the horizon circle and
          the alt-az cage. Standing inside, this is the identity; seen from
          outside the sphere it turns once a sidereal day while the zodiac
          stays nailed to the stars. */}
      <group ref={horizonGroupRef}>
        <group ref={groundRef} visible={false}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
            <circleGeometry args={[DOME * 1.02, 96]} />
            {/* Not opaque: the sky below your feet still belongs to the sphere,
                so it stays faintly readable rather than becoming a black slab. */}
            <meshBasicMaterial
              color="#06110f"
              side={THREE.DoubleSide}
              transparent
              opacity={0.82}
            />
          </mesh>
        </group>
        <primitive object={horizonRing} />
        <primitive object={gridSegments.object} />
      </group>

      {/* The Earth globe: a dark ball carrying nothing but its graticule, with
          the zodiac ring hugging it. Zooming out of the horizon view lands
          here. */}
      <group ref={globeRootRef} visible={false}>
        {/* Opaque body, so the far side of the grid and the ring is hidden and
            the Sun's light picks out the lit half. */}
        <mesh ref={shellRef}>
          <sphereGeometry args={[GLOBE_R * 0.995, 64, 64]} />
          <meshStandardMaterial color="#0a1a22" roughness={1} metalness={0} />
        </mesh>

        {/* Turns once a sidereal day; the ring globe it does not. */}
        <group ref={globeSpinRef}>
          {globeLines.parallels.map(({ object }, i) => (
            <primitive key={`par-${i}`} object={object} />
          ))}
          {globeLines.meridians.map(({ object }, i) => (
            <primitive key={`mer-${i}`} object={object} />
          ))}
          <primitive object={globeLines.equator.object} />
          {globeLines.tropics.map(({ object, id }) => (
            <primitive key={`trop-${id}`} object={object} />
          ))}
          {/* Where you are watching from. */}
          <mesh position={geoToVec3(observer.lat, observer.lon, GLOBE_R * 1.005)}>
            <sphereGeometry args={[GLOBE_R * 0.022, 12, 12]} />
            <meshBasicMaterial color="#ff6b6b" />
          </mesh>
        </group>

        {/* The Sun's ray and the subsolar point it plants between the tropics. */}
        <primitive object={sunRay} />
        <mesh ref={subsolarRef}>
          <sphereGeometry args={[GLOBE_R * 0.03, 14, 14]} />
          <meshBasicMaterial color="#ffd166" />
        </mesh>

        {/* Earth's axis, drawn out past the poles. */}
        <mesh>
          <cylinderGeometry args={[GLOBE_R * 0.006, GLOBE_R * 0.006, GLOBE_R * 2.5, 8]} />
          <meshBasicMaterial color={INK_DIM} transparent opacity={0.45} />
        </mesh>
      </group>

      <group ref={spaceOnlyRef}>
        {shells.map(({ key, points, attach }) => (
          <ShellLine key={key} points={points} attach={attach} />
        ))}

        {toggles.belts ? (
          <group>
            {/* Rashi belt: 12 × 30°. */}
            <Belt inner={RASHI_INNER} outer={RASHI_OUTER} color="#0f3234" opacity={0.8} />
            <BeltDivisions count={12} inner={RASHI_INNER} outer={RASHI_OUTER} color={SEP} opacity={0.85} />
            {/* Nakshatra belt: 27 × 13°20′, with pada ticks at 108. */}
            <Belt inner={NAK_INNER} outer={NAK_OUTER} color="#0a2426" opacity={0.8} />
            <BeltDivisions count={27} inner={NAK_INNER} outer={NAK_OUTER} color={SEP} opacity={0.6} />
            <BeltDivisions count={108} inner={NAK_OUTER - 0.2} outer={NAK_OUTER} color={INK_DIM} opacity={0.4} />
          </group>
        ) : null}
      </group>

      {skyLines.map(({ object }, i) => (
        <primitive key={`band-${i}`} object={object} />
      ))}
      <primitive object={equatorLine} />

      {GEO_BODY_ORDER.map((key) => (
        <GrahaBody
          key={key}
          graha={key}
          textures={textures}
          selected={selectedKey === key}
          groupRef={handles[key].group}
          spinRef={handles[key].spin}
          retroRef={handles[key].retro}
          onSelect={() => onSelect(key)}
        />
      ))}

      {GEO_BODY_ORDER.map((key) => (
        <primitive key={`ray-${key}`} object={rays[key]} />
      ))}

      {GEO_BODY_ORDER.map((key) => (
        <primitive key={`trail-${key}`} object={trails[key]} />
      ))}
    </group>
  );
}

/** A unit-radius ring the frame loop scales to the graha's live distance. */
function ShellLine({
  points,
  attach,
}: {
  points: THREE.Vector3[];
  attach: (o: THREE.Line | null) => void;
}) {
  const object = useMemo(() => makeLine(points, INK_DIM, 0.16), [points]);
  useEffect(() => {
    attach(object);
    return () => attach(null);
  }, [object, attach]);
  return <primitive object={object} />;
}

export default AakashGocharScene;
