/**
 * A window onto what the sky's picker actually saw — temporary, dev-only.
 *
 * Touch injection is not available on this machine (the simulator tooling is
 * shut out by a stale `xcode_select_link`), so the picker cannot be driven
 * from here and proved correct. This is the substitute: tap the running app by
 * hand and it reports, on screen, the numbers the pick was decided on.
 *
 * Deliberately a module singleton rather than props or context. The scene
 * writes to it from inside the Canvas, the shell reads it from outside, and
 * neither one's component architecture changes to carry it — which is what
 * makes it a thing that can simply be deleted again once the picker is proven.
 *
 * @todo Remove once the interaction has been validated on a device.
 */

/** One object the pick considered, and how close it came. */
export type PickDebugCandidate = {
  /** Something a reader can recognise on screen — a graha key, a star name. */
  label: string;
  /** Where it projected to, in canvas pixels — the renderer's own mapping. */
  x: number;
  y: number;
  /** Pixels from the touch to that point. */
  distance: number;
  /** The radius it had to beat, after any apparent-size growth. */
  radius: number;
  hit: boolean;
};

export type PickDebugState = {
  /** Off in production, always. Nothing below is written when this is false. */
  enabled: boolean;
  /** How the gesture recogniser classified the touch that just ended.
   *
   * `tap` and `doubleTap` are one-finger DOWN→UP presses — the second one
   * being the second such press on the same object inside the double window.
   * `multiTouch` is any gesture a second finger joined, whether it pinched or
   * merely rested there; it never picks and never counts as a tap.
   */
  gesture: "tap" | "doubleTap" | "drag" | "multiTouch" | "sensor" | null;
  /** Most fingers down at once during the gesture. */
  fingerCount: number;
  /** 0 for anything that was not a pick, 1 for a single tap, 2 for a double. */
  tapCount: number;
  /** Total finger travel for that gesture, px, against the tap slop. */
  travel: number;
  slop: number;
  /** Whether a second finger was down at any point — the pinch latch. */
  multiTouch: boolean;
  /** Where the finger went down, in canvas pixels. */
  touch: { x: number; y: number } | null;
  viewport: { w: number; h: number };
  pixelRatio: number;
  /** The nearest few candidates, closest first. */
  candidates: PickDebugCandidate[];
  /** What the pick returned, or null for empty sky. */
  selected: string | null;
  /** Bumped on every write, so the overlay knows to re-read. */
  nonce: number;
};

export const pickDebug: PickDebugState = {
  enabled: __DEV__,
  gesture: null,
  fingerCount: 0,
  tapCount: 0,
  travel: 0,
  slop: 0,
  multiTouch: false,
  touch: null,
  viewport: { w: 0, h: 0 },
  pixelRatio: 1,
  candidates: [],
  selected: null,
  nonce: 0,
};

const listeners = new Set<() => void>();

export function subscribePickDebug(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Merge a patch in and wake the overlay. A no-op while disabled. */
export function notePickDebug(patch: Partial<PickDebugState>): void {
  if (!pickDebug.enabled) return;
  Object.assign(pickDebug, patch);
  pickDebug.nonce += 1;
  listeners.forEach((fn) => fn());
}

/** How many candidates the overlay keeps. Enough to see a near miss. */
export const PICK_DEBUG_KEEP = 5;

/** Sort closest-first and keep the nearest {@link PICK_DEBUG_KEEP}. */
export function trimPickCandidates(list: PickDebugCandidate[]): PickDebugCandidate[] {
  return list.sort((a, b) => a.distance - b.distance).slice(0, PICK_DEBUG_KEEP);
}
