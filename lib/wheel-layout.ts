import { PAGE_HORIZONTAL_PADDING } from "@/lib/mobile-nav";

/** AppHeader inner bar (`h-16`) — safe-area top is added separately. */
export const APP_HEADER_BAR_HEIGHT = 64;

/** Breathing room under the sticky app header (inline card). */
export const WHEEL_VIEWPORT_GAP = 20;

export function appHeaderTotalHeight(safeAreaTop: number): number {
  return safeAreaTop + APP_HEADER_BAR_HEIGHT;
}

/** Max inline wheel card height: 100vh − sticky navbar − gap. */
export function computeMaxWheelCardHeight(screenH: number, safeAreaTop: number): number {
  return Math.max(280, screenH - appHeaderTotalHeight(safeAreaTop) - WHEEL_VIEWPORT_GAP);
}

/** Fullscreen modal stage height (no app header, keep the same gap). */
export function computeFullscreenWheelHeight(screenH: number): number {
  return Math.max(280, screenH - WHEEL_VIEWPORT_GAP);
}

type InlineWheelSizeOpts = {
  containerWidth: number;
  screenW: number;
  screenH: number;
  safeAreaTop: number;
};

/** Square stage size — capped so the card fits one viewport below the sticky header. */
export function computeInlineWheelStageSize({
  containerWidth,
  screenW,
  screenH,
  safeAreaTop,
}: InlineWheelSizeOpts): number {
  const fallbackWidth = Math.max(screenW - PAGE_HORIZONTAL_PADDING * 2, 280);
  const widthCap = Math.max(containerWidth || fallbackWidth, 280);
  const maxCardH = computeMaxWheelCardHeight(screenH, safeAreaTop);
  return Math.max(280, Math.min(widthCap, maxCardH));
}
