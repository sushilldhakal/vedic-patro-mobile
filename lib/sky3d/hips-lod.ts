/**
 * The recursive HEALPix quadtree walk that picks which tiles actually
 * render this frame — the same traversal as the web app's `hips-lod.ts`
 * (`stellarium-web-engine`'s `hips_render()`/`render_visitor()`, reproduced
 * rather than ported): start at the 12 order-0 base pixels, and at each
 * visible node decide whether *this* tile's own resolution is still enough
 * for how large it currently projects on screen, recursing into its four
 * children instead of rendering it when it isn't.
 *
 * — native — The screen-size estimate itself is the one piece that could
 * not port unchanged. The web dome uses a custom equidistant-fisheye
 * vertex-shader injection (`horizon-projection.ts`) reaching past 180° of
 * field, so it projects each tile corner through that same raw stereographic
 * map by hand. This app's क्षितिज camera is a real `THREE.PerspectiveCamera`
 * capped at 160° (`AakashGocharScene.tsx`'s own camera block) — a bounded,
 * well-behaved projection with no analogous singularity — so this module
 * uses the ordinary `Vector3.project(camera)` the rest of this app's own
 * picking code already relies on (`project()`, same file) instead. That
 * also means this module needs no `fovDeg` in its own {@link HipsLodFrame}:
 * a standard camera's `projectionMatrix` already carries its current field
 * of view, where the web version's raw map needed it passed in by hand.
 *
 * Split out from `hips.ts` on purpose, same as the web module: that file is
 * deliberately camera- and scene-agnostic, but a screen-size estimate has no
 * meaning without a camera, a projection, and the live rotation the tile
 * group is sitting at.
 */

import * as THREE from "three";
import { getHipsChildren, hipsTileCornerVecs, isHipsTileVisible } from "./hips";

/**
 * How many screen pixels a tile's own projected footprint has to exceed
 * before its 512×512 source image is worth trading for four finer ones.
 * Same value as the web module — see its own doc comment for why 220 rather
 * than the 256 the source image itself tops out at.
 */
export const HIPS_TILE_REFINE_PIXELS = 220;

/** Everything {@link getHipsTileScreenSizePx} needs to turn a tile's own unit-sphere corners into an actual screen-pixel footprint, gathered once per frame by the caller rather than threaded through every recursive call individually. */
export type HipsLodFrame = {
  camera: THREE.Camera;
  /** The HiPS tile group's own current rotation — mirrors the panorama sphere's `equatorialToHorizonMatrix`, applied here to turn a tile's equatorial-frame corner into the world-space point the camera actually sees. */
  groupQuaternion: THREE.Quaternion;
  groupPosition: THREE.Vector3;
  radius: number;
  width: number;
  height: number;
};

const scratchWorld = new THREE.Vector3();
const scratchCam = new THREE.Vector3();
const scratchNdc = new THREE.Vector3();

/**
 * A tile's projected screen-space footprint, pixels — the larger of its
 * bounding box's width or height, from its four true corners run through
 * the actual current camera.
 *
 * Real per-vertex projection rather than a flat "degrees × pixels-per-
 * degree" estimate, same reasoning as the web module: even a real
 * perspective camera's screen density is not perfectly uniform across a
 * 160°-capped frame, and projecting the true corners costs four cheap
 * `Vector3.project()` calls against needing no assumption about where in
 * the frame a tile sits.
 *
 * A corner behind the camera is excluded before it can skew the bounding
 * box — `Vector3.project()` on a point with a negative view-space `z`
 * (behind the eye) or past the far plane returns nonsense (and, near the
 * eye plane itself, values that blow up as the perspective divide runs
 * through zero), the standard-camera counterpart to the web module's own
 * θ-past-the-singularity guard.
 *
 * Returns 0 for a tile whose corners are all excluded — treated as
 * "small," which only matters for tiles the visibility test upstream
 * already let through near its own margin, where under-refining costs a
 * slightly coarser edge tile rather than a hole.
 */
