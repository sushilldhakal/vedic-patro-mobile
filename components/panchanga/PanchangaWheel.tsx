import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PanchangaDay } from "@/lib/api";
import { fetchPanchangaAtTime, panchangaKeys } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n";
import { getPanchangaDetail } from "@/lib/panchanga-format";
import { BS_MONTHS_NE, BS_MONTH_NAMES, getBSMonthLength } from "@/lib/bs-calendar";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { minutesSinceMidnightInTimezone, resolveTimeZone } from "@/lib/zoned-time";
import {
  buildWheelDetail,
  buildWheelMarkers,
  buildWheelMarkersAtTime,
  bsMonthsForWheel,
  DEFAULT_WHEEL_TWEAKS,
  GRAHA_META,
  GREG_NE,
  gClock,
  normDeg,
  PADA_AKSHAR,
  scrubGToDatetime,
  WHEEL_RASHIS,
  type WheelDetail,
  type WheelMarkers,
  type WheelTweaks,
} from "@/lib/wheel-data";
import { KARANA_SEQ, karanaColor, WHEEL_TITHIS, WHEEL_YOGAS } from "@/lib/tithi-wheel-data";

const W_BG = "#061f21";
const W_STAGE = "#0a2e30";
const W_RIM = "rgba(143,191,193,0.35)";
const W_SEP = "rgba(143,191,193,0.18)";
const W_ACCENT = "#4ecdc4";
const W_INK = "#c8e0e2";
const W_INK_DIM = "rgba(200,224,226,0.65)";
const W_BAND = "#0d2a2c";
const W_BAND_ALT = "#0a2224";
const W_RASHI = "#0f3234";
const W_RASHI_ALT = "#0c282a";
const W_PADA = "#0a2426";
const W_PADA_ALT = "#081e20";
const FONT = "Mukta_600SemiBold";

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

const R = {
  rimOuter: 497,
  bsOut: 453,
  bsMid: 438,
  bsIn: 424,
  nakOut: 423,
  nakIn: 345,
  padaOut: 345,
  padaIn: 327,
  rashiOut: 263,
  rashiGlyph: 246,
  rashiName: 222,
  rashiIn: 178,
  core: 178,
} as const;

function bsMonthEnOf(ne: string): string {
  const i = BS_MONTHS_NE.indexOf(ne);
  return i >= 0 ? BS_MONTH_NAMES[i]! : ne;
}

type Props = {
  p?: PanchangaDay;
  loading?: boolean;
  bsYear: number;
  bsMonthNe: string;
  bsDay: number;
  isToday?: boolean;
  timezone?: string;
  locationLabel?: string;
};

function RingLabel({
  L,
  r,
  spin,
  size = 11,
  fill = W_INK,
  children,
}: {
  L: number;
  r: number;
  spin: number;
  size?: number;
  fill?: string;
  children: string;
}) {
  const a = normDeg(L + spin);
  const flip = a > 90 && a < 270;
  return (
    <G transform={`rotate(${-(L + spin)} ${CX} ${CY})`}>
      <SvgText
        x={CX}
        y={CY - r}
        textAnchor="middle"
        alignmentBaseline="middle"
        fill={fill}
        fontSize={size}
        fontFamily={FONT}
        transform={flip ? `rotate(180 ${CX} ${CY - r})` : undefined}
      >
        {children}
      </SvgText>
    </G>
  );
}

