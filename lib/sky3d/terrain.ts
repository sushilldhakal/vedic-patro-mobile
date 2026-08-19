/**
 * The ground the क्षितिज view stands on — a 360° skyline, generated rather than drawn.
 *
 * The horizon view puts the reader at the centre of a dome with the camera at
 * the origin, so "the ground" is whatever fills the lower half of every
 * direction at once. A flat disc does that, but it says only *down*: no skyline,
 * so the compass points sit on a drawn circle and nothing tells you that the
 * Sun is about to clear a ridge rather than the mathematical horizon.
 *
 * This builds a radial fan instead — hills all the way round, densest in
 * azimuth because the silhouette is the whole point.
 *
 * ## Why the height field is shaped the way it is
 *
 * The ground is drawn as a blended veil with **no depth write**, so the reader
 * can still make out the alt-az cage and the far half of the zodiac beneath it
 * (see `AakashGocharScene`'s ground group). That buys the transparency but
 * gives up depth sorting: two overlapping terrain triangles would blend with
 * each other in index order and the hills would come out as a lattice of bright
 * seams.
 *
 * So the height field is built to be *provably single-valued from the origin*.
 * Along any one azimuth, height only ever increases with radius:
 *
 * - every radial profile below is monotonically non-decreasing in `t`, and
 * - every ridge term is non-negative,
 *
 * and a sum of non-decreasing functions is non-decreasing. The farthest point
 * along a ray is therefore always its highest, no nearer ground can rise in
 * front of ground behind it, and the fan covers each screen direction exactly
 * once. Overlap is impossible, so the veil composites cleanly.
 *
 * That is also why relief is carried by the *azimuth* noise and only scaled by
 * radius: a bump that rose and fell with distance would break the property
 * immediately.
 *
 * ## Why it is seeded
 *
 * The app prerenders its pages, and this geometry has to be identical between
 * the server pass and hydration — an unseeded `Math.random()` skyline would
 * also reshuffle itself on every remount, which fullscreen does. Seeding it
 * from the observer's own coordinates goes one better: काठमाडौँ gets one ring of
 * hills and keeps it, and moving the observer moves you to a different place
 * rather than to the same place with new scenery.
 */

import * as THREE from "three";

/**
 * Bit-mixing PRNG (mulberry32). Small, fast, and — the only thing that matters
 * here — the same sequence for the same seed in every JS engine.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hermite smoothstep, clamped — the ramp every profile below is built from. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * A smooth random function of angle that closes exactly on itself after one
 * turn — `waves` control values round the circle, smoothstepped between.
 *
 * Interpolated with smoothstep rather than a spline on purpose: a Catmull-Rom
 * through random controls overshoots its endpoints, which would put negative
 * values into a term the no-overlap argument above needs to keep non-negative.
 * Smoothstep never leaves the interval between the two controls it sits on, so
 * the result is bounded by [0, 1) for free.
 *
 * @param turn Position round the circle, in turns. Any real number; wrapped.
 */
function periodicNoise(waves: number, rand: () => number): (turn: number) => number {
  const control = Array.from({ length: waves }, () => rand());
  return (turn: number) => {
    const x = (((turn % 1) + 1) % 1) * waves;
    const i = Math.floor(x);
    const f = x - i;
    const a = control[i % waves];
    const b = control[(i + 1) % waves];
    return a + (b - a) * f * f * (3 - 2 * f);
  };
}

/**
 * Sum of {@link periodicNoise} octaves, stretched to use the whole of [0, 1]
 * and then gamma-shaped so it spends more of its time low: broad valleys with
 * distinct ridges, rather than the even swell a plain noise sum gives.
 *
 * The stretch is the part that matters. Independent octaves practically never
 * reach their extremes together, so a plain sum of four of them wanders around
 * the middle of its nominal range and never comes near zero. Left like that the
 * skyline is a ring of hills with no gap anywhere in it — the true horizon, and
 * with it every rising and setting point, is buried the whole way round. Fixing
 * the ends against the profile's own measured range is what puts passes back in
 * the ridge.
 */
