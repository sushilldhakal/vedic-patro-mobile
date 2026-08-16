/**
 * What the playground shows, per Learn topic.
 *
 * One scene serves every topic — building a bespoke 3D scene per article would
 * mean one per article. What changes is the *configuration*: which layers open
 * on, what the play button actually moves, and where the camera starts. So a
 * topic about the day opens spinning the planet with the day-arcs showing,
 * while one about sankranti opens creeping round the rashi belt with the arcs
 * off and the Sun's sightline lit.
 *
 * Every control stays reachable in all of them. The config only decides where
 * a reader *starts*, so the article's own subject is what is on screen first
 * and everything else is one chip away.
 *
 * Adding a topic is one entry here. A topic with no entry gets no playground,
 * which is the right default for the ones the sim cannot honestly illustrate.
 */

import type { CameraState, SimParams, SimToggles } from "@/components/learn/playground/DaySimScene";

/**
 * What the play button animates.
 *
 * The distinction is what the reader is meant to watch, and each one runs the
 * clock at a rate that makes that motion legible — a year that takes a minute
 * makes the planet's spin a useless blur, and a spin slow enough to follow
 * makes the orbit look frozen.
 */
export type PlaygroundMode =
  /** Spin: a few rotations per orbit, so the extra turn is enormous. */
  | "day"
  /** Orbit: one lap in about half a minute, spin too fast to follow. */
  | "year"
  /** The Sun's track along the belt — sankranti to sankranti. */
  | "sun"
  /** The Sun leaving the equator and coming back — the tilt's own signature. */
  | "tilt";

export interface PlaygroundConfig {
  mode: PlaygroundMode;
  /** Layers open on load. Anything unset falls back to the mode's own default. */
  layers?: Partial<SimToggles>;
  params?: Partial<SimParams>;
  camera?: Partial<CameraState>;
}

const DEG = Math.PI / 180;

/** Layer sets each mode starts from, before a topic's own overrides. */
export const MODE_LAYERS: Record<PlaygroundMode, SimToggles> = {
  day: {
    grid: false,
    planetOrbit: true,
    sunOrbit: false,
    trueSun: true,
    meanSun: true,
    eotWedge: true,
    siderealArc: true,
    solarArc: true,
    meanArc: true,
    primeMeridian: true,
    axis: true,
    rashiBelt: false,
    nakshatraBelt: false,
    monthRing: false,
    sightline: false,
    moon: false,
    moonTrail: false,
    moonLap: false,
    moonSightline: false,
  },
  year: {
    grid: false,
    planetOrbit: true,
    sunOrbit: false,
    trueSun: true,
    meanSun: false,
    eotWedge: false,
    siderealArc: false,
    solarArc: false,
    meanArc: false,
    primeMeridian: false,
    axis: false,
    rashiBelt: true,
    nakshatraBelt: false,
    monthRing: true,
    sightline: true,
    moon: true,
    moonTrail: true,
    moonLap: true,
    moonSightline: true,
  },
  sun: {
    grid: false,
    planetOrbit: true,
    sunOrbit: false,
    trueSun: true,
    meanSun: false,
    eotWedge: false,
    siderealArc: false,
    solarArc: false,
    meanArc: false,
    primeMeridian: false,
    axis: false,
    rashiBelt: true,
    nakshatraBelt: true,
    monthRing: true,
    sightline: true,
    moon: false,
    moonTrail: false,
    moonLap: false,
    moonSightline: false,
  },
  tilt: {
    grid: true,
    planetOrbit: true,
    sunOrbit: true,
    trueSun: true,
    meanSun: true,
    eotWedge: true,
    siderealArc: false,
    solarArc: false,
    meanArc: false,
    primeMeridian: false,
    /* This mode's whole subject is the tilt, so the axis it is measured
       against opens on even though the meridian does not. */
    axis: true,
    rashiBelt: true,
    nakshatraBelt: false,
    monthRing: true,
    sightline: false,
    moon: false,
    moonTrail: false,
    moonLap: false,
    moonSightline: false,
  },
};

/**
 * Base pace per mode, in sidereal rotations of simulated time per real second.
 *
 * These are absolute rotation rates, and the modes disagree wildly about how
 * many rotations a year holds — nine in the day mode, 366 in the belt ones. So
 * the speed rungs in the UI multiply *this*, rather than setting a rate
 * directly: rung 2 is always "the pace this topic wants", and the others are
 * relative to it. A single absolute ladder would be a crawl in one mode and a
 * strobe in another.
 */
export const MODE_SPEED: Record<PlaygroundMode, number> = {
  day: 0.2,
  /* ~30s for a full year at rung 2. */
  year: 12,
  sun: 9,
  tilt: 11,
};

/**
 * Speed rungs, as multiples of the mode's own base pace. Rung 3 is 1×.
 *
 * The two rungs below 1× exist for a different question than the rest of the
 * ladder. At 1× the belt modes cross a year in about thirty seconds, which is
 * the right pace for watching a year — and far too fast to watch a *day*: the
 * globe is turning several times a second, so the gap the three clocks are
 * opening up cannot be read at all. 0.05× is one rotation every couple of
 * seconds, slow enough to watch a single day's ~4 minutes appear.
 */
export const SPEED_MULTIPLIERS = [0.05, 0.1, 0.25, 1, 3, 8];

