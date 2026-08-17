/**
 * The Learn playground — one scene, configured per topic, on iOS and Android.
 *
 * The scene carries the geometry; this file is the instrument panel around it.
 * Which layers open, what the play button moves and where the camera starts all
 * come from `lib/learn/playground-config`, so a topic about the day opens
 * spinning the planet with its three day-arcs showing, and one about sankranti
 * opens creeping along the राशि belt with the Sun's sightline lit.
 *
 * Nothing is taken away by that. The group chips — बर्ष · सूर्य · दिन · अक्ष
 * झुकाव — plus the belt chips reach every layer in the scene from any topic, so
 * a reader who wants the whole picture is one press from it. The config decides
 * the opening frame, not the ceiling.
 *
 * The clock and camera live in refs and are mutated by the render loop, so
 * neither playing nor dragging re-renders React. What React sees is a sample
 * the scene hands back a few times a second, and the readouts are drawn from
 * that and nothing else.
 *
 * ── what this file does differently from the web's `DayPlaygroundStudy` ──
 *
 *   - **Touch, not pointers.** A `PanResponder` on the canvas wrapper, the same
 *     one the other 3D diagrams use: one finger orbits, two pinch the camera
 *     distance. There is no wheel to zoom with, so the pinch has to carry it.
 *   - **Panels are sheets, not popovers.** A 290px drawer floating over a phone
 *     canvas covers the thing it is adjusting. The controls and the focus menu
 *     open as bottom sheets over the whole card instead, which is the pattern
 *     the rest of this app already uses for its own pickers.
 *   - **Fullscreen is a `Modal`.** No portal and no Fullscreen API on a phone —
 *     and a modal is better here anyway, since it takes the status bar and the
 *     tab bar with it.
 *   - **`<select>` becomes chips.** The planet presets are a scrolling row, and
 *     the focus radio group a segmented row, because neither has a native
 *     dropdown worth reaching for at this size.
 */

import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

import { Canvas } from "@/components/learn/diagrams/LearnCanvas";
import { OverlaySheet } from "@/components/ui/OverlaySheet";
import { Text } from "@/components/ui/Text";
import { VedicPatroLoader } from "@/components/branding/VedicPatroLoader";
import { useLocale } from "@/lib/i18n";
import { useTheme } from "@/lib/theme-context";
import { nativeWindThemeVars } from "@/lib/nativewind-theme-vars";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { cn } from "@/lib/utils";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { BS_MONTHS_NE, BS_MONTH_NAMES } from "@/lib/bs-calendar";
import { getRashiList } from "@/lib/rashi-i18n";
import { NAKSHATRA_SHORT } from "@/lib/sky3d/nakshatra-stars";
import {
  clocks,
  dayCounts,
  equationOfTime,
  meanAnomalyAt,
  PERIHELION,
  PLANET_PRESETS,
  VERNAL,
} from "@/lib/sky3d/day-mechanics";
import {
  resolvePlayground,
  SPEED_MULTIPLIERS,
  type PlaygroundConfig,
} from "@/lib/learn/playground-config";
import EotGraph from "@/components/learn/playground/EotGraph";
import PerfMeter, { type PerfSample } from "@/components/learn/playground/PerfMeter";
import type { PlaygroundLabel } from "@/components/learn/playground/playground-labels";
import {
  LABEL_TONE as TONE,
  PlaygroundLabelText,
} from "@/components/learn/playground/PlaygroundLabelText";
import Scene, {
  type CameraState,
  type CameraTarget,
  type SceneSample,
  type SimClock,
  type SimToggles,
} from "@/components/learn/playground/DaySimScene";

const CANVAS_BG = "#04070d";
const PI2 = Math.PI * 2;
const DEG = Math.PI / 180;

/** The 1× rung in {@link SPEED_MULTIPLIERS} — where every topic opens. */
const DEFAULT_SPEED_RUNG = SPEED_MULTIPLIERS.indexOf(1);

/** Card height. Fullscreen always takes the window. */
const CARD_HEIGHT = 340;

const MIN_DISTANCE = 4;
const MAX_DISTANCE = 130;
const PITCH_LIMIT = 1.45;

function clampPitch(p: number) {
  return Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, p));
}

function clampDistance(d: number) {
  return Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, d));
}

/**
 * The group chips, and which layers each one owns.
 *
 * A group is on when every layer it owns is on, and pressing it turns the whole
 * set on or off together. This is the level a reader actually thinks at — "show
 * me the year" — while the sheet underneath still exposes each layer on its own
 * for when they want to take one thing away.
 */
const GROUPS = {
  year: ["planetOrbit", "monthRing", "rashiBelt"],
  sun: ["trueSun", "sightline", "sunOrbit"],
  day: ["siderealArc", "solarArc", "meanArc", "primeMeridian"],
  tilt: ["sunOrbit", "grid", "eotWedge", "meanSun", "axis"],
  moon: ["moon", "moonTrail", "moonLap", "moonSightline"],
} satisfies Record<string, (keyof SimToggles)[]>;