export function getHipsTileScreenSizePx(order: number, pix: number, frame: HipsLodFrame): number {
  const corners = hipsTileCornerVecs(order, pix);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let hit = false;
  for (const [x, y, z] of corners) {
    scratchWorld
      .set(x * frame.radius, y * frame.radius, z * frame.radius)
      .applyQuaternion(frame.groupQuaternion)
      .add(frame.groupPosition);
    scratchCam.copy(scratchWorld).applyMatrix4(frame.camera.matrixWorldInverse);
    if (scratchCam.z >= 0) continue; // behind the eye — a real perspective camera never shows this
    scratchNdc.copy(scratchWorld).project(frame.camera);
    if (scratchNdc.z > 1) continue;
    hit = true;
    const px = (scratchNdc.x * 0.5 + 0.5) * frame.width;
    const py = (-scratchNdc.y * 0.5 + 0.5) * frame.height;
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }
  if (!hit) return 0;
  return Math.max(maxX - minX, maxY - minY);
}

/** Whether `(order, pix)` is still worth splitting into its four children — under the order ceiling, and large enough on screen right now that a 512px source image is starting to show it. */
export function shouldRefineHipsTile(order: number, pix: number, frame: HipsLodFrame, maxOrder: number): boolean {
  if (order >= maxOrder) return false;
  return getHipsTileScreenSizePx(order, pix, frame) > HIPS_TILE_REFINE_PIXELS;
}

/** One leaf of the traversal — the order/pix a screen region should actually render at this frame. */
export type HipsLodLeaf = { order: number; pix: number };

/**
 * Walks `(order, pix)` and its descendants, culling anything outside
 * `coneDeg` of `dirEquatorial` and refining anything still too coarse for
 * its own projected size, down to `maxOrder`.
 *
 * `onVisit` fires for *every* node the walk actually looks at — including
 * ones that go on to refine into children — not just the leaves: a tile
 * being split into four still needs its own texture requested, so it can
 * stand in as the parent fallback for whichever of its children haven't
 * loaded yet. Leaves are collected into `out`, which the caller reuses
 * across frames rather than this function allocating a fresh array every
 * call.
 */
export function evaluateHipsTile(
  order: number,
  pix: number,
  frame: HipsLodFrame,
  dirEquatorial: THREE.Vector3,
  coneDeg: number,
  maxOrder: number,
  onVisit: (order: number, pix: number) => void,
  out: HipsLodLeaf[],
): void {
  if (!isHipsTileVisible(order, pix, dirEquatorial, coneDeg)) return;
  onVisit(order, pix);
  if (shouldRefineHipsTile(order, pix, frame, maxOrder)) {
    for (const [childOrder, childPix] of getHipsChildren(order, pix)) {
      evaluateHipsTile(childOrder, childPix, frame, dirEquatorial, coneDeg, maxOrder, onVisit, out);
    }
    return;
  }
  out.push({ order, pix });
}

/** How many HEALPix base pixels the walk always starts from — order 0 is always exactly 12, by HEALPix's own construction (`12·nside²`, `nside=1`). */
const HIPS_BASE_PIXEL_COUNT = 12;

/**
 * The whole traversal, from all 12 order-0 roots — the caller doesn't need
 * to enumerate or visibility-test the roots itself, {@link
 * evaluateHipsTile} already does that as the first thing it does for every
 * node, roots included.
 */
export function evaluateHipsTiles(
  frame: HipsLodFrame,
  dirEquatorial: THREE.Vector3,
  coneDeg: number,
  maxOrder: number,
  onVisit: (order: number, pix: number) => void,
  out: HipsLodLeaf[],
): void {
  out.length = 0;
  for (let pix = 0; pix < HIPS_BASE_PIXEL_COUNT; pix += 1) {
    evaluateHipsTile(0, pix, frame, dirEquatorial, coneDeg, maxOrder, onVisit, out);
  }
}