/** Days per year each mode wants — small for spin, real-ish for the belt. */
export const MODE_PARAMS: Record<PlaygroundMode, SimParams> = {
  /* `daysPerYear` counts *sidereal* rotations, so it is always one more than
     the solar days the reader sets. A real year is 365 solar days and 366
     turns — which is the whole point, and what the belt modes now use. Only
     the day mode keeps a toy year, because at 365 the extra turn is a third of
     a degree and the three arcs sit on top of each other. */
  day: { daysPerYear: 9, eccentricity: 0.0167, tilt: 23.439 * DEG },
  year: { daysPerYear: 366, eccentricity: 0.0167, tilt: 23.439 * DEG },
  sun: { daysPerYear: 366, eccentricity: 0.0167, tilt: 23.439 * DEG },
  tilt: { daysPerYear: 366, eccentricity: 0.0167, tilt: 23.439 * DEG },
};

export const MODE_CAMERA: Record<PlaygroundMode, CameraState> = {
  day: { yaw: 0.2, pitch: 0.95, distance: 26 },
  year: { yaw: 0.2, pitch: 1.15, distance: 70 },
  sun: { yaw: 0.2, pitch: 1.15, distance: 76 },
  /* Low to the plane, because the whole point is the Sun rising out of it. */
  tilt: { yaw: 0.35, pitch: 0.22, distance: 62 },
};

/**
 * Topics that carry a playground, and how each one opens.
 *
 * Grouped by what the topic is actually about rather than by the Learn
 * library's own sections, because that is what decides the mode.
 */
export const PLAYGROUND_BY_SLUG: Record<string, PlaygroundConfig> = {
  /* ── the day itself ──────────────────────────────────────────────── */
  "how-we-calculate": { mode: "day" },
  /* होरा divides the day into twenty-four graha hours, so the topic's own
     subject is the rotation the three arcs measure. */
  hora: { mode: "day" },

  /* ── the year and the orbit ──────────────────────────────────────── */
  "bs-calendar": { mode: "year" },
  "solar-system": { mode: "year" },
  /* `calendar-differences` and `adhik-maas` are not here on purpose — they get
     the सौरमान/चान्द्रमान study instead. See {@link TWO_SYSTEMS_SLUGS}. */

  /* ── the Moon: तिथि and its two irregularities ───────────────────── */
  tithi: {
    mode: "year",
    layers: { moon: true, moonLap: true, moonSightline: true, nakshatraBelt: true },
  },
  "tithi-vriddhi": { mode: "year", layers: { moon: true, moonLap: true } },
  "tithi-kshaya": { mode: "year", layers: { moon: true, moonLap: true } },

  /* ── the Sun along the belt ──────────────────────────────────────── */
  sankranti: { mode: "sun" },
  "astronomy-basics": { mode: "sun" },
  ayanamsha: { mode: "sun", layers: { nakshatraBelt: true } },
  "what-is-panchang": {
    mode: "sun",
    /* पञ्चाङ्ग's five limbs are all read off the Sun's and the Moon's
       longitudes, so both sightlines open lit. */
    layers: { nakshatraBelt: true, moon: true, moonSightline: true },
  },
  nakshatra: {
    /* The नक्षत्र a पञ्चाङ्ग names is the Moon's, so this topic opens with the
       Moon and its sightline rather than the Sun's. */
    mode: "sun",
    layers: { nakshatraBelt: true, moon: true, moonSightline: true },
  },

  /* ── ग्रहण ───────────────────────────────────────────────────────── */
  /* The sim decides an eclipse the way an almanac does — is the Moon inside
     the latitude limit at syzygy — so राहु and केतु travelling round the node
     line is the topic's own subject, not decoration. */
  eclipses: {
    mode: "year",
    layers: { moon: true, moonTrail: true, moonSightline: true },
  },

  /* ── the tilt and what it causes ─────────────────────────────────── */
  "ritu-drift": { mode: "tilt" },
};

export function playgroundFor(slug: string): PlaygroundConfig | undefined {
  return PLAYGROUND_BY_SLUG[slug];
}

/**
 * Topics that carry the सौरमान/चान्द्रमान study instead of the day playground.
 *
 * A different scene answering a different question: the playground is a model
 * you set the dials on, while `TwoSystemsStudy` runs the *real* ephemeris over
 * the actual current year and lays the two ladders — twelve सङ्क्रान्ति against
 * however many औंसी fit inside them — on one timeline. Only that second scene
 * can end on the ~11-day shortfall by measuring it, which is what these two
 * topics are for.
 *
 * The two sets are deliberately disjoint. Both scenes are WebGL canvases and
 * both animate; putting a pair of them in one scrolling article costs two live
 * GL contexts and two render loops on a device that has better uses for both.
 * So each topic gets whichever scene argues its own point, and never both.
 *
 * The web places this scene differently — on its geocentric-vs-heliocentric and
 * retrograde chapters, which have no counterpart in this app's topic list. The
 * scene is the same; where it earns its place is not, because the two Learn
 * libraries hold different articles.
 */
export const TWO_SYSTEMS_SLUGS = new Set(["calendar-differences", "adhik-maas"]);

export function hasTwoSystems(slug: string): boolean {
  return TWO_SYSTEMS_SLUGS.has(slug);
}

/** The config resolved into the full state the playground opens with. */
export function resolvePlayground(config: PlaygroundConfig) {
  return {
    mode: config.mode,
    toggles: { ...MODE_LAYERS[config.mode], ...config.layers },
    params: { ...MODE_PARAMS[config.mode], ...config.params },
    camera: { ...MODE_CAMERA[config.mode], ...config.camera },
    speed: MODE_SPEED[config.mode],
  };
}