function WheelChart({
  det,
  markers,
  spin,
  tw,
  bsYear,
}: {
  det: WheelDetail;
  markers: WheelMarkers;
  spin: number;
  tw: WheelTweaks;
  bsYear: number;
}) {
  const [lineTarget, setLineTarget] = useState(1);

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
      nakSegs.push(
        <Path
          key={`ns${i}`}
          d={arcSeg(L0, L1, R.nakIn, R.nakOut)}
          fill={i % 2 ? W_BAND_ALT : W_BAND}
          stroke={W_SEP}
          strokeWidth={0.6}
        />,
      );
      nakDecor.push(
        <RingLabel key={`ni${i}`} L={Lm} r={(R.nakIn + R.nakOut) / 2} spin={spin} size={10}>
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
      rashiSegs.push(
        <Path
          key={`rs${i}`}
          d={arcSeg(L0, L1, R.rashiIn, R.rashiOut)}
          fill={i % 2 ? W_RASHI_ALT : W_RASHI}
          stroke={W_SEP}
          strokeWidth={0.6}
        />,
      );
      const [gx, gy] = pol(Lm, R.rashiGlyph);
      rashiDecor.push(
        <G key={`rd${i}`}>
          <SvgText x={gx} y={gy} textAnchor="middle" alignmentBaseline="middle" fill={W_INK} fontSize={22} fontFamily={FONT}>
            {rs.sym}
          </SvgText>
          <RingLabel L={Lm} r={R.rashiName} spin={spin} size={10}>
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
              fill={Math.floor(i / 4) % 2 ? W_PADA_ALT : W_PADA}
              stroke={W_SEP}
              strokeWidth={0.4}
            />
            <RingLabel L={Lm} r={336} spin={spin} size={8} fill={W_INK_DIM}>
              {PADA_AKSHAR[Math.floor(i / 4)]![i % 4]!}
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
              stroke={major ? W_INK_DIM : W_SEP}
              strokeWidth={major ? 0.9 : 0.55}
              opacity={major ? 0.85 : 0.6}
            />,
          );
        }
      }
    }

    const rashiRays: ReactNode[] = [];
    for (let i = 0; i < 12; i++) {
      const [x1, y1] = pol(i * 30, 12);
      const [x2, y2] = pol(i * 30, R.rimOuter - 2);
      rashiRays.push(<Line key={`ray${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={W_SEP} strokeWidth={0.5} opacity={0.5} />);
    }

    return { nakSegs, nakDecor, rashiSegs, rashiDecor, padaCells, dayTicks, rashiRays };
  }, [spin, bsYear, tw, pol, arcSeg]);

  const dataLayers = useMemo(() => {
    const sunRashiIdx = Math.floor(normDeg(sunLon) / 30);
    const moonRashiIdx = Math.floor(normDeg(moonLon) / 30);
    const markerNodes: ReactNode[] = [];

    if (tw.show_today) {
      const L0 = moonNak * (360 / 27);
      const L1 = (moonNak + 1) * (360 / 27);
      markerNodes.push(
        <Path key="now-nak" d={arcSeg(L0, L1, R.nakIn, R.nakOut)} fill={`${W_ACCENT}30`} stroke={W_ACCENT} strokeWidth={1.2} />,
      );
      markerNodes.push(
        <Path
          key="now-rashi"
          d={arcSeg(moonRashiIdx * 30, moonRashiIdx * 30 + 30, R.rashiIn, R.rashiOut)}
          fill={`${W_ACCENT}30`}
          stroke={W_ACCENT}
          strokeWidth={1.2}
        />,
      );
      markerNodes.push(
        <Path
          key="now-bs"
          d={arcSeg(sunRashiIdx * 30, sunRashiIdx * 30 + 30, R.bsIn, R.bsOut)}
          fill={`${W_ACCENT}30`}
          stroke={W_ACCENT}
          strokeWidth={1.2}
        />,
      );

      const targetLon = planetLons[lineTarget] ?? moonLon;
      const [lx, ly] = pol(targetLon, R.bsOut - 2);
      markerNodes.push(<Line key="target-line" x1={CX} y1={CY} x2={lx} y2={ly} stroke={W_ACCENT} strokeWidth={1.2} opacity={0.9} />);
      markerNodes.push(
        <G key="target-cap" transform={`rotate(${-(targetLon + spin)} ${CX} ${CY})`}>
          <Circle cx={CX} cy={CY - (R.bsOut - 2)} r={3.4} fill={W_ACCENT} />
        </G>,
      );
    }

    const innerRings: ReactNode[] = [];
    if (tw.show_today) {
      const sunL = markers.sunLon;
      const elongation = normDeg(markers.moonLon - sunL);
      const curTithiIdx = Math.floor(elongation / 12);
      const curKarIdx = Math.floor(elongation / 6);
      innerRings.push(<Circle key="yoga-i" cx={CX} cy={CY} r={R_YOGA_I} fill="none" stroke={W_RIM} strokeWidth={0.8} opacity={0.5} />);

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
            fill={isCur ? "#6448a860" : y % 2 ? "#6448a828" : "#7c5cbf22"}
            stroke={isCur ? "#c4a8f0" : "rgba(100,72,168,0.25)"}
            strokeWidth={isCur ? 1.6 : 0.4}
            opacity={isCur ? 1 : 0.82}
          />,
        );
        innerRings.push(
          <RingLabel L={Lm} r={(R_YOGA_I + R_YOGA_O) / 2} spin={spin} size={isCur ? 7 : 5.5} fill={isCur ? W_ACCENT : W_INK_DIM}>
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
        innerRings.push(
          <Path
            key={`kar${k}`}
            d={arcSeg(L0, L1, R_KAR_I, R_KAR_O)}
            fill={karanaColor(kd)}
            stroke={isCur ? W_ACCENT : "rgba(0,0,0,0.32)"}
            strokeWidth={isCur ? 1.7 : 0.4}
            opacity={isCur ? 1 : 0.78}
          />,
        );
        if (isCur || k % 5 === 0) {
          innerRings.push(
            <RingLabel L={Lm} r={(R_KAR_I + R_KAR_O) / 2} spin={spin} size={isCur ? 9 : 7} fill={isCur ? W_ACCENT : W_INK_DIM}>
              {kd.ne.length > 4 ? kd.ne.slice(0, 4) : kd.ne}
            </RingLabel>,
          );
        }
      }

      for (let i = 0; i < 30; i++) {
        const L0 = sunL + i * 12;
        const L1 = sunL + (i + 1) * 12;
        const Lm = sunL + i * 12 + 6;
        const isCur = i === curTithiIdx;
        const shukla = i < 15;
        const tName = WHEEL_TITHIS[i]!.ne;
        innerRings.push(
          <Path
            key={`tit${i}`}
            d={arcSeg(L0, L1, R_TIT_I, R_TIT_O)}
            fill={isCur ? `${W_ACCENT}48` : shukla ? "#2d8a8640" : "#2d8a8624"}
            stroke={isCur ? W_ACCENT : "rgba(143,191,193,0.18)"}
            strokeWidth={isCur ? 1.7 : 0.5}
          />,
        );
        if (isCur || i % 3 === 0) {
          innerRings.push(
            <RingLabel L={Lm} r={(R_TIT_I + R_TIT_O) / 2} spin={spin} size={isCur ? 11 : 8} fill={isCur ? W_ACCENT : W_INK}>
              {tName.length > 6 ? tName.slice(0, 6) : tName}
            </RingLabel>,
          );
        }
      }
    }

    const core: ReactNode[] = [];
    if (tw.show_planets) {
      core.push(
        <Defs key="pdefs">
          {GRAHA_META.map((meta, i) => (
            <RadialGradient key={`pg${i}`} id={`pg${i}`} cx="38%" cy="32%" r="68%">
              <Stop offset="0%" stopColor={meta.color} stopOpacity={0.9} />
              <Stop offset="100%" stopColor={meta.color} stopOpacity={0.5} />
            </RadialGradient>
          ))}
          <RadialGradient id="pg-earth" cx="38%" cy="32%" r="68%">
            <Stop offset="0%" stopColor="#a8f0d0" />
            <Stop offset="100%" stopColor="#0a3828" />
          </RadialGradient>
        </Defs>,
      );

      [44, 70, 96, 120, 150, 178, 204, 216].forEach((rad, k) =>
        core.push(<Circle key={`orb${k}`} cx={CX} cy={CY} r={rad * ORBIT_SCALE} fill="none" stroke={W_SEP} strokeWidth={0.5} opacity={0.4} />),
      );

      det.grahas.forEach((g, i) => {
        const meta = GRAHA_META[i]!;
        const lon = planetLons[i] ?? 0;
        const [px, py] = pol(lon, meta.orbit * ORBIT_SCALE);
        const planetR = "big" in meta && meta.big ? 15 : i === 1 ? 10 : 8;

        core.push(<Circle key={`glow${i}`} cx={px} cy={py} r={planetR + 6} fill={meta.color} opacity={0.15} />);

        if ("ring" in meta && meta.ring) {
          core.push(
            <Ellipse key={`ring${i}`} cx={px} cy={py} rx={planetR + 8} ry={planetR * 0.45} fill="none" stroke={meta.color} strokeWidth={2} opacity={0.88} transform={`rotate(-20 ${px} ${py})`} />,
          );
        }

        core.push(<Circle key={`pl${i}`} cx={px} cy={py} r={planetR} fill={`url(#pg${i})`} stroke={meta.color} strokeWidth={0.8} />);
        core.push(
          <SvgText key={`pn${i}`} x={px} y={py + planetR + 9} textAnchor="middle" fill={W_INK_DIM} fontSize={8} fontFamily={FONT}>
            {g.ne}
          </SvgText>,
        );
        core.push(
          <Circle key={`hit${i}`} cx={px} cy={py} r={planetR + 10} fill="transparent" onPress={() => setLineTarget(i)} />,
        );
      });

      core.push(<Circle key="earth" cx={CX} cy={CY} r={13} fill="url(#pg-earth)" stroke="#9fe0c8" strokeWidth={0.8} opacity={0.9} />);
    }

    const bsLabels = tw.show_lunar
      ? bsMonthsForWheel().map((m, i) => (
          <RingLabel
            key={`b${i}`}
            L={i * 30 + 15}
            r={R.bsMid}
            spin={spin}
            size={10}
            fill={tw.show_today && i === sunRashiIdx ? W_ACCENT : W_INK_DIM}
          >
            {m.ne}
          </RingLabel>
        ))
      : [];

    const gregLabels = tw.show_greg
      ? GREG_NE.map((m, i) => (
          <RingLabel key={`g${i}`} L={(i - 3) * 30 + 5} r={467} spin={spin} size={9} fill={W_INK_DIM}>
            {m}
          </RingLabel>
        ))
      : [];

    return { markerNodes, innerRings, core, bsLabels, gregLabels };
  }, [markers, det, spin, tw, moonNak, moonLon, sunLon, planetLons, lineTarget, pol, arcSeg]);

  const { nakSegs, nakDecor, rashiSegs, rashiDecor, padaCells, dayTicks, rashiRays } = staticLayers;
  const { markerNodes, innerRings, core, bsLabels, gregLabels } = dataLayers;

  return (
    <Svg viewBox="42 42 916 916" width="100%" height="100%">
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
    </Svg>
  );
}