function ridgeProfile(
  rand: () => number,
  octaves: readonly { waves: number; amp: number }[],
  sharpness: number,
): (turn: number) => number {
  const layers = octaves.map(({ waves, amp }) => ({ noise: periodicNoise(waves, rand), amp }));
  const total = layers.reduce((sum, l) => sum + l.amp, 0);
  const raw = (turn: number) => {
    let v = 0;
    for (const { noise, amp } of layers) v += noise(turn) * amp;
    return v / total;
  };

  /* Sampled well past the finest octave, so the measured range is the real one.
     Anything the grid still misses lands just outside [0, 1] and is clamped —
     which it has to be, because `Math.pow` of a negative base is NaN and
     because the no-overlap argument needs this to stay non-negative. */
  const steps = Math.max(512, 8 * Math.max(...octaves.map((o) => o.waves)));
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < steps; i += 1) {
    const v = raw(i / steps);
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const span = hi - lo || 1;

  return (turn: number) => {
    const v = (raw(turn) - lo) / span;
    return Math.pow(Math.min(1, Math.max(0, v)), sharpness);
  };
}

/**
 * The far skyline: a handful of big masses with finer ridges riding on them.
 * This is the edge read against the stars, so it carries most of the detail.
 */
const FAR_OCTAVES = [
  { waves: 5, amp: 1 },
  { waves: 11, amp: 0.52 },
  { waves: 23, amp: 0.26 },
  { waves: 47, amp: 0.13 },
] as const;

/**
 * The shoulder each mass sits on — a second, coarser rise that comes up closer
 * in, so a ridge has foothills leading to it instead of being a single slope.
 *
 * Applied as a *multiplier* on the far ridge rather than added beside it, which
 * is what keeps the passes open: where the far ridge is zero this is zero too,
 * so those azimuths stay flat ground all the way to the rim and the true horizon
 * shows through. Added independently, its own non-zero minimum would lift the
 * whole skyline off the horizon again — the very thing the stretch above fixes.
 */
const NEAR_OCTAVES = [
  { waves: 3, amp: 1 },
  { waves: 7, amp: 0.45 },
] as const;

/** Where the far ridges start lifting off the valley floor, as a radius fraction. */
const FAR_ONSET = 0.34;
/** Where the near shelf rises, and where it levels out. Must both precede the rim. */
const NEAR_ONSET = 0.06;
const NEAR_CREST = 0.62;
/** How much of the total relief the near shelf is allowed. */
const NEAR_SHARE = 0.26;

/**
 * Radius spacing bias. Below 1 pushes rings outward, which is where they are
 * needed: standing 0.6 units above the floor, everything past a few units of
 * radius is squeezed into the last degree or so under the horizon, and that
 * sliver is the entire skyline.
 */
const RADIAL_BIAS = 0.62;

/**
 * How sharply the floor lets go of `baseY` and comes up to eye level at the rim.
 *
 * A real plane never reaches eye level — its *angle* goes to zero instead — but
 * a disc of finite radius leaves a hairline of sky between its edge and the
 * horizon. Bringing the last ring to y = 0 closes that seam. The high power
 * keeps the lift inside the outermost rings, where it is well under a pixel.
 */
const FLOOR_LIFT_POWER = 5;

/** Fraction of the radius over which the rim fades out into haze. */
const RIM_FADE = 0.1;

/** How dark the rim gets — a silhouette, so the skyline reads against the stars. */
const RIM_SHADE = 0.1;
/** How light the ground underfoot is, so it reads as ground and not as a hole. */
const FOOT_SHADE = 0.6;
/** How much a ridge's own height brightens it, keeping the skyline from going flat. */
const RELIEF_SHADE = 0.34;

export type HorizonTerrainOptions = {
  /** Outer radius. Put it at or a little past the dome the sky is drawn on. */
  radius: number;
  /**
   * Height of the valley floor directly underfoot, scene units. Negative — the
   * observer's eye is at y = 0, so this is how far down the ground starts.
   */
  baseY: number;
  /**
   * How far the tallest ridge stands above {@link baseY}, scene units. What
   * matters visually is `atan(relief / radius)`: the degrees of sky the skyline
   * takes up. Generous enough to read, small enough that the ground is not
   * eating the constellations.
   */
  relief: number;
  /**
   * Steps round the circle. This sets how smooth the silhouette is and is worth
   * far more than {@link rings} — a coarse ring count is invisible, a coarse
   * sector count turns every ridge into a staircase.
   */
  sectors?: number;
  /** Steps out from the observer. Carries the shading gradient, little else. */
  rings?: number;
  seed?: number;
};

