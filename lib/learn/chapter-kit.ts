/**
 * The shared vocabulary every guided chapter is written in.
 *
 * One 3D scene serves the whole Learn library, and a *chapter* is a timed
 * script that drives it: a state the scene opens on and a list of keyframes
 * that move it. This file holds the state's shape and the small helpers a
 * script is written with — nothing about any particular subject, so a new
 * track is a new data file and no change here.
 *
 * The camera helpers deserve a word. The original Minute Labs lab is
 * orthographic, so its `zoom` magnifies rather than dollies; this scene is a
 * perspective one, so a chapter ported from it names the same `(x, y, z, zoom)`
 * and {@link cam} converts.
 */

import type {
  CameraState,
  CameraTarget,
  PlaygroundGlobe,
  SimToggles,
} from "@/components/learn/playground/DaySimScene";
import type { Keyframe } from "./chapter-player";

/**
 * Everything a chapter can move.
 *
 * Web's scene also has independent `siderealClock`/`solarClock`/`meanClock`/
 * `degrees` toggles; this scene ties a clock face's label to its arc
 * (`siderealArc`/`solarArc`/`meanArc`) directly, so those don't exist here —
 * a chapter turns the arc on and the face rides along, same as the arc's
 * meridian tick already does.
 */
export type ChapterSimState = {
  /** The chapter has given the instruments back — keyframes stop driving. */
  handsOff: boolean;
  /** Orbits completed, as a fraction — `1` is one full lap. */
  orbitalPosition: number;
  solarDaysPerYear: number;
  tiltDeg: number;
  eccentricity: number;
  cameraTarget: CameraTarget;
  cameraFollow: boolean;
  /** The equation-of-time plot, over the scene. */
  graphOpen: boolean;
  /** A registered Learn diagram raised over the scene, by id, or `""`. */
  overlay: string;
  planet: PlaygroundGlobe;
  cameraYaw: number;
  cameraPitch: number;
  cameraDistance: number;
  /** Outline a named mesh — same beats as web (`stellar-day-arc`, `earth`). */
  highlight: string;
  /** Pulse a control on the instrument panel. */
  highlightControl: string;
  /** The corner readout — which राशि the Sun is in, and today's equation of time. */
  hud: boolean;
  /** The three-column clock readings under the canvas. */
  readings: boolean;
  /** A still picture beside the scene, or `""` — path under `public/`, no leading slash. */
  still: string;
  /** Caption key for the still. Nothing is captioned without one. */
  stillKey: string;
  /** A one-line hint over the scene — caption key, or `""`. */
  tip: string;
} & SimToggles;

export type Chapter = {
  /** Unique within its track. */
  id: string;
  /** Chapter-label key — see `@/lib/learn/chapter-labels`. */
  titleKey: string;
  /** Chapter-label key for the part this chapter belongs to. */
  partKey?: string;
  /** Free explore — no keyframe takeover, no snap-back. Every track ends on one. */
  free?: boolean;
  defaults: ChapterSimState;
  frames: Keyframe<ChapterSimState>[];
};

export const PI2 = Math.PI * 2;
export const DEG = Math.PI / 180;

/**
 * The original lab is orthographic: `zoom` magnifies, it does not dolly.
 * Welcome was ported at zoom 30 → distance 30; every other zoom inverts from
 * that so a close-up (80) is actually closer, not further away.
 */
export function zoomToDistance(zoom: number) {
  return (30 * 30) / zoom;
}

/** A camera position in the original lab's `(x, y, z, zoom)`, as this scene's orbit. */
export function cam(x: number, y: number, z: number, zoom: number) {
  const horiz = Math.hypot(x, z) || 1e-6;
  return {
    cameraYaw: Math.atan2(x, z),
    cameraPitch: Math.atan2(y, horiz),
    cameraDistance: zoomToDistance(zoom),
  };
}

export function kf(
  state: Partial<ChapterSimState>,
  meta: Keyframe<ChapterSimState>["meta"],
): Keyframe<ChapterSimState> {
  return { state, meta };
}

/** The belts, the Moon and the axis, all off — a chapter's opening default. */
export const OFF_BELTS = {
  rashiBelt: false,
  nakshatraBelt: false,
  monthRing: false,
  sightline: false,
  moon: false,
  moonTrail: false,
  moonLap: false,
  moonSightline: false,
  axis: false,
} satisfies Partial<SimToggles>;

/** A chapter's opening state: the quiet defaults, with its own on top. */
export function chapterState(partial: Partial<ChapterSimState> = {}): ChapterSimState {
  return {
    handsOff: false,
    orbitalPosition: 0,
    solarDaysPerYear: 8,
    tiltDeg: 0,
    eccentricity: 0,
    cameraTarget: "planet",
    cameraFollow: false,
    graphOpen: false,
    overlay: "",
    planet: "earth",
    highlight: "",
    highlightControl: "",
    hud: false,
    readings: false,
    still: "",
    stillKey: "",
    tip: "",
    ...cam(-5, 20, 30, 40),
    grid: false,
    planetOrbit: true,
    sunOrbit: false,
    trueSun: true,
    meanSun: false,
    eotWedge: false,
    siderealArc: false,
    solarArc: false,
    meanArc: false,
    primeMeridian: true,
    ...OFF_BELTS,
    ...partial,
  };
}

export function cameraFromChapter(s: ChapterSimState): CameraState {
  return { yaw: s.cameraYaw, pitch: s.cameraPitch, distance: s.cameraDistance };
}

export function togglesFromChapter(s: ChapterSimState): SimToggles {
  return {
    grid: s.grid,
    planetOrbit: s.planetOrbit,
    sunOrbit: s.sunOrbit,
    trueSun: s.trueSun,
    meanSun: s.meanSun,
    eotWedge: s.eotWedge,
    siderealArc: s.siderealArc,
    solarArc: s.solarArc,
    meanArc: s.meanArc,
    primeMeridian: s.primeMeridian,
    axis: s.axis,
    rashiBelt: s.rashiBelt,
    nakshatraBelt: s.nakshatraBelt,
    monthRing: s.monthRing,
    sightline: s.sightline,
    moon: s.moon,
    moonTrail: s.moonTrail,
    moonLap: s.moonLap,
    moonSightline: s.moonSightline,
  };
}