function GhatiScrubber({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (g: number) => void;
  label: string;
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (width <= 0) return;
        const x = evt.nativeEvent.locationX;
        onChange(Math.max(0, Math.min(60, (x / width) * 60)));
      },
      onPanResponderMove: (evt) => {
        if (width <= 0) return;
        const x = evt.nativeEvent.locationX;
        onChange(Math.max(0, Math.min(60, (x / width) * 60)));
      },
    }),
  ).current;

  const pct = (value / 60) * 100;

  return (
    <View className="flex-1 gap-1">
      <View
        className="h-8 justify-center rounded-lg border border-border bg-card px-1"
        onLayout={onLayout}
        {...pan.panHandlers}
      >
        <View className="h-1.5 overflow-hidden rounded-full bg-muted">
          <View className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} />
        </View>
        <View
          className="absolute h-4 w-4 rounded-full border-2 border-card bg-secondary"
          style={{ left: `${pct}%`, marginLeft: -8, top: "50%", marginTop: -8 }}
        />
      </View>
      {Platform.OS === "web" ? (
        <input
          type="range"
          min={0}
          max={60}
          step={0.25}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#2d8a86" }}
          aria-label={label}
        />
      ) : null}
    </View>
  );
}

function WheelBody({
  p,
  bsYear,
  bsMonthNe,
  bsDay,
  isToday,
  timezone,
  locationLabel,
}: Omit<Props, "loading" | "p"> & { p: PanchangaDay }) {
  const { pick, digits } = useLocale();
  const det = useMemo(() => buildWheelDetail(p), [p]);
  const tz = resolveTimeZone(p?.location?.timezone, timezone);
  const [now, setNow] = useState(() => new Date());
  const [spin, setSpin] = useState(0);
  const spinRef = useRef(spin);
  spinRef.current = spin;
  const [scrubPinned, setScrubPinned] = useState(false);
  const spinStart = useRef({ spin0: 0, angle0: 0 });
  const wheelSize = useRef({ w: 0, h: 0 });

  const nowG = useMemo(() => {
    const mins = minutesSinceMidnightInTimezone(now, tz, true);
    let g = (mins - det.sunriseMin) / 24;
    if (g < 0) g += 60;
    return Math.max(0, Math.min(60, g));
  }, [now, det.sunriseMin, tz]);

  const [scrubG, setScrubG] = useState(() => (isToday ? nowG : 0));
  const [debouncedScrubG, setDebouncedScrubG] = useState(scrubG);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedScrubG(scrubG), 400);
    return () => clearTimeout(id);
  }, [scrubG]);

  const anchorAd = p.panchanga_date_ad ?? p.date_ad ?? "";
  const locationParams = useMemo(
    () =>
      p.location?.city_id != null
        ? { city_id: p.location.city_id as number }
        : p.location?.lat != null && p.location?.lon != null
          ? { lat: p.location.lat as number, lon: p.location.lon as number, timezone: p.location.timezone }
          : undefined,
    [p.location],
  );

  const scrubDatetime = useMemo(
    () => scrubGToDatetime(anchorAd, debouncedScrubG, det.sunriseMin),
    [anchorAd, debouncedScrubG, det.sunriseMin],
  );

  const scrubbing = scrubPinned || Math.abs(scrubG - (isToday && !scrubPinned ? nowG : 0)) > 0.05;
  const needsAtTime = Boolean(anchorAd) && scrubbing;

  const scrubQ = useQuery({
    queryKey: panchangaKeys.atTime(scrubDatetime, locationParams),
    queryFn: () => fetchPanchangaAtTime(scrubDatetime, locationParams),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled: needsAtTime,
  });

  const atTimeData = needsAtTime && !scrubQ.isPlaceholderData ? scrubQ.data : undefined;
  const markers = useMemo(
    () => (atTimeData ? buildWheelMarkersAtTime(atTimeData) : buildWheelMarkers(p, det, scrubG)),
    [atTimeData, p, det, scrubG],
  );

  const handleScrubChange = useCallback((g: number) => {
    setScrubG(g);
    setScrubPinned(true);
  }, []);

  const snapToNow = useCallback(() => {
    setScrubPinned(false);
    setSpin(0);
    setScrubG(nowG);
  }, [nowG]);

  const resetToSunrise = useCallback(() => {
    setScrubPinned(true);
    setSpin(0);
    setScrubG(0);
  }, []);

  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [isToday]);

  useEffect(() => {
    if (scrubPinned || !isToday) return;
    setScrubG(nowG);
  }, [nowG, isToday, scrubPinned]);

  useEffect(() => {
    setScrubPinned(false);
    setSpin(0);
    setScrubG(isToday ? nowG : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.date_ad, p.panchanga_date_ad]);

  const scrubClock = gClock(scrubG, det.sunriseMin);
  const scrubTithi = atTimeData
    ? ((getPanchangaDetail(atTimeData)?.tithi as { name_ne?: string; name?: string } | undefined) ??
      (atTimeData.tithi as { name_ne?: string; name?: string } | undefined))
    : undefined;
  const tithiNe = scrubTithi?.name_ne ?? det.tithi2[0]?.ne ?? "—";
  const tithiEn = scrubTithi?.name ?? det.tithi2[0]?.en ?? tithiNe;
  const locLabel = locationLabel ?? p.location?.name ?? pick("काठमाडौं", "Kathmandu");

  const rotatePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const { w, h } = wheelSize.current;
        if (w <= 0 || h <= 0) return;
        const cx = w / 2;
        const cy = h / 2;
        spinStart.current = {
          spin0: spinRef.current,
          angle0: (Math.atan2(locationY - cy, locationX - cx) * 180) / Math.PI,
        };
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const { w, h } = wheelSize.current;
        if (w <= 0 || h <= 0) return;
        const cx = w / 2;
        const cy = h / 2;
        const angle = (Math.atan2(locationY - cy, locationX - cx) * 180) / Math.PI;
        setSpin(spinStart.current.spin0 + (angle - spinStart.current.angle0));
      },
    }),
  ).current;

  return (
    <View className="overflow-hidden rounded-xl border border-border" style={{ backgroundColor: W_BG }}>
      <View className="border-b border-border/40 px-4 py-3" style={{ backgroundColor: W_STAGE }}>
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {pick("पञ्चाङ्ग चक्र", "Nepali Patro · Panchanga Wheel")}
        </Text>
        <Text className="mt-0.5 text-base font-bold text-foreground">
          {isToday && !scrubPinned ? `${pick("आजको", "Today's")} ` : ""}
          {pick("ग्रह–नक्षत्र · तिथि–करण चक्र", "Graha–Nakshatra · Tithi–Karana wheel")}{" "}
          <Text className="text-secondary">{digits(bsYear)}</Text>
        </Text>
        <Text className="mt-0.5 text-sm text-muted-foreground">
          {pick(det.weekday.ne, det.weekday.en)}, {pick(bsMonthNe, bsMonthEnOf(bsMonthNe))} {digits(bsDay)} ·{" "}
          {pick(tithiNe, tithiEn)} · {locLabel}
        </Text>
      </View>

      <View
        className="aspect-square w-full max-w-[520px] self-center p-2"
        onLayout={(e) => {
          wheelSize.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
        }}
        {...rotatePan.panHandlers}
      >
        <WheelChart det={det} markers={markers} spin={spin} tw={DEFAULT_WHEEL_TWEAKS} bsYear={bsYear} />
      </View>

      <View className="gap-1 border-t border-border/40 px-4 py-2" style={{ backgroundColor: W_STAGE }}>
        <View className="flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full bg-secondary" />
          <Text className="text-xs text-muted-foreground">
            {pick("लग्न · वर्तमान नक्षत्र · तिथि", "Lagna · current nakshatra · tithi")}
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground/70">
          {pick("घुमाउन तान्नुहोस्", "Drag to rotate")}
        </Text>
      </View>

      <View className="flex-row flex-wrap items-center gap-2 border-t border-border/40 px-4 py-3" style={{ backgroundColor: W_STAGE }}>
        <Text className="shrink-0 text-xs font-semibold text-muted-foreground">{pick("समय", "Time")}</Text>
        <GhatiScrubber value={scrubG} onChange={handleScrubChange} label={pick("समय", "Time")} />
        <Text className="min-w-[52px] text-center font-num text-sm font-bold text-foreground">{digits(scrubClock)}</Text>
        {isToday ? (
          <Pressable onPress={snapToNow} className="rounded-lg border border-secondary/40 bg-secondary/15 px-3 py-1.5 active:opacity-80">
            <Text className="text-sm font-semibold text-secondary">{pick("आज", "Now")}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={resetToSunrise} className="h-8 w-8 items-center justify-center rounded-lg border border-border bg-card active:bg-muted">
          <Text className="text-base text-foreground">⟳</Text>
        </Pressable>
      </View>
    </View>
  );
}

function WheelSkeleton({
  bsYear,
  bsMonthNe,
  bsDay,
  locationLabel,
}: Pick<Props, "bsYear" | "bsMonthNe" | "bsDay" | "locationLabel">) {
  const { pick, digits } = useLocale();
  const locLabel = locationLabel ?? pick("काठमाडौं", "Kathmandu");

  return (
    <Card className="overflow-hidden p-0" style={{ backgroundColor: W_BG }}>
      <View className="border-b border-border/40 px-4 py-3" style={{ backgroundColor: W_STAGE }}>
        <Text className="text-xs font-semibold text-muted-foreground">{pick("पञ्चाङ्ग चक्र", "Nepali Patro · Panchanga Wheel")}</Text>
        <Text className="mt-0.5 text-base font-bold text-foreground">
          {pick("ग्रह–नक्षत्र · तिथि–करण चक्र", "Graha–Nakshatra · Tithi–Karana wheel")}{" "}
          <Text className="text-secondary">{digits(bsYear)}</Text>
        </Text>
        <Text className="mt-0.5 text-sm text-muted-foreground">
          {pick(bsMonthNe, bsMonthEnOf(bsMonthNe))} {digits(bsDay)} · {locLabel}
        </Text>
      </View>
      <View className="mx-auto aspect-square w-full max-w-[520px] animate-pulse bg-muted/20" />
      <View className="h-14 border-t border-border/40 bg-muted/10" />
    </Card>
  );
}

function PanchangaWheelImpl({
  p,
  loading = false,
  bsYear,
  bsMonthNe,
  bsDay,
  isToday,
  timezone,
  locationLabel,
}: Props) {
  if (loading || !p) {
    return <WheelSkeleton bsYear={bsYear} bsMonthNe={bsMonthNe} bsDay={bsDay} locationLabel={locationLabel} />;
  }
  return (
    <WheelBody
      p={p}
      bsYear={bsYear}
      bsMonthNe={bsMonthNe}
      bsDay={bsDay}
      isToday={isToday}
      timezone={timezone}
      locationLabel={locationLabel}
    />
  );
}

export const PanchangaWheel = memo(PanchangaWheelImpl);