type GroupKey = keyof typeof GROUPS;

/** Earth plus the five graha the eye can see. No Uranus, no Neptune. */
const PLANET_NAMES: Record<string, [string, string]> = {
  earth: ["पृथ्वी", "Earth"],
  mars: ["मङ्गल", "Mars"],
  mercury: ["बुध", "Mercury"],
  jupiter: ["बृहस्पति", "Jupiter"],
  venus: ["शुक्र", "Venus"],
  saturn: ["शनि", "Saturn"],
};

export interface DayPlaygroundProps {
  /** The topic this playground belongs to — decides its opening state. */
  config: PlaygroundConfig;
  /** Heading over the card. Falls back to the playground's own name. */
  title?: string;
}

export function DayPlayground({ config, title }: DayPlaygroundProps) {
  const { lang, pick } = useLocale();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const ne = lang !== "en";
  const num = (v: number | string) => (ne ? toNepaliDigits(String(v)) : String(v));

  const initial = useMemo(() => resolvePlayground(config), [config]);

  const clock = useRef<SimClock>({
    day: 0,
    playing: false,
    daysPerSecond: initial.speed * SPEED_MULTIPLIERS[DEFAULT_SPEED_RUNG]!,
  });
  const camera = useRef<CameraState>({ ...initial.camera });
  const clockText = useRef({ sidereal: "", solar: "", mean: "" });

  const [playing, setPlaying] = useState(false);
  /* The 1× rung — the pace this topic was tuned for. Below it sit the two slow
     rungs for watching a single day. */
  const [speed, setSpeed] = useState(DEFAULT_SPEED_RUNG);
  const [sample, setSample] = useState<SceneSample | null>(null);
  const [labels, setLabels] = useState<PlaygroundLabel[]>([]);
  const [flash, setFlash] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [sheet, setSheet] = useState<"controls" | "focus" | null>(null);
  const [graphOpen, setGraphOpen] = useState(false);
  /* Off by default and reachable only from the controls sheet — see PerfMeter
     for why it is not gated on `__DEV__`. */
  const [perfOpen, setPerfOpen] = useState(false);
  const [perf, setPerf] = useState<PerfSample | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  /** Which planet preset is showing; `""` is this topic's own. */
  const [preset, setPreset] = useState("");

  const [solarDaysPerYear, setSolarDaysPerYear] = useState(initial.params.daysPerYear - 1);
  const [eccentricity, setEccentricity] = useState(initial.params.eccentricity);
  const [tiltDeg, setTiltDeg] = useState(initial.params.tilt / DEG);

  const [cameraTarget, setCameraTarget] = useState<CameraTarget>("meanSun");
  const [cameraFollow, setCameraFollow] = useState(false);
  const [toggles, setToggles] = useState<SimToggles>(initial.toggles);

  /* The canvas is torn down and rebuilt when it moves into the modal, so the
     labels from the old one would otherwise hang over the new frame. */
  useEffect(() => {
    setLabels([]);
    setReady(false);
  }, [fullscreen]);

  useEffect(() => {
    clock.current.playing = playing;
  }, [playing]);
  useEffect(() => {
    clock.current.daysPerSecond = initial.speed * SPEED_MULTIPLIERS[speed]!;
  }, [speed, initial.speed]);

  const onSample = useCallback((s: SceneSample) => {
    setSample(s);
    if (s.sankranti !== null) setFlash(s.sankranti);
  }, []);

  useEffect(() => {
    if (flash === null) return;
    const id = setTimeout(() => setFlash(null), 2400);
    return () => clearTimeout(id);
  }, [flash]);

  const daysPerYear = solarDaysPerYear + 1;
  const tilt = tiltDeg * DEG;

  const params = useMemo(
    () => ({ daysPerYear, eccentricity, tilt }),
    [daysPerYear, eccentricity, tilt],
  );

  const day = sample?.day ?? 0;
  const rashi = sample?.rashi ?? 0;

  const meanAnomaly = meanAnomalyAt(day / daysPerYear);
  const eot = equationOfTime(meanAnomaly, eccentricity, tilt, PERIHELION - VERNAL);
  const eotMinutes = (eot * 24 * 60) / PI2;

  /* How far the sidereal clock has crept ahead of the mean one: a turn a year
     spread evenly, so it opens at zero and closes on a full 24h. This is the
     one reading that grows monotonically, which is what makes it legible while
     the clock faces themselves are spinning past too fast to compare. */
  const siderealGainMinutes = (day / daysPerYear) * 24 * 60;

  /**
   * How long one of each kind of day actually lasts, in minutes of mean time.
   *
   * This is where the difference is a plain number rather than a gap you have
   * to watch accumulate — the mean day is 24h by definition, the sidereal day
   * is shorter by the orbit's own share of a turn, and the true solar day is
   * the only one whose length changes from day to day.
   *
   * The true one is measured, not derived: apparent noon comes a little early
   * or late depending on which way the equation of time is moving that week, so
   * the length is 24h minus the day's own change in it.
   */
  const dayLengths = useMemo(() => {
    const eotMinAt = (d: number) =>
      (equationOfTime(meanAnomalyAt(d / daysPerYear), eccentricity, tilt, PERIHELION - VERNAL) *
        24 *
        60) /
      PI2;
    return {
      sidereal: 1440 * (1 - 1 / daysPerYear),
      mean: 1440,
      solar: 1440 - (eotMinAt(day + 0.5) - eotMinAt(day - 0.5)),
    };
  }, [day, daysPerYear, eccentricity, tilt]);

  const readings = useMemo(() => clocks(day, daysPerYear, eot), [day, daysPerYear, eot]);
  const counts = useMemo(() => dayCounts(day, daysPerYear, eot), [day, daysPerYear, eot]);

  useEffect(() => {
    clockText.current = readings;
  }, [readings]);

  /* ── Nepali belts. The app already owns all three name lists. ─────── */
  const rashiNames = useMemo(() => getRashiList(lang), [lang]);
  const monthNames = useMemo(
    () => (ne ? BS_MONTHS_NE : ([...BS_MONTH_NAMES] as string[])),
    [ne],
  );
  const nakshatraNames = useMemo(() => NAKSHATRA_SHORT.map((n) => (ne ? n.ne : n.en)), [ne]);
  const bodyNames = useMemo(
    () => ({
      planet: pick("पृथ्वी", "Earth"),
      sun: pick("सूर्य", "Sun"),
      meanSun: pick("माध्य सूर्य", "Mean Sun"),
      moon: pick("चन्द्र", "Moon"),
      rahu: pick("राहु", "Rāhu"),
      ketu: pick("केतु", "Ketu"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang],
  );

  const setToggle = useCallback(
    (k: keyof SimToggles) => setToggles((t) => ({ ...t, [k]: !t[k] })),
    [],
  );

  const groupOn = useCallback((g: GroupKey) => GROUPS[g].every((k) => toggles[k]), [toggles]);
  const pressGroup = useCallback((g: GroupKey) => {
    setToggles((t) => {
      const on = GROUPS[g].every((k) => t[k]);
      const next = { ...t };
      for (const k of GROUPS[g]) next[k] = !on;
      return next;
    });
  }, []);

  /** Empty key means this topic's own settings — the way back from a preset. */
  const applyPreset = useCallback(
    (key: string) => {
      setPreset(key);
      const p = PLANET_PRESETS.find((x) => x.key === key);
      if (!p) {
        setToggles(initial.toggles);
        setSolarDaysPerYear(initial.params.daysPerYear - 1);
        setEccentricity(initial.params.eccentricity);
        setTiltDeg(initial.params.tilt / DEG);
        return;
      }
      setSolarDaysPerYear(Math.max(1, Math.min(365, Math.round(p.daysPerYear - 1))));
      setEccentricity(p.eccentricity);
      setTiltDeg(p.tilt);
    },
    [initial],
  );

  /* ── gestures ─────────────────────────────────────────────────────── */
  const gestureStart = useRef({ yaw: 0, pitch: 0, distance: 0, pinch: 0 });
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.hypot(g.dx, g.dy) > 2,
        onPanResponderGrant: () => {
          gestureStart.current = { ...camera.current, pinch: 0 };
        },
        onPanResponderMove: (e, g) => {
          const touches = e.nativeEvent.touches;
          if (touches.length >= 2) {
            const [a, b] = touches;
            if (!a || !b) return;
            const spread = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
            if (!spread) return;
            /* Anchored on the spread at the moment the second finger landed, so
               the zoom is absolute rather than accumulating drift over a long
               pinch. */
            if (!gestureStart.current.pinch) gestureStart.current.pinch = spread;
            camera.current.distance = clampDistance(
              gestureStart.current.distance * (gestureStart.current.pinch / spread),
            );
            return;
          }
          /* Drag the system, not the camera — pull right and the far side swings
             right, which means the camera itself travels the other way. */
          camera.current.yaw = gestureStart.current.yaw - g.dx * 0.006;
          camera.current.pitch = clampPitch(gestureStart.current.pitch + g.dy * 0.005);
        },
      }),
    [],
  );

  const zoomBy = useCallback((factor: number) => {
    camera.current.distance = clampDistance(camera.current.distance * factor);
  }, []);

  const resetView = useCallback(() => {
    camera.current.yaw = initial.camera.yaw;
    camera.current.pitch = initial.camera.pitch;
    camera.current.distance = initial.camera.distance;
  }, [initial]);

  const canvasHeight = fullscreen ? windowHeight : CARD_HEIGHT;
  const overlayTop = fullscreen ? Math.max(insets.top, 24) + 12 : 10;

  /* ── formatting ───────────────────────────────────────────────────── */

  /** A signed gap in minutes as `+6h 18m` / `−12 min`. */
  const gapLabel = (minutes: number) => {
    /* Rounded before the sign is taken, so a gap of −0.1 min reads `0 min`
       rather than the nonsense `−0 min`. */
    const whole = Math.round(minutes);
    const sign = whole < 0 ? "−" : whole > 0 ? "+" : "";
    const abs = Math.abs(whole);
    const h = Math.floor(abs / 60);
    const m = abs - h * 60;
    return `${sign}${num(
      h > 0 ? `${h}${pick("घ", "h")} ${m}${pick("मि", "m")}` : `${m} ${pick("मिनेट", "min")}`,
    )}`;
  };

  /**
   * A duration in minutes as `23h 56m 04s` — seconds included because the true
   * solar day only ever moves in that last column.
   */
  const lengthLabel = (minutes: number) => {
    const total = Math.round(minutes * 60);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total - h * 3600) / 60);
    const s = total - h * 3600 - m * 60;
    return num(
      `${h}${pick("घ", "h")} ${String(m).padStart(2, "0")}${pick("मि", "m")} ${String(s).padStart(
        2,
        "0",
      )}${pick("से", "s")}`,
    );
  };

  /* ── pieces ───────────────────────────────────────────────────────── */

  const chip = (active: boolean, label: string, onPress: () => void, key?: string) => (
    <Pressable
      key={key ?? label}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={cn(
        "rounded-full border px-2.5 py-1",
        active ? "border-transparent bg-white/85" : "border-white/25 bg-transparent",
      )}
    >
      <Text
        className="text-[11px] font-semibold"
        style={[
          nepaliTextStyle(11),
          { color: active ? "#04070d" : "rgba(255,255,255,0.65)", fontSize: 11 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  /** One titled section of layer switches in the controls sheet. */
  const layerGroup = (heading: string, items: [keyof SimToggles, string][]) => (
    <View className="gap-1.5" key={heading}>
      <Text
        className="text-[10px] font-bold uppercase tracking-wide"
        style={[nepaliTextStyle(10), { color: "rgba(255,255,255,0.55)", fontSize: 10 }]}
      >
        {heading}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">
        {items.map(([k, label]) => chip(toggles[k], label, () => setToggle(k), k))}
      </View>
    </View>
  );

  const slider = (
    label: string,
    value: number,
    display: string,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
  ) => (
    <View className="gap-1" key={label}>
      <View className="flex-row items-baseline justify-between gap-2">
        <Text
          className="text-[10px] font-bold uppercase tracking-wide"
          style={[nepaliTextStyle(10), { color: "rgba(255,255,255,0.55)", fontSize: 10 }]}
        >
          {label}
        </Text>
        <Text
          className="text-[11px] font-semibold"
          style={[nepaliTextStyle(11), { color: "rgba(255,255,255,0.9)", fontSize: 11 }]}
        >
          {display}
        </Text>
      </View>
      <Slider
        style={{ width: "100%", height: 32 }}
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor="#f4c542"
        maximumTrackTintColor="rgba(148, 163, 184, 0.45)"
        thumbTintColor="#f4c542"
      />
    </View>
  );

  /** The filter row: four groups, then the three belts and the Moon. */
  const filterChips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="items-center gap-1.5"
    >
      {chip(groupOn("year"), pick("बर्ष", "Year"), () => pressGroup("year"), "g-year")}
      {chip(groupOn("sun"), pick("सूर्य", "Sun"), () => pressGroup("sun"), "g-sun")}
      {chip(groupOn("day"), pick("दिन", "Day"), () => pressGroup("day"), "g-day")}
      {chip(groupOn("tilt"), pick("अक्ष झुकाव", "Tilt"), () => pressGroup("tilt"), "g-tilt")}
      <View className="mx-0.5 h-4 w-px bg-white/20" />
      {chip(toggles.rashiBelt, pick("राशि", "Rashi"), () => setToggle("rashiBelt"), "t-rashi")}
      {chip(
        toggles.nakshatraBelt,
        pick("नक्षत्र", "Nakshatra"),
        () => setToggle("nakshatraBelt"),
        "t-nak",
      )}
      {chip(toggles.monthRing, pick("महिना", "Months"), () => setToggle("monthRing"), "t-month")}
      {chip(groupOn("moon"), pick("चन्द्र", "Moon"), () => pressGroup("moon"), "t-moon")}
    </ScrollView>
  );

  const controlsSheet = (
    <OverlaySheet
      title={pick("नियन्त्रण", "Controls")}
      onClose={() => setSheet(null)}
      maxHeight={canvasHeight * 0.82}
    >
      {/* A world to borrow. Chips rather than a dropdown: six of them fit one
          scrolling row, and a picker wheel for a one-press choice is worse. */}
      <View className="gap-1.5">
        <Text
          className="text-[10px] font-bold uppercase tracking-wide"
          style={[nepaliTextStyle(10), { color: "rgba(255,255,255,0.55)", fontSize: 10 }]}
        >
          {pick("ग्रह", "Planet")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="items-center gap-1.5"
        >
          {chip(preset === "", pick("यो विषय", "This topic"), () => applyPreset(""), "p-none")}
          {PLANET_PRESETS.map((p) =>
            chip(preset === p.key, PLANET_NAMES[p.key]![ne ? 0 : 1], () => applyPreset(p.key), p.key),
          )}
        </ScrollView>
      </View>

      {slider(
        pick("वर्षमा सौर दिन", "Solar days per year"),
        solarDaysPerYear,
        num(solarDaysPerYear),
        1,
        365,
        1,
        setSolarDaysPerYear,
      )}
      {slider(
        pick("उत्केन्द्रता", "Eccentricity"),
        eccentricity,
        num(eccentricity.toFixed(3)),
        0,
        0.4,
        0.001,
        setEccentricity,
      )}
      {slider(
        pick("अक्ष झुकाव", "Axial tilt"),
        tiltDeg,
        `${num(tiltDeg.toFixed(1))}°`,
        0,
        90,
        0.1,
        setTiltDeg,
      )}

      {/* Grouped as the scene groups them — guides, then the bodies, then the
          things that measure them — rather than one flat run of fifteen chips.
          Every layer stays individually reachable; the toolbar's group chips are
          a shortcut, not a replacement. */}
      {layerGroup(pick("मार्गदर्शक", "Guides"), [
        ["grid", pick("ग्रिड", "Grid")],
        ["planetOrbit", pick("कक्ष", "Orbit")],
        ["sunOrbit", pick("सूर्यपथ", "Sun path")],
        ["primeMeridian", pick("काठमाडौँ रेखा", "Kathmandu meridian")],
        ["axis", pick("अक्ष", "Spin axis")],
      ])}
      {layerGroup(pick("वस्तुहरू", "Elements"), [
        ["trueSun", pick("साँचो सूर्य", "True Sun")],
        ["meanSun", pick("माध्य सूर्य", "Mean Sun")],
        ["moon", pick("चन्द्र", "Moon")],
        ["eotWedge", pick("समय फरक", "EOT wedge")],
      ])}
      {layerGroup(pick("सङ्केत", "Indicators"), [
        ["siderealArc", pick("नाक्षत्र चाप", "Sidereal arc")],
        ["solarArc", pick("सौर चाप", "Solar arc")],
        ["meanArc", pick("माध्य चाप", "Mean arc")],
        ["sightline", pick("दृष्टिरेखा", "Sightline")],
        ["moonSightline", pick("चन्द्र दृष्टिरेखा", "Moon sightline")],
        ["moonTrail", pick("चन्द्रपथ", "Moon trail")],
        ["moonLap", pick("मास फरक", "Month gap")],
      ])}

      {/* Last, and its own section rather than a layer: it does not change what
          the scene shows, it reports what the scene costs. `docs/learn-playground.md`
          says what to do with the numbers. */}
      <View className="gap-1.5 border-t border-white/10 pt-2.5">
        <Text
          className="text-[10px] font-bold uppercase tracking-wide"
          style={[nepaliTextStyle(10), { color: "rgba(255,255,255,0.55)", fontSize: 10 }]}
        >
          {pick("मापन", "Measure")}
        </Text>
        <View className="flex-row flex-wrap gap-1.5">
          {chip(
            perfOpen,
            pick("फ्रेम दर", "Frame rate"),
            () => setPerfOpen((v) => !v),
            "perf",
          )}
        </View>
      </View>
    </OverlaySheet>
  );

  /* Focus: which body the view is hung on, and whether the camera rides round
     with the orbit. One of three, because the scene can only be centred on one
     thing; the follow switch is a separate question about that same choice, so
     it lives with it rather than among the layers. */
  const focusSheet = (
    <OverlaySheet
      title={pick("केन्द्रविन्दु", "Focus")}
      onClose={() => setSheet(null)}
      maxHeight={canvasHeight * 0.82}
    >
      <View className="flex-row flex-wrap gap-1.5">
        {(
          [
            ["meanSun", pick("माध्य सूर्य", "Mean Sun")],
            ["sun", pick("सूर्य", "Sun")],
            ["planet", pick("पृथ्वी", "Earth")],
          ] as [CameraTarget, string][]
        ).map(([key, label]) => chip(cameraTarget === key, label, () => setCameraTarget(key), key))}
      </View>
      <View className="flex-row flex-wrap gap-1.5 border-t border-white/10 pt-2.5">
        {chip(
          cameraFollow,
          pick("कक्ष पछ्याउनुहोस्", "Follow orbit"),
          () => setCameraFollow((v) => !v),
          "follow",
        )}
      </View>

      {/* Rate lives with focus, not with the orbit's own figures: it is about
          how the reader watches the thing, the same question the rest of this
          sheet answers. */}
      <View className="border-t border-white/10 pt-2.5">
        {slider(
          pick("कक्षीय गति", "Orbit speed"),
          speed,
          `${num(SPEED_MULTIPLIERS[speed]!)}×`,
          0,
          SPEED_MULTIPLIERS.length - 1,
          1,
          (v) => setSpeed(Math.round(v)),
        )}
      </View>
    </OverlaySheet>
  );

  const body = (
    <View
      className={
        fullscreen
          ? "flex-1"
          : "my-3 overflow-hidden rounded-2xl border border-border bg-card"
      }
      style={{ backgroundColor: fullscreen ? CANVAS_BG : undefined }}
    >
      {!fullscreen ? (
        <View className="flex-row items-center justify-between border-b border-border/60 px-3 py-2">
          <Text
            className="flex-1 text-xs font-bold uppercase tracking-wide text-secondary"
            style={nepaliTextStyle(11)}
          >
            {title ?? pick("आकाश प्रयोगशाला", "Sky playground")}
          </Text>
          <Text className="text-[10px] text-muted-foreground" style={nepaliTextStyle(10)}>
            {pick("घुमाउन तान्नुहोस्", "Drag to rotate")}
          </Text>
        </View>
      ) : null}

      {/* The gesture view holds only the canvas and the things drawn over it
          that never take a touch. The panels below it are siblings rather than
          children on purpose: a `PanResponder` parent is consulted on every
          move a child has not already claimed, and a `Slider` inside it loses
          its drag to the camera about one time in three. Outside it, the sheets
          keep their own touches. */}
      <View style={{ height: canvasHeight }}>
      <View
        style={{ height: canvasHeight, backgroundColor: CANVAS_BG }}
        {...responder.panHandlers}
      >
        <Canvas
          camera={{ position: [0, 40, 26], fov: 46, near: 0.1, far: 600 }}
          gl={{ antialias: true, alpha: false }}
          /* Capped: a 3× phone screen does not need a 3× framebuffer for a
             scene of lines and a few spheres, and fill rate is what costs
             battery here. Same cap the other learn diagrams use. */
          dpr={[1, 1.75]}
          onCreated={({ gl }) => gl.setClearColor(CANVAS_BG)}
        >
          <Suspense fallback={null}>
            <Scene
              clock={clock}
              camera={camera}
              params={params}
              toggles={toggles}
              cameraTarget={cameraTarget}
              cameraFollow={cameraFollow}
              rashiNames={rashiNames}
              monthNames={monthNames}
              nakshatraNames={nakshatraNames}
              bodyNames={bodyNames}
              clockText={clockText}
              onLabels={setLabels}
              onSample={onSample}
            />
            <SceneReady onReady={() => setReady(true)} />
            {/* Last in the tree on purpose: `useFrame` runs in mount order, so
                this counts the sim's own work rather than racing it. */}
            {perfOpen ? <PerfMeter onSample={setPerf} /> : null}
          </Suspense>
        </Canvas>

        {/* Real Devanagari over the canvas, placed from the scene's own
            projection — see `playground-labels.ts`. */}
        <View pointerEvents="none" className="absolute inset-0">
          {labels.map((label) => (
            <PlaygroundLabelText key={label.id} label={label} />
          ))}
        </View>

        {!ready ? (
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <VedicPatroLoader />
          </View>
        ) : null}

        {/* Latin digits and a fixed-width feel on purpose: this is an
            instrument, not a reading, and a number that changes script with the
            app's language is harder to compare against a note in a doc. */}
        {perfOpen && perf ? (
          <View
            pointerEvents="none"
            className="absolute bottom-2.5 left-2.5 rounded-lg bg-black/70 px-2 py-1"
          >
            <Text className="text-[11px] font-bold" style={{ color: perfTone(perf), fontSize: 11 }}>
              {`${perf.fps.toFixed(0)} fps · worst ${perf.worstMs.toFixed(0)} ms`}
            </Text>
            <Text
              className="text-[10px]"
              style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}
            >
              {`${perf.drawCalls} draws · ${(perf.triangles / 1000).toFixed(1)}k tris`}
            </Text>
          </View>
        ) : null}

        {/* सूर्यको राशि, its बिक्रम month, and the equation of time. */}
        <View
          pointerEvents="none"
          className="absolute left-2.5 rounded-lg bg-black/50 px-2.5 py-1.5"
          style={{ top: overlayTop }}
        >
          <Text
            className="text-[9px] font-bold uppercase tracking-wide"
            style={[nepaliTextStyle(9), { color: "rgba(255,255,255,0.5)", fontSize: 9 }]}
          >
            {pick("सूर्य राशि · महिना", "Sun's rashi · month")}
          </Text>
          <Text
            className="text-[13px] font-bold"
            style={[nepaliTextStyle(13), { color: "#ffffff", fontSize: 13 }]}
          >
            {`${rashiNames[rashi]} · ${monthNames[rashi]}`}
          </Text>
          <Text
            className="text-[13px] font-bold"
            style={[nepaliTextStyle(13), { color: TONE.solar, fontSize: 13 }]}
          >
            {`${eotMinutes >= 0 ? "+" : "−"}${num(Math.abs(eotMinutes).toFixed(1))} ${pick(
              "मिनेट",
              "min",
            )}`}
          </Text>
        </View>

        {flash !== null ? (
          <View
            pointerEvents="none"
            className="absolute inset-x-0 items-center"
            style={{ top: overlayTop }}
          >
            <View className="rounded-full border border-amber-400/60 bg-amber-500/25 px-3 py-1">
              <Text
                className="text-[12px] font-bold"
                style={[nepaliTextStyle(12), { color: "#fde68a", fontSize: 12 }]}
              >
                {`${pick("सङ्क्रान्ति", "Sankranti")} · ${rashiNames[flash]} · ${
                  monthNames[flash]
                } ${num(1)}`}
              </Text>
            </View>
          </View>
        ) : null}

        <View className="absolute right-2.5 gap-2" style={{ top: overlayTop }}>
          <RoundButton
            icon="options"
            label={pick("नियन्त्रण", "Controls")}
            active={sheet === "controls"}
            onPress={() => setSheet((s) => (s === "controls" ? null : "controls"))}
          />
          {/* Focus has its own button rather than a section of the sheet: it is
              the control a reader reaches for while watching, and digging past
              four sliders for it every time was the wrong trade. */}
          <RoundButton
            icon="locate"
            label={pick("केन्द्रविन्दु", "Focus")}
            active={sheet === "focus"}
            onPress={() => setSheet((s) => (s === "focus" ? null : "focus"))}
          />
          <RoundButton
            icon="stats-chart"
            label={pick("समयको समीकरण ग्राफ", "Equation-of-time graph")}
            active={graphOpen}
            onPress={() => setGraphOpen((v) => !v)}
          />
          <RoundButton icon="add" label={pick("नजिक", "Zoom in")} onPress={() => zoomBy(0.8)} />
          <RoundButton
            icon="remove"
            label={pick("टाढा", "Zoom out")}
            onPress={() => zoomBy(1.25)}
          />
          <RoundButton icon="refresh" label={pick("पूर्ववत्", "Reset view")} onPress={resetView} />
          <RoundButton
            icon={fullscreen ? "close" : "expand"}
            label={
              fullscreen ? pick("बन्द गर्नुहोस्", "Exit fullscreen") : pick("पूरा स्क्रिन", "Fullscreen")
            }
            onPress={() => setFullscreen((f) => !f)}
          />
        </View>

        {/* The graph over the scene, not below it: it is read against the sim's
            own motion, so it has to be on screen at the same time as the thing
            it describes. */}
      </View>

      {graphOpen ? (
        <View
          className="absolute bottom-2.5 left-2.5 max-h-[70%] overflow-hidden rounded-xl border border-white/15 bg-black/85 p-2.5"
          style={{ width: "92%", maxWidth: 340 }}
        >
          <EotGraph
            eccentricity={eccentricity}
            tilt={tilt}
            dayOfYear={day}
            daysPerYear={daysPerYear}
          />
        </View>
      ) : null}

      {sheet === "controls" ? controlsSheet : null}
      {sheet === "focus" ? focusSheet : null}
      </View>

      <View
        className={
          fullscreen ? "absolute inset-x-0 bottom-0 gap-2 px-3 pt-2" : "gap-2 border-t border-border/60 px-3 py-2.5"
        }
        style={
          fullscreen
            ? {
                backgroundColor: "rgba(4, 7, 13, 0.86)",
                paddingBottom: Math.max(insets.bottom, 10),
              }
            : { backgroundColor: "rgba(4, 7, 13, 0.92)" }
        }
      >
        {filterChips}

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => setPlaying((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={playing ? pick("रोक्नुहोस्", "Pause") : pick("चलाउनुहोस्", "Play")}
            className="h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10"
          >
            <Ionicons name={playing ? "pause" : "play"} size={16} color="#f1f5f9" />
          </Pressable>
          <Slider
            style={{ flex: 1, height: 34 }}
            value={day}
            minimumValue={0}
            maximumValue={daysPerYear}
            onValueChange={(v) => {
              clock.current.day = v;
              setPlaying(false);
            }}
            minimumTrackTintColor="#f4c542"
            maximumTrackTintColor="rgba(148, 163, 184, 0.45)"
            thumbTintColor="#f4c542"
            accessibilityLabel={pick("वर्षभरि सार्नुहोस्", "Scrub through the year")}
          />
          <Pressable
            onPress={() => setDetailsOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={
              detailsOpen ? pick("लुकाउनुहोस्", "Hide readings") : pick("देखाउनुहोस्", "Show readings")
            }
            className="h-8 w-8 items-center justify-center rounded-full border border-white/20"
          >
            <Ionicons
              name={detailsOpen ? "chevron-down" : "chevron-up"}
              size={14}
              color="rgba(255,255,255,0.75)"
            />
          </Pressable>
        </View>

        {/* The three clock faces alone do not carry the point at speed: a year
            mode runs twelve rotations a second, so each face lands on a new
            random-looking time several times a second and the eye reads no
            pattern in them. What it *can* read is the gap — how far each clock
            has crept away from the mean one — because that only ever grows, and
            by year's end it is exactly the numbers the article is about: 24h for
            the sidereal clock (the extra turn), ±16 min for the true Sun (the
            equation of time). */}
        {detailsOpen ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="items-stretch gap-2"
          >
            {(
              [
                [
                  "sidereal",
                  pick("नाक्षत्र दिन", "Sidereal day"),
                  readings.sidereal,
                  /* Counted in *turns*, not days. A year holds one more turn
                     than it holds days, and calling that 366th one "day 366" is
                     what makes the sidereal system look like a calendar with an
                     extra day in it. It is not a calendar at all — it is the
                     planet's rotation count against the stars. */
                  pick("फन्को", "turn"),
                  counts.sidereal,
                  gapLabel(siderealGainMinutes),
                  dayLengths.sidereal,
                ],
                [
                  "solar",
                  pick("साँचो सौर दिन", "True solar day"),
                  readings.solar,
                  pick("दिन", "day"),
                  counts.solar,
                  gapLabel(eotMinutes),
                  dayLengths.solar,
                ],
                [
                  "mean",
                  pick("माध्य सौर दिन", "Mean solar day"),
                  readings.mean,
                  pick("दिन", "day"),
                  counts.mean,
                  null,
                  dayLengths.mean,
                ],
              ] as const
            ).map(([tone, label, time, unit, count, gap, length]) => (
              <View key={tone} className="gap-0.5 rounded-lg border border-white/15 px-2.5 py-1.5">
                <Text
                  className="text-[9px] font-bold uppercase tracking-wide"
                  style={[nepaliTextStyle(9), { color: TONE[tone], fontSize: 9 }]}
                >
                  {label}
                </Text>
                <Text
                  className="text-[13px] font-bold"
                  style={[nepaliTextStyle(13), { color: "#ffffff", fontSize: 13 }]}
                >
                  {num(time)}
                </Text>
                <Text
                  className="text-[10px]"
                  style={[
                    nepaliTextStyle(10),
                    { color: "rgba(255,255,255,0.45)", fontSize: 10 },
                  ]}
                >
                  {`${unit} ${num(count)}${gap ? ` · ${gap}` : ""}`}
                </Text>
                {/* The length of one such day. Every column carries one — the
                    mean day's flat 24h is what the other two are measured
                    against, so leaving it as prose said nothing. */}
                <Text
                  className="text-[10px] font-semibold"
                  style={[nepaliTextStyle(10), { color: TONE[tone], fontSize: 10 }]}
                >
                  {`${pick("लम्बाइ", "lasts")} ${lengthLabel(length)}`}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );

  if (!fullscreen) return body;

  return (
    <Modal
      visible
      animationType="fade"
      supportedOrientations={["portrait", "landscape"]}
      onRequestClose={() => setFullscreen(false)}
    >
      {/* Outside the provider tree — the theme tokens have to be re-applied or
          every chip in the control bar loses its colours. */}
      <View
        className={cn("flex-1", isDark && "dark")}
        style={[nativeWindThemeVars(isDark ? "dark" : "light"), { backgroundColor: CANVAS_BG }]}
      >
        {body}
      </View>
    </Modal>
  );
}

/**
 * A panel over the canvas, anchored to its bottom.
 *
 * The web floats a 290px drawer beside the scene. At phone width that is most
 * of the canvas, and it covers the part of the picture the sliders are
 * adjusting — so on this platform the panel takes the bottom of the card
 * instead, where the scene above it stays visible while a layer is switched.
 */
/**
 * Green / amber / red on the reading that actually decides whether it feels
 * broken — the worst frame, not the average.
 *
 * 20ms is about three frames at 60Hz and is where a stall starts to be visible
 * as a hitch; 40ms is where it reads as a stutter. The average has to be poor
 * *as well* to earn amber, so a scene holding 55fps with one 45ms frame still
 * shows red — which is the point, because that is exactly the shape a periodic
 * label pass would make.
 */
function perfTone(p: PerfSample): string {
  if (p.worstMs > 40) return "#f0736a";
  if (p.worstMs > 20 || p.fps < 45) return "#e6b34a";
  return "#6ee7a8";
}

/** Mounts once the scene's textures have resolved — drops the loader. */
function SceneReady({ onReady }: { onReady: () => void }) {
  const called = useRef(false);
  useEffect(() => {
    if (called.current) return;
    called.current = true;
    onReady();
  }, [onReady]);
  return null;
}

function RoundButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(active) }}
      className="h-8 w-8 items-center justify-center rounded-full"
      style={{
        backgroundColor: active ? "rgba(255,255,255,0.85)" : "rgba(6, 11, 20, 0.55)",
        borderWidth: 1,
        borderColor: active ? "rgba(255,255,255,0.7)" : "rgba(148,163,184,0.35)",
      }}
    >
      <Ionicons name={icon} size={15} color={active ? "#04070d" : "#f1f5f9"} />
    </Pressable>
  );
}

export default DayPlayground;