export type HorizonTerrain = {
  geometry: THREE.BufferGeometry;
  /** How high the tallest point on the skyline stands, degrees above the horizon. */
  skylineDeg: number;
};

/**
 * Build the ground for one place.
 *
 * The returned geometry carries `position` and a four-component `color`
 * (`vertexColors`, with alpha — three.js reads itemSize 4 as `USE_COLOR_ALPHA`).
 * Colour is a neutral shading ramp meant to be *multiplied* by whatever land
 * colour the caller sets on the material, so the same geometry can be tinted
 * from night slate to daylit earth without being rebuilt. Alpha is the rim
 * fade only; the caller's `material.opacity` scales it for the क्षितिजमुनि veil.
 *
 * Scene frame matches `horizon.ts`: +Y is the zenith, +X east, −Z north, so
 * azimuth 0 points at the north compass mark and the hills stay put against it.
 *
 * The caller owns the geometry and must dispose it.
 */
export function buildHorizonTerrain({
  radius,
  baseY,
  relief,
  sectors = 256,
  rings = 56,
  seed = 1,
}: HorizonTerrainOptions): HorizonTerrain {
  const rand = mulberry32(seed);
  const far = ridgeProfile(rand, FAR_OCTAVES, 1.6);
  const near = ridgeProfile(rand, NEAR_OCTAVES, 1.2);

  const cols = sectors + 1; // the seam is duplicated so the shading wraps cleanly
  const count = (rings + 1) * cols;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 4);

  let skylineDeg = 0;

  for (let ring = 0; ring <= rings; ring += 1) {
    const t = Math.pow(ring / rings, RADIAL_BIAS);
    const r = radius * t;
    /* Both ramps are non-decreasing in t and both ridge values are ≥ 0 — this
       is the monotonicity the no-overlap argument in the file header rests on.
       Split so the two together come to exactly `relief` at the highest point
       on the rim, which is what makes `relief` mean what it says. */
    const farRamp = smoothstep(FAR_ONSET, 1, t) * relief * (1 - NEAR_SHARE);
    const nearRamp = smoothstep(NEAR_ONSET, NEAR_CREST, t) * relief * NEAR_SHARE;
    const floorY = baseY * (1 - Math.pow(t, FLOOR_LIFT_POWER));
    const fade = 1 - smoothstep(1 - RIM_FADE, 1, t);
    const shade = RIM_SHADE + (FOOT_SHADE - RIM_SHADE) * Math.pow(1 - t, 1.7);

    for (let sector = 0; sector <= sectors; sector += 1) {
      const turn = sector / sectors;
      const az = turn * Math.PI * 2;
      const ridge = far(turn);
      const lift = ridge * (farRamp + near(turn) * nearRamp);
      const y = floorY + lift;

      const i = ring * cols + sector;
      positions[i * 3] = r * Math.sin(az);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = -r * Math.cos(az);

      const c = shade * (1 - RELIEF_SHADE + RELIEF_SHADE * 2 * ridge);
      colors[i * 4] = c;
      colors[i * 4 + 1] = c;
      colors[i * 4 + 2] = c;
      colors[i * 4 + 3] = fade;

      if (r > 0) skylineDeg = Math.max(skylineDeg, (Math.atan2(y, r) * 180) / Math.PI);
    }
  }

  /* Two triangles per quad, skipping the degenerate innermost band where every
     sector collapses onto the centre point. */
  const indices: number[] = [];
  for (let ring = 1; ring <= rings; ring += 1) {
    for (let sector = 0; sector < sectors; sector += 1) {
      const a = (ring - 1) * cols + sector;
      const b = a + 1;
      const c = ring * cols + sector;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return { geometry, skylineDeg };
}

/**
 * A stable seed for one place on Earth.
 *
 * Quantised to a hundredth of a degree — about a kilometre — so the same city
 * always raises the same hills, and so a coordinate that arrives with float
 * noise on it does not count as somewhere new.
 */
export function terrainSeed(lat: number, lon: number): number {
  const a = Math.round(lat * 100);
  const b = Math.round(lon * 100);
  return (Math.imul(a, 73856093) ^ Math.imul(b, 19349663)) >>> 0;
}
