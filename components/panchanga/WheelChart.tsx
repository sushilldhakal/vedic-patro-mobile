import { memo, useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { PanResponder, View } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { MoonPhaseIcon } from "./MoonPhaseIcon";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { getBSMonthLength } from "@/lib/bs-calendar";
import {
  bsMonthsForWheel,
  GRAHA_META,
  GREG_NE,
  normDeg,
  PADA_AKSHAR,
  type WheelDetail,
  type WheelMarkers,
  type WheelTweaks,
  WHEEL_RASHIS,
} from "@/lib/wheel-data";
import { KARANA_SEQ, WHEEL_TITHIS, WHEEL_YOGAS } from "@/lib/tithi-wheel-data";
import { nepaliSvgTextCenter } from "@/lib/nepali-text";

const DEG = Math.PI / 180;
const CX = 500;
const CY = 500;

const ORBIT_SCALE = 0.58;

const R_YOGA_I = 140;
const R_YOGA_O = 158;
const R_KAR_I = 303;
const R_KAR_O = 327;
const R_TIT_I = 263;
const R_TIT_O = 303;

const W_RIM = "rgba(143,191,193,0.35)";
const W_SEP = "rgba(143,191,193,0.18)";
const W_ACCENT = "#4ecdc4";
const W_INK = "#c8e0e2";
const W_INK_DIM = "rgba(200,224,226,0.65)";
const W_INK_FAINT = "rgba(200,224,226,0.45)";
const W_BAND = "#0d2a2c";
const W_BAND_ALT = "#0a2224";
const W_RASHI = "#0f3234";
const W_RASHI_ALT = "#0c282a";
const W_PADA = "#0a2426";
const W_PADA_ALT = "#081e20";
const FONT = "Mukta_600SemiBold";

/** color-mix(in srgb, var(--w-accent) 26%, var(--w-band-alt)) */
const SEG_HOT = "#1c4e4e";
/** color-mix(in srgb, var(--w-accent) 40%, var(--w-band-alt)) */
const SEG_SEL = "#256664";
/** color-mix(in srgb, var(--w-accent) 18%, transparent) */
const SEG_NOW_FILL = "rgba(78,205,196,0.18)";
/** color-mix(in srgb, #8fbfc1 14%, transparent) */
const ORBIT_STROKE = "rgba(143,191,193,0.14)";
/** color-mix(in srgb, #a07de8 38%, #10063a) */
const YOGA_CUR = "#71477c";
/** color-mix(in srgb, #7c5cbf 22%, #08041a) */
const YOGA_ALT = "#22173e";
/** color-mix(in srgb, #6448a8 16%, #06031a) */
const YOGA_BASE = "#150e30";
/** color-mix(in srgb, var(--w-accent) 28%, #0d2428) */
const TITHI_CUR = "#1f5354";
/** color-mix(in srgb, #2d8a86 26%, #0a1a1e) */
const TITHI_SHUKLA = "#133739";
/** color-mix(in srgb, #2d8a86 14%, #060e10) */
const TITHI_KRISHNA = "#0b1f20";

const R = {
  rimOuter: 497,
  tickIn: 481,
  gregOut: 481,
  gregMid: 467,
  gregIn: 453,
  bsOut: 453,
  bsMid: 438,
  bsIn: 424,
  nakOut: 423,
  nakIcon: 403,
  nakName: 372,
  nakIn: 345,
  padaOut: 345,
  padaNum: 336,
  padaIn: 327,
  rashiOut: 263,
  rashiGlyph: 246,
  rashiName: 222,
  rashiIn: 178,
  core: 178,
} as const;

export type WheelHover = { type: "nak"; i: number } | { type: "rashi"; i: number };
export type WheelPick = WheelHover;

function svgCoords(
  locationX: number,
  locationY: number,
  layoutW: number,
  layoutH: number,
): { x: number; y: number; dist: number; L: number } {
  const x = 42 + (locationX / layoutW) * 916;
  const y = 42 + (locationY / layoutH) * 916;
  const dx = x - CX;
  const dy = y - CY;
  const dist = Math.hypot(dx, dy);
  const L = normDeg(Math.atan2(-dx, -dy) / DEG);
  return { x, y, dist, L };
}

function wheelLFromTouch(L: number, spin: number): number {
  return normDeg(L - spin);
}

function untransformTouch(
  x: number,
  y: number,
  w: number,
  h: number,
  pan: { x: number; y: number },
  zoom: number,
): { x: number; y: number } {
  if (zoom === 1 && pan.x === 0 && pan.y === 0) return { x, y };
  const cx = w / 2;
  const cy = h / 2;
  const tx = x - pan.x;
  const ty = y - pan.y;
  return {
    x: cx + (tx - cx) / zoom,
    y: cy + (ty - cy) / zoom,
  };
}

function clampZoom(z: number): number {
  return Math.max(0.55, Math.min(14, z));
}

type LayoutMetrics = { w: number; h: number; pageX: number; pageY: number };

function touchInView(
  pageX: number,
  pageY: number,
  layout: LayoutMetrics,
): { x: number; y: number } {
  return { x: pageX - layout.pageX, y: pageY - layout.pageY };
}

type PinchGesture = {
  dist0: number;
  zoom0: number;
  pan0x: number;
  pan0y: number;
  focalX: number;
  focalY: number;
  centroid0x: number;
  centroid0y: number;
};

function touchCentroidInView(
  touches: readonly { pageX: number; pageY: number }[],
  pageX: number,
  pageY: number,
): { x: number; y: number } | null {
  if (touches.length < 2) return null;
  const t0 = touches[0]!;
  const t1 = touches[1]!;
  return {
    x: (t0.pageX + t1.pageX) / 2 - pageX,
    y: (t0.pageY + t1.pageY) / 2 - pageY,
  };
}

/** Keep the point under `focal` fixed while zoom changes (scale is around view center). */
function panForFocalZoom(
  pan0x: number,
  pan0y: number,
  zoom0: number,
  zoom1: number,
  focalX: number,
  focalY: number,
  w: number,
  h: number,
): { x: number; y: number } {
  const cx = w / 2;
  const cy = h / 2;
  const ratio = zoom1 / zoom0;
  return {
    x: pan0x + (focalX - pan0x - cx) * (1 - ratio),
    y: pan0y + (focalY - pan0y - cy) * (1 - ratio),
  };
}

function applyPinchTransform(
  pinch: PinchGesture,
  dist: number,
  centroid: { x: number; y: number },
  w: number,
  h: number,
): { zoom: number; pan: { x: number; y: number } } {
  const zoom = clampZoom(pinch.zoom0 * (dist / pinch.dist0));
  const p = panForFocalZoom(
    pinch.pan0x,
    pinch.pan0y,
    pinch.zoom0,
    zoom,
    pinch.focalX,
    pinch.focalY,
    w,
    h,
  );
  return {
    zoom,
    pan: {
      x: p.x + (centroid.x - pinch.centroid0x),
      y: p.y + (centroid.y - pinch.centroid0y),
    },
  };
}

function touchPageDistance(touches: readonly { pageX: number; pageY: number }[]): number {
  if (touches.length < 2) return 0;
  const t0 = touches[0]!;
  const t1 = touches[1]!;
  return Math.hypot(t1.pageX - t0.pageX, t1.pageY - t0.pageY);
}

function planetSvgPosition(lon: number, orbit: number, spinDeg: number): [number, number] {
  const a = (lon + spinDeg) * DEG;
  return [CX - orbit * ORBIT_SCALE * Math.sin(a), CY - orbit * ORBIT_SCALE * Math.cos(a)];
}

function planetVisualRadius(index: number): number {
  const meta = GRAHA_META[index];
  if (!meta) return 8;
  if ("big" in meta && meta.big) return 15;
  if (index === 1) return 10;
  return 8;
}

/** Svg-space hit radius per graha (glow, label, and finger slop). */
function planetHitRadius(index: number): number {
  const r = planetVisualRadius(index);
  if (index === 0) return r + 26;
  // Saturn, Rahu, Ketu share the outer rim and often sit near each other.
  if (index >= 6) return r + 32;
  return r + 24;
}

function angularDiffDeg(a: number, b: number): number {
  const d = Math.abs(normDeg(a) - normDeg(b));
  return d > 180 ? 360 - d : d;
}

const WHEEL_TAP_SLOP_PX = 14;
/** Max finger movement still counted as a planet tap. */
const PLANET_TAP_SLOP_PX = 28;

function segNakFill(opts: { alt?: boolean; hot?: boolean; sel?: boolean }): string {
  if (opts.sel) return SEG_SEL;
  if (opts.hot) return SEG_HOT;
  return opts.alt ? W_BAND_ALT : W_BAND;
}

function segRashiFill(opts: { alt?: boolean; hot?: boolean; sel?: boolean }): string {
  if (opts.sel) return SEG_SEL;
  if (opts.hot) return SEG_HOT;
  return opts.alt ? W_RASHI_ALT : W_RASHI;
}

interface RingLabelProps {
  L: number;
  r: number;
  spin: number;
  size?: number;
  fill?: string;
  children: ReactNode;
}

function RingLabel({ L, r, spin, size, fill = W_INK, children }: RingLabelProps) {
  const a = normDeg(L + spin);
  const flip = a > 90 && a < 270;
  return (
    <G transform={`rotate(${-(L + spin)} ${CX} ${CY})`}>
      <SvgText
        x={CX}
        y={CY - r}
        textAnchor="middle"
        fill={fill}
        fontSize={size ?? 11}
        fontFamily={FONT}
        {...nepaliSvgTextCenter}
        {...(flip ? { transform: `rotate(180 ${CX} ${CY - r})` } : {})}
      >
        {children}
      </SvgText>
    </G>
  );
}

interface WheelChartProps {
  det: WheelDetail;
  markers: WheelMarkers;
  spin: number;
  tw: WheelTweaks;
  bsYear: number;
  sel: WheelPick | null;
  hover: WheelHover | null;
  onHover: (h: WheelHover) => void;
  onLeave: () => void;
  onPick: (p: WheelPick) => void;
  onSpin: (deg: number) => void;
  zoom: number;
  onZoom: (z: number) => void;
  pan: { x: number; y: number };
  onPan: (x: number, y: number) => void;
}

function WheelChartImpl({
  det,
  markers,
  spin,
  tw,
  bsYear,
  sel,
  hover,
  onHover: _onHover,
  onLeave: _onLeave,
  onPick,
  onSpin,
  zoom,
  onZoom,
  pan,
  onPan,
}: WheelChartProps) {
  const [lineTarget, setLineTarget] = useState(1);
  const viewRef = useRef<View>(null);
  const layoutRef = useRef<LayoutMetrics>({ w: 0, h: 0, pageX: 0, pageY: 0 });
  const spinRef = useRef(spin);
  spinRef.current = spin;
  const panRef = useRef(pan);
  panRef.current = pan;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const pinchRef = useRef<PinchGesture | null>(null);
  const pinchingRef = useRef(false);
  const dragRef = useRef<
    | { mode: "r"; spin0: number; angle0: number; moved: boolean }
    | { mode: "p"; pan0x: number; pan0y: number; moved: boolean }
    | null
  >(null);

  const syncLayout = useCallback(() => {
    viewRef.current?.measureInWindow((x, y, mw, mh) => {
      const cur = layoutRef.current;
      layoutRef.current = {
        w: cur.w > 0 ? cur.w : mw,
        h: cur.h > 0 ? cur.h : mh,
        pageX: x,
        pageY: y,
      };
    });
  }, []);

  const touchFromEvent = useCallback(
    (evt: { nativeEvent: { locationX: number; locationY: number; pageX: number; pageY: number } }) => {
      const layout = layoutRef.current;
      if (layout.w > 0 && layout.h > 0 && (layout.pageX !== 0 || layout.pageY !== 0)) {
        return touchInView(evt.nativeEvent.pageX, evt.nativeEvent.pageY, layout);
      }
      return { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
    },
    [],
  );

  const angleAt = useCallback((locationX: number, locationY: number) => {
    const { w, h } = layoutRef.current;
    if (w <= 0 || h <= 0) return 0;
    const cx = w / 2;
    const cy = h / 2;
    return (Math.atan2(locationY - cy, locationX - cx) * 180) / Math.PI;
  }, []);

  const pickPlanetAt = useCallback(
    (rawX: number, rawY: number): number => {
      if (!tw.show_planets) return -1;
      const { w, h } = layoutRef.current;
      if (w <= 0 || h <= 0) return -1;
      const { x, y } = untransformTouch(rawX, rawY, w, h, panRef.current, zoomRef.current);
      const { x: svgX, y: svgY, dist, L } = svgCoords(x, y, w, h);
      if (dist > R.rashiOut + 36) return -1;

      const tapL = wheelLFromTouch(L, spinRef.current);
      const candidates: { i: number; score: number }[] = [];

      for (let i = 0; i < det.grahas.length; i++) {
        const meta = GRAHA_META[i]!;
        const lon = markers.planetLons[i] ?? 0;
        const hitR = planetHitRadius(i);
        const planetR = planetVisualRadius(i);
        const [px, py] = planetSvgPosition(lon, meta.orbit, spinRef.current);
        const dCenter = Math.hypot(svgX - px, svgY - py);
        const labelY = py + planetR + 9;
        const dLabel = Math.hypot(svgX - px, svgY - labelY);
        const d = Math.min(dCenter, dLabel);
        if (d <= hitR) {
          candidates.push({ i, score: d / hitR });
        }
      }

      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          const scoreDelta = a.score - b.score;
          if (Math.abs(scoreDelta) < 0.14) return b.i - a.i;
          return scoreDelta;
        });
        return candidates[0]!.i;
      }

      // Orbit + angle snap when grahas overlap (conjunct / rim cluster).
      let snapIdx = -1;
      let snapScore = Infinity;
      for (let i = 0; i < det.grahas.length; i++) {
        const meta = GRAHA_META[i]!;
        const lon = markers.planetLons[i] ?? 0;
        const orbitR = meta.orbit * ORBIT_SCALE;
        const radialSlop = i >= 6 ? 20 : 14;
        const angularSlop = i >= 6 ? 14 : 10;
        const radialDiff = Math.abs(dist - orbitR);
        const angDiff = angularDiffDeg(tapL, lon);
        if (radialDiff > radialSlop || angDiff > angularSlop) continue;
        const score = angDiff / angularSlop + radialDiff / radialSlop;
        if (score < snapScore) {
          snapScore = score;
          snapIdx = i;
        }
      }
      return snapIdx;
    },
    [det.grahas, markers.planetLons, tw.show_planets],
  );

  const pickFromTouch = useCallback(
    (rawX: number, rawY: number) => {
      const planetIdx = pickPlanetAt(rawX, rawY);
      if (planetIdx >= 0) {
        setLineTarget(planetIdx);
        return;
      }

      const { w, h } = layoutRef.current;
      if (w <= 0 || h <= 0) return;
      const { x, y } = untransformTouch(rawX, rawY, w, h, panRef.current, zoomRef.current);
      const { dist, L } = svgCoords(x, y, w, h);
      const wheelL = wheelLFromTouch(L, spinRef.current);

      if (dist >= R.nakIn && dist <= R.nakOut) {
        onPick({ type: "nak", i: Math.floor(wheelL / (360 / 27)) % 27 });
        return;
      }
      if (dist >= R.rashiIn && dist <= R.rashiOut) {
        onPick({ type: "rashi", i: Math.floor(wheelL / 30) % 12 });
      }
    },
    [onPick, pickPlanetAt],
  );

  const wheelPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (evt) => {
          if (evt.nativeEvent.touches.length >= 2) return true;
          syncLayout();
          return pickPlanetAt(touchFromEvent(evt).x, touchFromEvent(evt).y) < 0;
        },
        onStartShouldSetPanResponderCapture: (evt) => {
          if (evt.nativeEvent.touches.length >= 2) return true;
          return pickPlanetAt(touchFromEvent(evt).x, touchFromEvent(evt).y) < 0;
        },
        onMoveShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          syncLayout();
          pinchingRef.current = false;
          pinchRef.current = null;
          const { w, h } = layoutRef.current;
          const touch = touchFromEvent(evt);
          const { x, y } = untransformTouch(touch.x, touch.y, w, h, panRef.current, zoomRef.current);
          if (zoomRef.current > 1) {
            dragRef.current = {
              mode: "p",
              pan0x: panRef.current.x,
              pan0y: panRef.current.y,
              moved: false,
            };
          } else {
            dragRef.current = {
              mode: "r",
              spin0: spinRef.current,
              angle0: angleAt(x, y),
              moved: false,
            };
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;
          const layout = layoutRef.current;
          if (touches.length >= 2 && layout.w > 0) {
            pinchingRef.current = true;
            dragRef.current = null;
            const dist = touchPageDistance(touches);
            const centroid = touchCentroidInView(touches, layout.pageX, layout.pageY);
            if (dist <= 0 || !centroid) return;
            if (!pinchRef.current) {
              pinchRef.current = {
                dist0: dist,
                zoom0: zoomRef.current,
                pan0x: panRef.current.x,
                pan0y: panRef.current.y,
                focalX: centroid.x,
                focalY: centroid.y,
                centroid0x: centroid.x,
                centroid0y: centroid.y,
              };
              return;
            }
            const next = applyPinchTransform(pinchRef.current, dist, centroid, layout.w, layout.h);
            onZoom(next.zoom);
            onPan(next.pan.x, next.pan.y);
            return;
          }

          pinchRef.current = null;
          const drag = dragRef.current;
          if (!drag) return;

          if (drag.mode === "p") {
            if (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3) drag.moved = true;
            onPan(drag.pan0x + gestureState.dx, drag.pan0y + gestureState.dy);
            return;
          }

          const { w, h } = layoutRef.current;
          const touch = touchFromEvent(evt);
          const { x, y } = untransformTouch(touch.x, touch.y, w, h, panRef.current, zoomRef.current);
          const angle = angleAt(x, y);
          let delta = angle - drag.angle0;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          if (Math.abs(delta) > 1.2) drag.moved = true;
          onSpin(drag.spin0 + delta);
        },
        onPanResponderRelease: (evt, gestureState) => {
          const drag = dragRef.current;
          const wasPinching = pinchingRef.current;
          dragRef.current = null;
          pinchRef.current = null;
          pinchingRef.current = false;
          const touch = touchFromEvent(evt);
          const dist = Math.hypot(gestureState.dx, gestureState.dy);
          if (!wasPinching) {
            const planetIdx = pickPlanetAt(touch.x, touch.y);
            if (planetIdx >= 0 && dist < PLANET_TAP_SLOP_PX) {
              setLineTarget(planetIdx);
              return;
            }
          }
          const moved = dist >= WHEEL_TAP_SLOP_PX || Boolean(drag?.moved);
          if (moved) return;
          pickFromTouch(touch.x, touch.y);
        },
        onPanResponderTerminate: () => {
          dragRef.current = null;
          pinchRef.current = null;
          pinchingRef.current = false;
        },
      }),
    [angleAt, onPan, onSpin, onZoom, pickFromTouch, pickPlanetAt, syncLayout, touchFromEvent],
  );

  const pol = useCallback(
    (L: number, rad: number): [number, number] => {
      const a = (L + spin) * DEG;
      return [CX - rad * Math.sin(a), CY - rad * Math.cos(a)];
    },
    [spin],
  );

  const arcSeg = useCallback(
    (L0: number, L1: number, r0: number, r1: number): string => {
      const [x1, y1] = pol(L0, r1);
      const [x2, y2] = pol(L1, r1);
      const [x3, y3] = pol(L1, r0);
      const [x4, y4] = pol(L0, r0);
      const large = L1 - L0 > 180 ? 1 : 0;
      return `M${x1},${y1} A${r1},${r1} 0 ${large} 0 ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 ${large} 1 ${x4},${y4} Z`;
    },
    [pol],
  );

  const { moonLon, moonNak, planetLons, sunLon } = markers;

  const staticLayers = useMemo(() => {
    const nakSegs: ReactNode[] = [];
    const nakDecor: ReactNode[] = [];
    for (let i = 0; i < 27; i++) {
      const L0 = i * (360 / 27);
      const L1 = (i + 1) * (360 / 27);
      const Lm = (L0 + L1) / 2;
      const ico = NAKSHATRA_ICONS[i]!;
      const isHot = hover?.type === "nak" && hover.i === i;
      const isSel = sel?.type === "nak" && sel.i === i;
      nakSegs.push(
        <Path
          key={`ns${i}`}
          d={arcSeg(L0, L1, R.nakIn, R.nakOut)}
          fill={segNakFill({ alt: i % 2 === 1, hot: isHot, sel: isSel })}
          stroke={W_SEP}
          strokeWidth={0.6}
        />,
      );
      nakDecor.push(
        <RingLabel
          key={`ni${i}`}
          L={Lm}
          r={(R.nakIn + R.nakOut) / 2}
          spin={spin}
          fill={isSel || isHot ? W_ACCENT : W_INK}
        >
          {ico.ne}
        </RingLabel>,
      );
    }

    const rashiSegs: ReactNode[] = [];
    const rashiDecor: ReactNode[] = [];
    for (let i = 0; i < 12; i++) {
      const L0 = i * 30;
      const L1 = (i + 1) * 30;
      const Lm = L0 + 15;
      const rs = WHEEL_RASHIS[i]!;
      const isHot = hover?.type === "rashi" && hover.i === i;
      const isSel = sel?.type === "rashi" && sel.i === i;
      rashiSegs.push(
        <Path
          key={`rs${i}`}
          d={arcSeg(L0, L1, R.rashiIn, R.rashiOut)}
          fill={segRashiFill({ alt: i % 2 === 1, hot: isHot, sel: isSel })}
          stroke={W_SEP}
          strokeWidth={0.6}
        />,
      );
      const [gx, gy] = pol(Lm, R.rashiGlyph);
      rashiDecor.push(
        <G key={`rd${i}`}>
          <SvgText
            x={gx}
            y={gy}
            textAnchor="middle"
            alignmentBaseline="middle"
            fill={W_INK}
            fontSize={27}
            fontFamily={FONT}
          >
            {rs.sym}
          </SvgText>
          <RingLabel L={Lm} r={R.rashiName} spin={spin} fill={isSel || isHot ? W_ACCENT : W_INK}>
            {rs.ne}
          </RingLabel>
        </G>,
      );
    }

    const padaCells: ReactNode[] = [];
    if (tw.show_pada) {
      for (let i = 0; i < 108; i++) {
        const L0 = i * (360 / 108);
        const L1 = (i + 1) * (360 / 108);
        const Lm = (L0 + L1) / 2;
        padaCells.push(
          <G key={`pc${i}`}>
            <Path
              d={arcSeg(L0, L1, R.padaIn, R.padaOut)}
              fill={Math.floor(i / 4) % 2 === 1 ? W_PADA_ALT : W_PADA}
              stroke={W_SEP}
              strokeWidth={0.4}
            />
            <RingLabel L={Lm} r={R.padaNum} spin={spin} fill={W_INK_DIM}>
              {PADA_AKSHAR[Math.floor(i / 4)]![i % 4]}
            </RingLabel>
          </G>,
        );
      }
    }

    const dayTicks: ReactNode[] = [];
    if (tw.show_lunar) {
      for (let i = 0; i < 12; i++) {
        const days = getBSMonthLength(bsYear, i + 1);
        for (let d = 1; d < days; d++) {
          const L = i * 30 + (d / days) * 30;
          const major = d % 5 === 0;
          const [x1, y1] = pol(L, R.bsOut - 1);
          const [x2, y2] = pol(L, R.bsOut - (major ? 11 : 6));
          dayTicks.push(
            <Line
              key={`dt${i}_${d}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={major ? W_INK_DIM : W_INK_FAINT}
              strokeWidth={major ? 0.9 : 0.55}
              opacity={major ? 0.85 : 0.6}
            />,
          );
        }
      }
    }

    const hits: ReactNode[] = [];
    for (let i = 0; i < 27; i++) {
      const L0 = i * (360 / 27);
      const L1 = (i + 1) * (360 / 27);
      hits.push(
        <Path
          key={`hn${i}`}
          d={arcSeg(L0, L1, R.nakIn, R.nakOut)}
          fill="transparent"
          pointerEvents="none"
        />,
      );
    }
    for (let i = 0; i < 12; i++) {
      const L0 = i * 30;
      const L1 = (i + 1) * 30;
      hits.push(
        <Path
          key={`hr${i}`}
          d={arcSeg(L0, L1, R.rashiIn, R.rashiOut)}
          fill="transparent"
          pointerEvents="none"
        />,
      );
    }

    const rashiRays: ReactNode[] = [];
    for (let i = 0; i < 12; i++) {
      const [x1, y1] = pol(i * 30, 12);
      const [x2, y2] = pol(i * 30, R.rimOuter - 2);
      rashiRays.push(
        <Line key={`ray${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={W_SEP} strokeWidth={0.9} opacity={0.9} />,
      );
    }

    const gregLabels: ReactNode[] = tw.show_greg
      ? GREG_NE.map((m, i) => (
          <RingLabel key={`g${i}`} L={(i - 3) * 30 + 5} r={R.gregMid} spin={spin} fill={W_INK_FAINT} size={12}>
            {m}
          </RingLabel>
        ))
      : [];

    return { nakSegs, nakDecor, rashiSegs, rashiDecor, padaCells, dayTicks, hits, rashiRays, gregLabels };
  }, [spin, hover, sel, bsYear, tw, pol, arcSeg]);

  const dataLayers = useMemo(() => {
    const sunRashiIdx = Math.floor(normDeg(sunLon) / 30);
    const moonRashiIdx = Math.floor(normDeg(moonLon) / 30);

    const markerNodes: ReactNode[] = [];
    if (tw.show_today) {
      const L0 = moonNak * (360 / 27);
      const L1 = (moonNak + 1) * (360 / 27);
      markerNodes.push(
        <Path
          key="nowwedge"
          d={arcSeg(L0, L1, R.nakIn, R.nakOut)}
          fill={SEG_NOW_FILL}
          stroke={W_ACCENT}
          strokeWidth={1.2}
        />,
      );
      const rL0 = moonRashiIdx * 30;
      const rL1 = rL0 + 30;
      markerNodes.push(
        <Path
          key="nowwedge-rashi"
          d={arcSeg(rL0, rL1, R.rashiIn, R.rashiOut)}
          fill={SEG_NOW_FILL}
          stroke={W_ACCENT}
          strokeWidth={1.2}
        />,
      );
      const mL0 = sunRashiIdx * 30;
      const mL1 = mL0 + 30;
      markerNodes.push(
        <Path
          key="nowwedge-month"
          d={arcSeg(mL0, mL1, R.bsIn, R.bsOut)}
          fill={SEG_NOW_FILL}
          stroke={W_ACCENT}
          strokeWidth={1.2}
        />,
      );

      const targetLon = planetLons[lineTarget] ?? moonLon;
      const targetSym = det.grahas[lineTarget]?.sym ?? "";
      const [lx, ly] = pol(targetLon, R.bsOut - 2);
      markerNodes.push(
        <Line
          key="target-line"
          x1={CX}
          y1={CY}
          x2={lx}
          y2={ly}
          stroke="#f9c800"
          strokeWidth={1.4}
          strokeDasharray="3 4"
          opacity={0.9}
        />,
      );
      markerNodes.push(
        <G key="target-cap" transform={`rotate(${-(targetLon + spin)} ${CX} ${CY})`}>
          <Circle cx={CX} cy={CY - (R.bsOut - 2)} r={3.4} fill="#f9c800" />
          <SvgText
            x={CX}
            y={CY - (R.bsOut + 5)}
            textAnchor="middle"
            alignmentBaseline="middle"
            fill="#f9c800"
            fontSize={14}
            fontFamily={FONT}
            {...(normDeg(targetLon + spin) > 90 && normDeg(targetLon + spin) < 270
              ? { transform: `rotate(180 ${CX} ${CY - (R.bsOut + 5)})` }
              : {})}
          >
            {targetSym}
          </SvgText>
        </G>,
      );
    }

    const innerRings: ReactNode[] = [];
    if (tw.show_today) {
      const sunL = markers.sunLon;
      const elongation = normDeg(markers.moonLon - sunL);
      const curTithiIdx = Math.floor(elongation / 12);
      const curKarIdx = Math.floor(elongation / 6);

      innerRings.push(
        <Circle key="ir-yoga-i" cx={CX} cy={CY} r={R_YOGA_I} fill="none" stroke={W_RIM} strokeWidth={0.8} opacity={0.5} />,
      );

      const yogaDeg = 360 / 27;
      const yogaAnchor = -sunL;
      const yogaSum = normDeg(markers.sunLon + markers.moonLon);
      const curYogaIdx = Math.floor(yogaSum / yogaDeg);
      for (let y = 0; y < 27; y++) {
        const L0 = yogaAnchor + y * yogaDeg;
        const L1 = yogaAnchor + (y + 1) * yogaDeg;
        const Lm = yogaAnchor + y * yogaDeg + yogaDeg / 2;
        const isCur = y === curYogaIdx;
        const yName = WHEEL_YOGAS[y]!;
        innerRings.push(
          <Path
            key={`yog${y}`}
            d={arcSeg(L0, L1, R_YOGA_I, R_YOGA_O)}
            fill={isCur ? YOGA_CUR : y % 2 ? YOGA_ALT : YOGA_BASE}
            stroke={isCur ? "#c4a8f0" : "rgba(100,72,168,0.25)"}
            strokeWidth={isCur ? 1.6 : 0.4}
            opacity={isCur ? 1 : 0.82}
          />,
        );
        innerRings.push(
          <RingLabel
            key={`yog-lbl-${y}`}
            L={Lm}
            r={(R_YOGA_I + R_YOGA_O) / 2}
            spin={spin}
            size={isCur ? 7 : 5.5}
            fill={isCur ? "#e0d0ff" : "#b09dd4"}
          >
            {yName.length > 4 ? yName.slice(0, 4) : yName}
          </RingLabel>,
        );
      }

      for (let k = 0; k < 60; k++) {
        const L0 = sunL + k * 6;
        const L1 = sunL + (k + 1) * 6;
        const Lm = sunL + k * 6 + 3;
        const kd = KARANA_SEQ[k]!;
        const isCur = k === curKarIdx;
        const kName = kd.ne;
        innerRings.push(
          <Path
            key={`kar${k}`}
            d={arcSeg(L0, L1, R_KAR_I, R_KAR_O)}
            fill={segRashiFill({ alt: k % 2 === 1, sel: isCur })}
            stroke={isCur ? W_ACCENT : W_SEP}
            strokeWidth={isCur ? 1.7 : 0.6}
          />,
        );
        innerRings.push(
          <RingLabel
            key={`kar-lbl-${k}`}
            L={Lm}
            r={(R_KAR_I + R_KAR_O) / 2}
            spin={spin}
            size={isCur ? 9 : 7.5}
            fill={isCur ? W_ACCENT : "#ffffff"}
          >
            {kName.length > 4 ? kName.slice(0, 4) : kName}
          </RingLabel>,
        );
      }

      for (let i = 0; i < 30; i++) {
        const L0 = sunL + i * 12;
        const L1 = sunL + (i + 1) * 12;
        const Lm = sunL + i * 12 + 6;
        const isCur = i === curTithiIdx;
        const shukla = i < 15;
        const tName = WHEEL_TITHIS[i]!.ne;
        innerRings.push(
          <G key={`tit${i}`}>
            <Path
              d={arcSeg(L0, L1, R_TIT_I, R_TIT_O)}
              fill={isCur ? TITHI_CUR : shukla ? TITHI_SHUKLA : TITHI_KRISHNA}
              stroke={isCur ? W_ACCENT : W_SEP}
              strokeWidth={isCur ? 1.7 : 0.5}
            />
            <RingLabel
              L={Lm}
              r={(R_TIT_I + R_TIT_O) / 2}
              spin={spin}
              size={isCur ? 12 : 9.5}
              fill={isCur ? W_ACCENT : W_INK}
            >
              {tName.length > 6 ? tName.slice(0, 6) : tName}
            </RingLabel>
          </G>,
        );
      }
    }

    const core: ReactNode[] = [];
    if (tw.show_planets) {
      core.push(
        // @ts-expect-error react-native-svg Defs children typing
        <Defs key="pdefs">
          <RadialGradient id="pg0" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
            <Stop offset="0%" stopColor="#fff9c0" />
            <Stop offset="35%" stopColor="#f9c800" />
            <Stop offset="75%" stopColor="#e07000" />
            <Stop offset="100%" stopColor="#8b3c00" />
          </RadialGradient>
          <RadialGradient id="pg1" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
            <Stop offset="0%" stopColor="#f6f8fa" />
            <Stop offset="55%" stopColor="#b8c0cc" />
            <Stop offset="100%" stopColor="#6a7480" />
          </RadialGradient>
          <RadialGradient id="pg2" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
            <Stop offset="0%" stopColor="#ff9870" />
            <Stop offset="55%" stopColor="#c84830" />
            <Stop offset="100%" stopColor="#6e1800" />
          </RadialGradient>
          <RadialGradient id="pg3" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
            <Stop offset="0%" stopColor="#d8d4cc" />
            <Stop offset="55%" stopColor="#989090" />
            <Stop offset="100%" stopColor="#504848" />
          </RadialGradient>
          <RadialGradient id="pg4" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
            <Stop offset="0%" stopColor="#f0d898" />
            <Stop offset="50%" stopColor="#c89840" />
            <Stop offset="100%" stopColor="#7a5010" />
          </RadialGradient>
          <RadialGradient id="pg5" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
            <Stop offset="0%" stopColor="#fffae0" />
            <Stop offset="50%" stopColor="#e8d870" />
            <Stop offset="100%" stopColor="#a09020" />
          </RadialGradient>
          <RadialGradient id="pg6" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
            <Stop offset="0%" stopColor="#f0e0b0" />
            <Stop offset="50%" stopColor="#c4a060" />
            <Stop offset="100%" stopColor="#7a5c28" />
          </RadialGradient>
          <RadialGradient id="pg7" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
            <Stop offset="0%" stopColor="#7060c0" />
            <Stop offset="55%" stopColor="#2a2060" />
            <Stop offset="100%" stopColor="#080420" />
          </RadialGradient>
          <RadialGradient id="pg8" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
            <Stop offset="0%" stopColor="#b06080" />
            <Stop offset="55%" stopColor="#601828" />
            <Stop offset="100%" stopColor="#1c0408" />
          </RadialGradient>
          <RadialGradient id="pg-earth" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
            <Stop offset="0%" stopColor="#a8f0d0" />
            <Stop offset="45%" stopColor="#1f8f6f" />
            <Stop offset="100%" stopColor="#0a3828" />
          </RadialGradient>
        </Defs>,
      );

      [44, 70, 96, 120, 150, 178, 204, 216].forEach((rad, k) =>
        core.push(
          <Circle key={`orb${k}`} cx={CX} cy={CY} r={rad * ORBIT_SCALE} fill="none" stroke={ORBIT_STROKE} strokeWidth={1} />,
        ),
      );

      det.grahas.forEach((g, i) => {
        const meta = GRAHA_META[i]!;
        const lon = planetLons[i] ?? 0;
        const [px, py] = pol(lon, meta.orbit * ORBIT_SCALE);
        const planetR = "big" in meta && meta.big ? 15 : i === 1 ? 10 : 8;

        core.push(<Circle key={`pg${i}`} cx={px} cy={py} r={planetR + 6} fill={meta.color} opacity={0.55} pointerEvents="none" />);

        if (i === 0) {
          const rays: ReactNode[] = [];
          for (let r = 0; r < 12; r++) {
            const ang = r * 30 * DEG;
            const r1 = planetR + 3;
            const r2 = planetR + (r % 2 === 0 ? 11 : 7);
            rays.push(
              <Line
                key={r}
                x1={px + r1 * Math.sin(ang)}
                y1={py - r1 * Math.cos(ang)}
                x2={px + r2 * Math.sin(ang)}
                y2={py - r2 * Math.cos(ang)}
                stroke="#f9c800"
                strokeWidth={2.2}
                strokeLinecap="round"
                opacity={0.9}
              />,
            );
          }
          core.push(<G key="sun-rays" pointerEvents="none">{rays}</G>);
        }

        if ("ring" in meta && meta.ring) {
          core.push(
            <Ellipse
              key={`ring${i}`}
              cx={px}
              cy={py}
              rx={planetR + 8}
              ry={planetR * 0.45}
              fill="none"
              stroke={meta.color}
              strokeWidth={2.4}
              opacity={0.88}
              transform={`rotate(-20 ${px} ${py})`}
              pointerEvents="none"
            />,
          );
        }

        if (i !== 1) {
          core.push(<Circle key={`pl${i}`} cx={px} cy={py} r={planetR} fill={`url(#pg${i})`} pointerEvents="none" />);
        } else {
          const moonElongation = normDeg(markers.moonLon - markers.sunLon);
          core.push(
            <G key="moon-phase" transform={`translate(${px},${py})`} pointerEvents="none">
              <MoonPhaseIcon elongation={moonElongation} r={planetR} />
            </G>,
          );
        }

        if (i === 4) {
          const clipId = `jclip${i}`;
          core.push(
            <G key={`jbands${i}`} pointerEvents="none">
              {/* @ts-expect-error react-native-svg Defs children typing */}
              <Defs>
                <ClipPath id={clipId}>
                  <Circle cx={px} cy={py} r={planetR - 0.5} />
                </ClipPath>
              </Defs>
              {[-planetR * 0.3, planetR * 0.05, planetR * 0.36].map((oy, bi) => (
                <Rect
                  key={bi}
                  x={px - planetR}
                  y={py + oy - 1.8}
                  width={planetR * 2}
                  height={3.2}
                  fill="rgba(80,42,8,0.42)"
                  clipPath={`url(#${clipId})`}
                />
              ))}
            </G>,
          );
        }

        core.push(
          <SvgText key={`pn${i}`} x={px} y={py + planetR + 9} textAnchor="middle" fill={W_INK_DIM} fontSize={8.5} fontFamily={FONT} pointerEvents="none">
            {g.ne}
          </SvgText>,
        );
      });

      core.push(
        <G key="earth" pointerEvents="none">
          <Circle cx={CX} cy={CY} r={13} fill="url(#pg-earth)" />
          <Circle cx={CX} cy={CY} r={13} fill="none" stroke="#9fe0c8" strokeWidth={0.8} opacity={0.5} />
        </G>,
      );
    }

    const bsLabels: ReactNode[] = tw.show_lunar
      ? bsMonthsForWheel().map((m, i) => (
          <RingLabel
            key={`b${i}`}
            L={i * 30 + 15}
            r={R.bsMid}
            spin={spin}
            fill={tw.show_today && i === sunRashiIdx ? W_ACCENT : W_INK_DIM}
            size={tw.show_today && i === sunRashiIdx ? 13 : 12}
          >
            {m.ne}
          </RingLabel>
        ))
      : [];

    return { markerNodes, innerRings, core, bsLabels };
  }, [markers, det, spin, tw, moonNak, moonLon, sunLon, planetLons, lineTarget, pol, arcSeg]);

  const { nakSegs, nakDecor, rashiSegs, rashiDecor, padaCells, dayTicks, hits, rashiRays, gregLabels } = staticLayers;
  const { markerNodes, innerRings, core, bsLabels } = dataLayers;

  const planetHitNodes = useMemo(() => {
    if (!tw.show_planets) return null;
    return det.grahas.map((_, i) => {
      const meta = GRAHA_META[i]!;
      const lon = planetLons[i] ?? 0;
      const [px, py] = pol(lon, meta.orbit * ORBIT_SCALE);
      return (
        <Circle
          key={`phit${i}`}
          cx={px}
          cy={py}
          r={planetHitRadius(i)}
          fill="transparent"
          onPress={() => setLineTarget(i)}
        />
      );
    });
  }, [det.grahas, planetLons, pol, tw.show_planets]);

  return (
    <View
      ref={viewRef}
      style={{ flex: 1 }}
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        layoutRef.current = { ...layoutRef.current, w, h };
        syncLayout();
      }}
      {...wheelPan.panHandlers}
    >
      <View
        style={{
          flex: 1,
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: zoom }],
        }}
      >
        <Svg viewBox="42 42 916 916" width="100%" height="100%" pointerEvents="box-none">
        <Circle cx={CX} cy={CY} r={R.bsOut} fill="none" stroke={W_RIM} strokeWidth={1.4} />
        {[R.bsIn, R.nakOut, R.nakIn, R.padaIn, R_KAR_I, R.rashiOut, R.rashiIn].map((rad, k) => (
          <Circle key={`rc${k}`} cx={CX} cy={CY} r={rad} fill="none" stroke={W_RIM} strokeWidth={0.8} opacity={0.55} />
        ))}
        <Circle cx={CX} cy={CY} r={R.core} fill="none" stroke={W_RIM} strokeWidth={1.1} opacity={0.7} />

        {rashiSegs}
        {nakSegs}
        {padaCells}
        {rashiRays}
        {nakDecor}
        {rashiDecor}

        {gregLabels}
        {bsLabels}
        {dayTicks}

        {innerRings}
        {core}
        {markerNodes}
        {hits}
        {planetHitNodes}
      </Svg>
      </View>
    </View>
  );
}

export const WheelChart = memo(WheelChartImpl);
