/**
 * 3D Aakash Gochar — the canvas, its gestures, the label overlay and the controls.
 *
 * The scene itself lives in {@link AakashGocharScene}; this component owns the
 * simulation clock, the camera, and everything the user can press. Both the
 * clock and the camera are held in refs so dragging or running the animation
 * never re-renders the tree — React only hears a sampled snapshot, five times a
 * second, which is also what positions the text labels over the canvas.
 */

import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, PanResponder, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Canvas } from "@/components/sky3d/GeocentricSkyCanvas";
import { OverlaySheet, SheetSection } from "@/components/ui/OverlaySheet";
import { Text } from "@/components/ui/Text";
import type { GocharGraha } from "@/lib/api";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import {
  adToBS,
  bsMonthLabel,
  bsToAD,
  BS_MONTHS_NE,
  BS_MONTH_NAMES,
  WEEKDAYS_SHORT_NE,
} from "@/lib/bs-calendar";
import { BsDateTimePicker } from "@/components/panchanga/BsDateTimePicker";
import { windowedBrowseYears } from "@/lib/patro-browse-years";
import { bikramFromSun } from "@/lib/sky3d/bikram-solar";
import { NAKSHATRA_SHORT } from "@/lib/sky3d/nakshatra-stars";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { nativeWindThemeVars } from "@/lib/nativewind-theme-vars";
import { formatRashiByNumber, getRashiList } from "@/lib/rashi-i18n";
import { useTheme, useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { GRAHA_COLOR, normalizeDeg } from "@/lib/sky3d/geocentric-model";
import { KATHMANDU, type Observer } from "@/lib/sky3d/horizon";
import {
  ayanamsa,
  calibrate,
  daysSinceJ2000,
  type SkyCalibration,
} from "@/lib/sky3d/orbital-model";
import { RASHI_ICONS } from "@/lib/sky3d/rashi-icons";
import { getZonedTimeParts } from "@/lib/zoned-time";
import { SOLAR_STATIONS } from "@/lib/sky3d/sky-geometry";
import { POLE_STARS } from "@/lib/sky3d/pole-stars";
import {
  AakashGocharScene,
  type SceneToggles,
  type ScreenLabel,
  type SimState,
  type SkyMode,
  type SkySample,
  type ViewState,
} from "@/components/sky3d/AakashGocharScene";

const Scene = memo(AakashGocharScene);

const CANVAS_BG = "#04090c";

/**
 * Overlay label colours, applied inline.
 *
 * These sit on the black canvas in both themes, so they must never inherit the
 * theme foreground — which the shared Text component otherwise applies over any
 * arbitrary `text-[#…]` class, turning them black in light mode.
 */
const LABEL_COLOR = {
  rashi: "#f4c542",
  nakshatra: "#6fe08a",
  cardinal: "#ff8a8a",
  azimuth: "#7ea9d8",
  station: "#ffd166",
  tilt: "#ffd166",
  axis: "#9fc4f0",
  poleStar: "#cfe0ff",
  asterism: "#e6efff",
  tropic: "#e2d264",
  observer: "#ff6b6b",
  hud: "#ffffff",
  hudDim: "rgba(255,255,255,0.72)",
  overlayText: "rgba(236,242,244,0.88)",
  overlayDim: "rgba(236,242,244,0.62)",
} as const;

/**
 * The speed ladder, in simulated seconds per real second. Pressing a fast
 * button repeatedly climbs it; pause drops back to the first rung.
 */
/**
 * What the camera can be hung on, besides पृथ्वी.
 *
 * The seven the eye can see plus the Sun and Moon — the same nine a पञ्चाङ्ग
 * tables. राहु and केतु are left out on purpose: they are the crossings of the
 * Moon's plane, not places, so centring on one puts the camera on a point that
 * is only defined by two other things.
 */
const FOCUS_TARGETS: { key: GrahaKey; ne: string; en: string }[] = [
  { key: "sun", ne: "सूर्य", en: "Sun" },
  { key: "moon", ne: "चन्द्र", en: "Moon" },
  { key: "mercury", ne: "बुध", en: "Mercury" },
  { key: "venus", ne: "शुक्र", en: "Venus" },
  { key: "mars", ne: "मंगल", en: "Mars" },
  { key: "jupiter", ne: "बृहस्पति", en: "Jupiter" },
  { key: "saturn", ne: "शनि", en: "Saturn" },
];

const SPEED_LADDER = [
  { seconds: 60, ne: "१ मिनेट/से", en: "1 min/s" },
  { seconds: 7200, ne: "२ घण्टा/से", en: "2 hr/s" },
  { seconds: 172800, ne: "२ दिन/से", en: "2 days/s" },
  { seconds: 604800, ne: "१ हप्ता/से", en: "1 week/s" },
  { seconds: 5184000, ne: "२ महिना/से", en: "2 months/s" },
  /* The top two rungs are for one thing: precession. The ayanamsa moves a
     degree in seventy-two years, so at any calendar speed the belt looks
     nailed down. At 20 years a second मेष visibly walks away from वसन्त
     सम्पात, and the whole 26,000-year turn takes about twenty minutes. */
  { seconds: 63113904, ne: "२ वर्ष/से", en: "2 years/s" },
  { seconds: 631139040, ne: "२० वर्ष/से", en: "20 years/s" },
  /* The top rung is precession at one degree a second: the ayanamsa moves a
     degree in 72 years, so मेष crosses a whole rashi boundary every half
     minute and the pole hands over its star while you watch. */
  { seconds: 2272100544, ne: "७२ वर्ष/से", en: "72 years/s" },
];
/** Camera distance that frames the whole system in the space view. */
const SYSTEM_DISTANCE = 26;
/** Zoom value that opens the horizon view out to a ~120° fisheye. */
const HORIZON_WIDE = 45;
/** Default zoom in the Earth-globe view — frames the globe and its ring. */
const GLOBE_VIEW = 78;
/** Camera angles the horizon view opens on — behind you, low to the ground. */
const HORIZON_YAW = Math.PI;
const HORIZON_PITCH = 0.12;

export type AakashGocharSkyProps = {
  /** Gochar rows for {@link date} — the API longitudes the model is pinned to. */
  gochar?: Record<string, GocharGraha>;
  /**
   * The server's Lahiri ayanamsa for {@link date}, degrees — where the sidereal
   * zero stands against the equinox. The scene pins its own fit to it.
   */
  ayanamsaDeg?: number;
  /** The date the gochar rows describe; the simulation starts here. */
  date: Date;
  /**
   * Lets the transport row's calendar button jump the page to a new date —
   * the only way to change dates once the sky is fullscreen, where the date
   * nav above the canvas is out of reach.
   */
  onDateChange?: (date: Date) => void;
  clock?: string;
  onClockChange?: (clock: string) => void;
  todayAd?: string;
  /** Where the sky is being watched from. Drives the whole horizon view. */
  observer?: Observer;
  /** The place's timezone — the clock in the HUD reads on its wall, not UTC. */
  timeZone?: string;
  height?: number;
};

export function AakashGocharSky({
  gochar,
  ayanamsaDeg,
  date,
  onDateChange,
  clock,
  onClockChange,
  todayAd,
  observer = KATHMANDU,
  timeZone = "Asia/Kathmandu",
  height = 460,
}: AakashGocharSkyProps) {
  const { lang, pick, digits } = useLocale();
  const { isDark } = useTheme();

  /* The API is the source of truth: pin the model onto it for this date, so the
     scene is exact here and merely smooth as the clock runs away from it. */
  const calibration: SkyCalibration = useMemo(
    () => (gochar ? calibrate(date, gochar) : {}),
    [gochar, date],
  );

  /* Same idea for the frame the longitudes live in: the offset that carries the
     scene's own Lahiri fit onto the server's value for this date. The fit is
     already sub-arcminute near now, but it drifts by a third of a degree a
     thousand years out — enough to slide the whole belt off its stars. */
  const ayanamsaShift = useMemo(
    () => (ayanamsaDeg == null ? 0 : ayanamsaDeg - ayanamsa(daysSinceJ2000(date))),
    [ayanamsaDeg, date],
  );

  const sim = useRef<SimState>({
    timeMs: date.getTime(),
    secondsPerRealSecond: SPEED_LADDER[0].seconds,
    playing: true,
  });
  /* Opens on the globe, so these have to match the framing the पृथ्वी गोला chip
     sets — otherwise the first frame is the space camera on a globe scene. */
  const view = useRef<ViewState>({ yaw: 0.6, pitch: 0.42, distance: GLOBE_VIEW });

  const [mode, setMode] = useState<SkyMode>("globe");
  const [playing, setPlaying] = useState(true);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [selectedKey, setSelectedKey] = useState<GrahaKey | null>(null);
  const [sample, setSample] = useState<SkySample | null>(null);
  const [toggles, setToggles] = useState<SceneToggles>({
    rashiBelt: true,
    nakshatraBelt: true,
    monthRing: true,
    primeMeridian: true,
    grid: true,
    lockStars: true,
    lockCenter: false,
    asterisms: true,
    poleStars: true,
    tilt: true,
    labels: true,
    landscape: true,
  });
  /* Which overlay panel is open, if any. One at a time: both are anchored to
     the bottom of the canvas and would otherwise sit on top of each other. */
  const [sheet, setSheet] = useState<"layers" | "focus" | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  /* Fullscreen only: the whole control row folds away to a single chevron, so
     the sky can have the entire screen when you just want to watch it. */
  const [controlsOpen, setControlsOpen] = useState(true);
  /* The transport row's own date picker — the date nav above the canvas is
     unreachable once fullscreen, so this is the only way to jump dates there. */
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const dateBs = useMemo(() => adToBS(date), [date]);

  // Following the date nav above the canvas keeps the two in step.
  useEffect(() => {
    sim.current.timeMs = date.getTime();
  }, [date]);

  const speed = SPEED_LADDER[speedIndex];

  useEffect(() => {
    sim.current.playing = playing;
    sim.current.secondsPerRealSecond = speed.seconds * (reverse ? -1 : 1);
  }, [playing, speed, reverse]);

  /**
   * A press of either fast button. Coming from a standstill or from the other
   * direction it starts at the bottom of the ladder; otherwise it climbs a rung
   * and stops at the top.
   */
  const stepSpeed = useCallback(
    (direction: "forward" | "back") => {
      const wantReverse = direction === "back";
      const fromRest = !playing || reverse !== wantReverse;
      setSpeedIndex((i) => (fromRest ? 0 : Math.min(SPEED_LADDER.length - 1, i + 1)));
      setReverse(wantReverse);
      setPlaying(true);
    },
    [playing, reverse],
  );

  /** Pause always returns the clock to normal speed, running forward. */
  const togglePlay = useCallback(() => {
    if (playing) {
      setSpeedIndex(0);
      setReverse(false);
    }
    setPlaying((p) => !p);
  }, [playing]);

  /** The gesture handler is built once, so it reads the live mode from a ref. */
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const gestureStart = useRef({ yaw: 0, pitch: 0, distance: 0, pinch: 0 });
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.hypot(g.dx, g.dy) > 2,
        onPanResponderGrant: () => {
          gestureStart.current = { ...view.current, pinch: 0 };
        },
        onPanResponderMove: (e, g) => {
          const touches = e.nativeEvent.touches;
          if (touches.length >= 2) {
            const [a, b] = touches;
            const dist = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
            if (!gestureStart.current.pinch) gestureStart.current.pinch = dist;
            const next = gestureStart.current.distance * (gestureStart.current.pinch / dist);
            view.current.distance = Math.min(120, Math.max(0.35, next));
            return;
          }
          /* Drag the sphere, don't drive the camera: pulling right swings the
             face you are looking at to the right, which means the camera has to
             go the other way round. */
          view.current.yaw = gestureStart.current.yaw - g.dx * 0.006;
          /* The camera is kept north of the ecliptic only in the space view —
             from the south side there the zodiac reads backwards, rashi and
             every graha running clockwise, which is never what you want to be
             looking at. The globe view is just the Earth sphere, with no such
             concern, so it gets the same full range as the horizon view — you
             can swing all the way round to the south pole. Both still clamp
             short of true vertical so the view cannot flip over on itself. */
          const lowestPitch = modeRef.current === "space" ? 0.08 : -1.45;
          view.current.pitch = Math.min(
            1.45,
            Math.max(lowestPitch, gestureStart.current.pitch + g.dy * 0.005),
          );
        },
      }),
    [],
  );

  const onSample = useCallback((next: SkySample) => setSample(next), []);
  /**
   * Tapping a graha in the sky toggles it; the focus sheet names one outright.
   *
   * `null` is the sheet's पृथ्वी row — an explicit "nothing selected", which the
   * toggle behaviour could never express, since pressing पृथ्वी is not a second
   * press of whatever happened to be selected.
   */
  const onSelect = useCallback((key: GrahaKey | null) => {
    setSelectedKey((prev) => (key === null ? null : prev === key ? null : key));
  }, []);

  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /* Fullscreen runs under the status bar, so the HUD and the zoom buttons have
     to start below the clock and the battery — and below the notch, which the
     insets do not always report from inside a modal. */
  const overlayTop = fullscreen ? Math.max(insets.top, 28) + 16 : 12;
  const simDate = sample ? new Date(sample.timeMs) : date;
  /* The Sun the scene has already computed — the calendar past the table's end. */
  const sunLongitude = sample?.sky.sun.longitude;

  /* The twelve राशि and the twelve बिक्रम months, which are the same twelve
     divisions read two ways — so one index serves both. */
  const rashiNames = useMemo(() => getRashiList(lang), [lang]);
  const monthNames = useMemo(
    () => (lang === "en" ? ([...BS_MONTH_NAMES] as string[]) : BS_MONTHS_NE),
    [lang],
  );
  const sunRashi =
    sunLongitude == null ? null : Math.floor(normalizeDeg(sunLongitude) / 30) % 12;

  const eclipse = sample?.eclipse ?? null;
  /*
   * अमावस्या / पूर्णिमा, within a degree of exact.
   *
   * A degree is about two hours of the Moon's own motion, so at wall-clock
   * speed the banner sits for a couple of hours of simulated time and at the
   * calendar speeds it blinks past — which is the honest shape of the thing.
   * Suppressed while an eclipse is showing, since a ग्रहण *is* a syzygy and
   * naming both at once says the same thing twice.
   */
  const syzygy = useMemo((): "amavasya" | "purnima" | null => {
    if (!sample || eclipse) return null;
    const elong = normalizeDeg(sample.sky.moon.longitude - sample.sky.sun.longitude);
    if (Math.min(elong, 360 - elong) < 1) return "amavasya";
    if (Math.abs(elong - 180) < 1) return "purnima";
    return null;
  }, [sample, eclipse]);

  /*
   * सङ्क्रान्ति, caught by watching the Sun's own rashi change.
   *
   * The scene samples a few times a second, so at the fast speeds this page
   * offers the crossing is one sample wide; the banner is held on a timer for
   * long enough to be read. The first sample after a mount is not a crossing —
   * there is nothing to have crossed *from* — hence the null guard.
   */
  const [sankranti, setSankranti] = useState<number | null>(null);
  const lastRashi = useRef<number | null>(null);
  useEffect(() => {
    if (sunRashi == null) return;
    const previous = lastRashi.current;
    lastRashi.current = sunRashi;
    if (previous === null || previous === sunRashi) return;
    setSankranti(sunRashi);
  }, [sunRashi]);
  useEffect(() => {
    if (sankranti === null) return;
    const id = setTimeout(() => setSankranti(null), 2600);
    return () => clearTimeout(id);
  }, [sankranti]);
  const sunSpeed = sample?.sky.sun.speedDegPerDay;

  /* Rashi/nakshatra text grows past its base size once the camera pulls back
     beyond the mode's own default framing — capped so it never swamps the
     screen at the very widest zoom. */
  const modeBaseline = mode === "space" ? SYSTEM_DISTANCE : mode === "globe" ? GLOBE_VIEW : HORIZON_WIDE;
  const labelScale = sample ? Math.min(2.4, Math.max(1, sample.zoomDistance / modeBaseline)) : 1;

  /**
   * The place's offset from UT, taken once at the date the page is on.
   *
   * The simulation runs tens of thousands of years either way, where asking a
   * timezone database what the offset "was" is meaningless — and Kathmandu has
   * never had DST anyway. One offset, applied throughout, is both the honest
   * answer and the only one that survives the trip.
   */
  const zoneOffsetMs = useMemo(() => {
    const zoned = getZonedTimeParts(date, timeZone);
    const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
    let delta = zoned.hour * 60 + zoned.minute - utcMinutes;
    if (delta > 840) delta -= 1440;
    if (delta <= -720) delta += 1440;
    return delta * 60000;
  }, [date, timeZone]);

  /**
   * The clock reading, in the calendar the reader is using and on the wall of
   * the place they picked — not UTC, and not the device's own zone.
   *
   * Everything here is arithmetic on the instant. Formatting a far date and
   * parsing it back does not survive: `new Date("20143-08-06T12:00:00")` is an
   * Invalid Date, and Intl quietly drops the era, so 2829 BC came back as AD
   * 2830. Hence UTC getters on a shifted instant, and a weekday counted in
   * days from the epoch.
   */
  const simStamp = useMemo(() => {
    const local = new Date(simDate.getTime() + zoneOffsetMs);
    const y = local.getUTCFullYear();
    const mo = String(local.getUTCMonth() + 1).padStart(2, "0");
    const d = String(local.getUTCDate()).padStart(2, "0");
    const clock = `${String(local.getUTCHours()).padStart(2, "0")}:${String(
      local.getUTCMinutes(),
    ).padStart(2, "0")}`;
    // 1 Jan 1970 was a Thursday, and 0 is Sunday.
    const dayIndex = Math.floor((simDate.getTime() + zoneOffsetMs) / 86400000);
    const weekday = (((dayIndex + 4) % 7) + 7) % 7;
    const place = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
    // Proleptic Gregorian throughout, as everywhere else in the app; year 0 is
    // 1 BC, so anything at or below it reads with the era spelled out.
    const adYear = y > 0 ? `${y}` : `${1 - y} BC`;

    if (lang === "en") {
      return { date: `${adYear}-${mo}-${d}`, time: `${clock} · ${place}` };
    }

    const adYearNe = y > 0 ? `${digits(y)} ई.` : `${digits(1 - y)} ई.पू.`;

    /* Past बि.सं. २२०० the compiled table has nothing, so the Sun becomes the
       calendar it always was — see [[bikram-solar]]. Marked with ≈ so it never
       passes for the almanac. */
    const bs = bikramFromSun(simDate, sunLongitude ?? 0, sunSpeed);
    const mark = bs.approximate ? "≈" : "";
    return {
      date: `${mark}${digits(bs.year)} ${bsMonthLabel(bs.month, "ne")} ${digits(bs.day)}, ${
        WEEKDAYS_SHORT_NE[weekday]
      }बार`,
      // Out past the table the AD year rides along, so the reading can be
      // checked against a calendar the reader already knows.
      time: `${digits(clock)} · ${place}${bs.approximate ? ` · ${adYearNe}` : ""}`,
    };
  }, [simDate, zoneOffsetMs, timeZone, lang, digits, sunLongitude, sunSpeed]);

  const isDay = mode === "horizon" && (sample?.sunAltitude ?? -90) > -0.5;

  const zoomBy = (factor: number) => {
    view.current.distance = Math.min(120, Math.max(0.35, view.current.distance * factor));
  };

  // Fullscreen gives the sky the whole window and floats the controls over it.
  const canvasHeight = fullscreen ? windowHeight : height;

  /* The controls are built once and placed twice — a pinned row over the sky in
     fullscreen, a panel under it otherwise — so the two layouts can never drift
     apart in what they offer. */
  const transport = (
    <>
      <IconButton
        name="play-back"
        label={pick("पछाडि छिटो", "Faster backward")}
        active={!playing ? false : reverse && speedIndex > 0}
        overlay={fullscreen}
        compact={fullscreen}
        onPress={() => stepSpeed("back")}
      />
      <IconButton
        name={playing ? "pause" : "play"}
        label={playing ? pick("रोक्नुहोस्", "Pause") : pick("चलाउनुहोस्", "Play")}
        active={playing}
        overlay={fullscreen}
        compact={fullscreen}
        onPress={togglePlay}
      />
      <IconButton
        name="play-forward"
        label={pick("अगाडि छिटो", "Faster forward")}
        active={!playing ? false : !reverse && speedIndex > 0}
        overlay={fullscreen}
        compact={fullscreen}
        onPress={() => stepSpeed("forward")}
      />
      <IconButton
        name="refresh"
        label={pick("मितिमा फर्कनुहोस्", "Back to the chosen date")}
        active={false}
        overlay={fullscreen}
        compact={fullscreen}
        onPress={() => {
          /* The nav above starts on today, so with no date chosen this is
             simply "back to now". */
          sim.current.timeMs = date.getTime();
        }}
      />
      {onDateChange ? (
        <IconButton
          name="calendar-outline"
          label={pick("मिति छान्नुहोस्", "Choose a date")}
          active={datePickerOpen}
          overlay={fullscreen}
          compact={fullscreen}
          onPress={() => setDatePickerOpen(true)}
        />
      ) : null}
    </>
  );

  const viewChips = (
    <>
      <Chip
        active={mode === "space"}
        label={pick("अन्तरिक्ष", "Space")}
        onPress={() => {
          setMode("space");
          view.current = { yaw: 0.5, pitch: 0.62, distance: SYSTEM_DISTANCE };
        }}
        overlay={fullscreen}
        compact={fullscreen}
      />
      <Chip
        active={mode === "horizon"}
        label={pick("क्षितिज", "Horizon")}
        onPress={() => {
          setMode("horizon");
          /* Standing at your own place here, so a graha-follow left over from
             another view means nothing until you pick one again. */
          setToggles((t) => (t.lockCenter && !selectedKey ? { ...t, lockCenter: false } : t));
          view.current = { yaw: HORIZON_YAW, pitch: HORIZON_PITCH, distance: HORIZON_WIDE };
        }}
        overlay={fullscreen}
        compact={fullscreen}
      />
      <Chip
        active={mode === "globe"}
        label={pick("पृथ्वी गोला", "Earth globe")}
        onPress={() => {
          setMode("globe");
          view.current = { yaw: 0.6, pitch: 0.42, distance: GLOBE_VIEW };
        }}
        overlay={fullscreen}
        compact={fullscreen}
      />
    </>
  );

  /** One layer switch, for use inside the sheets. */
  const sheetChip = (key: keyof SceneToggles, label: string) => (
    <Chip
      key={key}
      active={toggles[key]}
      label={label}
      onPress={() => setToggles((t) => ({ ...t, [key]: !t[key] }))}
      overlay
    />
  );

  /*
   * The chips that stay in the transport row are the ones reached *while
   * watching*: names on or off, and whether the sky holds still. Everything
   * else — the belts, the guides, what the camera follows — moved into the two
   * sheets below, because a phone's control row can hold about five things
   * before it becomes a scroll nobody reads to the end of.
   */
  const toggleChips = (
    <>
      <Chip
        active={toggles.labels}
        label={pick("नाम", "Labels")}
        onPress={() => setToggles((t) => ({ ...t, labels: !t.labels }))}
        overlay={fullscreen}
        compact={fullscreen}
      />
      <Chip
        active={toggles.lockStars}
        label={pick("तारा स्थिर", "Lock to stars")}
        onPress={() => setToggles((t) => ({ ...t, lockStars: !t.lockStars }))}
        overlay={fullscreen}
        compact={fullscreen}
      />
      <IconButton
        name="layers"
        label={pick("तह", "Layers")}
        active={sheet === "layers"}
        overlay={fullscreen}
        compact={fullscreen}
        onPress={() => setSheet((v) => (v === "layers" ? null : "layers"))}
      />
      <IconButton
        name="locate"
        label={pick("केन्द्रविन्दु", "Focus")}
        active={sheet === "focus"}
        overlay={fullscreen}
        compact={fullscreen}
        onPress={() => setSheet((v) => (v === "focus" ? null : "focus"))}
      />
    </>
  );

  /* Guides and belts, grouped the way the web groups them. `ध्रुव तारा` and
     `अक्ष झुकाव` are only offered where they are drawn — the pole circle needs
     a sky to sit in and the obliquity marks need the Earth. */
  const layersSheet = (
    <OverlaySheet
      title={pick("तह", "Layers")}
      onClose={() => setSheet(null)}
      maxHeight={canvasHeight * 0.8}
    >
      <SheetSection heading={pick("मार्गदर्शक", "Guides")}>
        {sheetChip("grid", pick("ग्रिड", "Grid"))}
        {mode === "horizon" ? sheetChip("landscape", pick("भूभाग", "Landscape")) : null}
        {/* The meridian is a line drawn on a globe seen from outside it —
            अन्तरिक्ष and पृथ्वी गोला. Standing on the dome in क्षितिज, you are
            on that line, so the scene never draws one there. */}
        {mode === "horizon" ? null : sheetChip("primeMeridian", pick("काठमाडौँ रेखा", "Kathmandu meridian"))}
        {sheetChip("asterisms", pick("तारापुञ्ज", "Star groups"))}
        {mode !== "space" ? sheetChip("poleStars", pick("ध्रुव तारा", "Pole stars")) : null}
        {mode === "globe" ? sheetChip("tilt", pick("अक्ष झुकाव", "Tilt")) : null}
      </SheetSection>
      <SheetSection heading={pick("वलय", "Belts")}>
        {sheetChip("rashiBelt", pick("राशि", "Rashi"))}
        {sheetChip("nakshatraBelt", pick("नक्षत्र", "Nakshatra"))}
        {mode === "horizon" ? null : sheetChip("monthRing", pick("महिना", "Months"))}
      </SheetSection>
    </OverlaySheet>
  );

  /*
   * What the camera is hung on.
   *
   * पृथ्वी is the way back: it clears the selection, which is also what turns
   * the follow switch off, since there is nothing left to follow. Everything
   * else selects that graha — the same thing tapping it on the sky does, so the
   * two controls cannot disagree.
   */
  const focusSheet = (
    <OverlaySheet
      title={pick("के पछ्याउने?", "What should the camera follow?")}
      onClose={() => setSheet(null)}
      maxHeight={canvasHeight * 0.8}
    >
      <SheetSection heading={pick("केन्द्रविन्दु", "Focus")}>
        <Chip
          active={!selectedKey}
          label={pick("पृथ्वी", "Earth")}
          overlay
          onPress={() => {
            onSelect(null);
            setToggles((t) => ({ ...t, lockCenter: false }));
          }}
        />
        {FOCUS_TARGETS.map(({ key, ne: neName, en }) => (
          <Chip
            key={key}
            active={selectedKey === key}
            label={pick(neName, en)}
            overlay
            onPress={() => onSelect(key)}
          />
        ))}
      </SheetSection>
      <SheetSection heading={pick("पछ्याउनुहोस्", "Follow")}>
        <Chip
          active={toggles.lockCenter && !!selectedKey}
          label={
            selectedKey
              ? pick("ग्रह पछ्याउनुहोस्", "Follow graha")
              : pick("पहिले ग्रह छान्नुहोस्", "Pick a graha first")
          }
          overlay
          onPress={() => {
            if (!selectedKey) return;
            setToggles((t) => ({ ...t, lockCenter: !t.lockCenter }));
          }}
        />
      </SheetSection>
    </OverlaySheet>
  );

  const body = (
    <View className={fullscreen ? "flex-1 bg-background" : "overflow-hidden rounded-2xl border border-border"}>
      <View style={{ height: canvasHeight, backgroundColor: CANVAS_BG }} {...responder.panHandlers}>
        <Canvas
          camera={{ position: [0, 14, 22], fov: 50, near: 0.05, far: 1200 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => gl.setClearColor(CANVAS_BG)}
        >
          <Suspense fallback={null}>
            <Scene
              sim={sim}
              view={view}
              mode={mode}
              observer={observer}
              calibration={calibration}
              ayanamsaShift={ayanamsaShift}
              selectedKey={selectedKey}
              toggles={toggles}
              onSelect={onSelect}
              onSample={onSample}
            />
          </Suspense>
        </Canvas>

        {/* Labels ride over the canvas rather than in it — real Devanagari type,
            positioned from the scene's own projection of each anchor. */}
        {toggles.labels && sample ? <SkyLabels labels={sample.labels} scale={labelScale} /> : null}

        {/* HUD — the simulated instant, which drifts away from the nav once it runs. */}
        <View
          pointerEvents="none"
          className="absolute left-3 rounded-lg bg-black/45 px-2.5 py-1.5"
          style={{ top: overlayTop }}
        >
          <Text className="text-[11px] font-bold" style={[nepaliTextStyle(11), { color: LABEL_COLOR.hud }]}>
            {simStamp.date}
          </Text>
          <Text className="text-[10px]" style={[nepaliTextStyle(10), { color: LABEL_COLOR.hudDim }]}>
            {simStamp.time}
          </Text>
          <Text className="text-[10px]" style={[nepaliTextStyle(10), { color: LABEL_COLOR.hudDim }]}>
            {mode === "horizon"
              ? `${pick("क्षितिज", "Horizon")} · ${digits(observer.lat.toFixed(2))}°, ${digits(observer.lon.toFixed(2))}° · ${
                  isDay ? pick("दिन", "day") : pick("रात", "night")
                }`
              : mode === "globe"
                ? pick("पृथ्वी गोला · क्रान्तिवृत्त वलय", "Earth globe · ecliptic ring")
                : pick("अन्तरिक्षबाट", "From space")}
          </Text>
          {/* The rate, since the speed buttons no longer carry a caption. */}
          <Text className="text-[10px]" style={[nepaliTextStyle(10), { color: LABEL_COLOR.hudDim }]}>
            {playing
              ? `${reverse ? "◀◀" : "▶▶"} ${pick(speed.ne, speed.en)}`
              : pick("⏸ रोकिएको", "⏸ paused")}
          </Text>
        </View>

        <View className="absolute right-3 gap-2.5" style={{ top: overlayTop }}>
          <RoundButton label="+" onPress={() => zoomBy(0.7)} />
          <RoundButton label="−" onPress={() => zoomBy(1.4)} />
          <RoundButton
            label={fullscreen ? "✕" : "⛶"}
            onPress={() => setFullscreen((f) => !f)}
          />
        </View>

        {/* सङ्क्रान्ति — the Sun crossing into the next राशि, which is also the
            first day of the next बिक्रम month. One frame wide in the scene, so
            the banner outlives it on a timer. */}
        {sankranti !== null ? (
          <View pointerEvents="none" className="absolute inset-x-0 items-center" style={{ top: overlayTop }}>
            <View className="rounded-full border border-amber-400/60 bg-amber-500/25 px-3 py-1">
              <Text
                className="text-[12px] font-bold"
                style={[nepaliTextStyle(12), { color: "#fde68a", fontSize: 12 }]}
              >
                {`${pick("सङ्क्रान्ति", "Sankranti")} · ${rashiNames[sankranti]} · ${
                  monthNames[sankranti]
                } ${digits(1)}`}
              </Text>
            </View>
          </View>
        ) : null}

        {/*
          ग्रहण and the two syzygies, named as they pass.

          Not on a timer like the सङ्क्रान्ति banner: an eclipse is a *state*
          that lasts while the alignment holds, so it shows for exactly as long
          as the scene says one is happening. The अमावस्या / पूर्णिमा line is
          the same idea one step weaker — a syzygy with no node, which is the
          fortnightly case an eclipse is the rare exception to.
        */}
        {eclipse || syzygy ? (
          <View
            pointerEvents="none"
            className="absolute inset-x-0 items-center"
            style={{ top: overlayTop + (sankranti !== null ? 34 : 0) }}
          >
            <View
              className="rounded-full border px-3 py-1"
              style={
                eclipse
                  ? { borderColor: "rgba(248,113,113,0.6)", backgroundColor: "rgba(127,29,29,0.5)" }
                  : { borderColor: "rgba(148,163,184,0.5)", backgroundColor: "rgba(15,23,42,0.6)" }
              }
            >
              <Text
                className="text-[12px] font-bold"
                style={[
                  nepaliTextStyle(12),
                  { color: eclipse ? "#fecaca" : "#e2e8f0", fontSize: 12 },
                ]}
              >
                {eclipse
                  ? eclipse.kind === "solar"
                    ? pick("सूर्यग्रहण · चन्द्र सूर्यलाई ढाक्छ", "Solar eclipse · Moon covers the Sun")
                    : pick(
                        "चन्द्रग्रहण · पृथ्वीको छाया चन्द्रमा",
                        "Lunar eclipse · Earth's shadow on the Moon",
                      )
                  : syzygy === "amavasya"
                    ? pick("औंसी · चन्द्र सूर्य–पृथ्वीको बीचमा", "Amavasya · Moon between Sun and Earth")
                    : pick("पूर्णिमा · पृथ्वी सूर्य–चन्द्रको बीचमा", "Purnima · Earth between Sun and Moon")}
              </Text>
            </View>
          </View>
        ) : null}

        {sheet === "layers" ? layersSheet : null}
        {sheet === "focus" ? focusSheet : null}
      </View>

      {/* Floating over the canvas, this panel is always dark glass — so it runs
          on the dark tokens whatever the app theme is, or light-mode text would
          come out near-black on it.

          Fullscreen gets one row, not three. Stacked, the controls ate a third
          of a landscape phone's height — the sky is the point, so the transport
          stays pinned and everything else scrolls past it, with a chevron to
          drop the lot down to a single button. */}
      <View
        className={
          fullscreen
            ? "dark absolute inset-x-0 bottom-0 px-2 pt-2"
            : "gap-2.5 border-t border-border bg-card px-3 py-3"
        }
        style={
          fullscreen
            ? [
                nativeWindThemeVars("dark"),
                {
                  backgroundColor: controlsOpen ? "rgba(4, 9, 12, 0.62)" : "transparent",
                  paddingBottom: Math.max(insets.bottom, 8),
                },
              ]
            : undefined
        }
      >
        {fullscreen ? (
          <View className="flex-row items-center gap-1.5">
            {controlsOpen ? (
              <>
                {transport}
                <View className="h-6 w-px bg-white/15" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="items-center gap-1.5 pr-1"
                  className="flex-1"
                >
                  {viewChips}
                  <View className="mx-0.5 h-5 w-px bg-white/15" />
                  {toggleChips}
                </ScrollView>
              </>
            ) : (
              /* Collapsed: enough to stop the clock, and the way back. */
              <>
                <IconButton
                  name={playing ? "pause" : "play"}
                  label={playing ? pick("रोक्नुहोस्", "Pause") : pick("चलाउनुहोस्", "Play")}
                  active={playing}
                  overlay
                  compact
                  onPress={togglePlay}
                />
                <View className="flex-1" />
              </>
            )}
            <IconButton
              name={controlsOpen ? "chevron-down" : "chevron-up"}
              label={controlsOpen ? pick("नियन्त्रण लुकाउनुहोस्", "Hide controls") : pick("नियन्त्रण देखाउनुहोस्", "Show controls")}
              active={false}
              overlay
              compact
              onPress={() => setControlsOpen((o) => !o)}
            />
          </View>
        ) : (
          <>
            {/* Transport — each press of a fast button steps further up the
                speed ladder; pause drops back to normal. */}
            <View className="flex-row items-center gap-1">{transport}</View>

            {/* View and layers share one scroller: two short rows of chips were
                a row too many. */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="items-center gap-2"
            >
              {viewChips}
              <View className="mx-1 h-5 w-px bg-border" />
              {toggleChips}
            </ScrollView>
          </>
        )}
      </View>

      {/* An in-tree overlay, not its own Modal: a second RN-Web Modal stacked on
          top of the fullscreen one let taps punch through to whatever sat at the
          same screen position underneath (Done landing on the ✕ button or a view
          chip beneath it). Living inside `body` instead, it shares the
          fullscreen modal's own theme context, so nothing needs re-applying. */}
      {datePickerOpen ? (
        <View
          className="absolute inset-0 items-center justify-center bg-black/60 px-4"
          style={{ zIndex: 50 }}
        >
          <Pressable
            className="absolute inset-0"
            onPress={() => setDatePickerOpen(false)}
            accessibilityLabel={pick("बन्द गर्नुहोस्", "Close")}
          />
          <View className="w-full max-w-sm rounded-2xl border border-border bg-card p-4">
            <BsDateTimePicker
              year={dateBs.year}
              month={dateBs.month}
              day={dateBs.day}
              yearOptions={windowedBrowseYears("bs", dateBs.year)}
              todayAd={todayAd}
              onSelectDate={(y, m, d) => onDateChange?.(bsToAD(y, m, d))}
              monthAriaLabel={pick("महिना", "Month")}
              yearAriaLabel={pick("वर्ष", "Year")}
              clock={clock}
              onClockChange={onClockChange}
              hourAriaLabel={pick("घण्टा", "Hour")}
              minuteAriaLabel={pick("मिनेट", "Minute")}
              showTime={Boolean(onClockChange)}
              onDone={() => setDatePickerOpen(false)}
            />
          </View>
        </View>
      ) : null}
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
      {/* A modal renders outside the provider tree, so the theme tokens have to
          be re-applied here or every chip loses its colours. The scene is
          remounted too, but its textures come back out of the loader cache. */}
      <View
        className={cn("flex-1 bg-background", isDark && "dark")}
        style={nativeWindThemeVars(isDark ? "dark" : "light")}
      >
        {body}
      </View>
    </Modal>
  );
}

/**
 * The text over the canvas. Memoised, and fed an array the scene only replaces
 * when a label has actually moved a pixel: the HUD clock ticks five times a
 * second, and re-rendering fifty Devanagari labels alongside it would stutter
 * the very animation they are labelling.
 */
/**
 * The year a star takes its turn as pole star, in the reader's era. Nepali gets
 * बिक्रम सम्वत्, which is where every other year in the app is quoted.
 */
function formatPoleYear(
  year: number | undefined,
  lang: string,
  digits: (v: string | number) => string,
): string {
  if (year == null) return "";
  if (lang === "en") {
    return year < 0 ? `${Math.abs(year).toLocaleString("en-US")} BC` : `AD ${year.toLocaleString("en-US")}`;
  }
  const bs = year + 57;
  const abs = digits(Math.abs(bs).toLocaleString("en-US"));
  return bs < 0 ? `${abs} बि.सं. पूर्व` : `${abs} बि.सं.`;
}

const SkyLabels = memo(function SkyLabels({
  labels,
  scale = 1,
}: {
  labels: ScreenLabel[];
  /** Grows the rashi/nakshatra belt text as the camera pulls back — a fixed
      pixel size reads fine close up but disappears against the wider view
      once the belt has shrunk to a small ring in the middle of the screen. */
  scale?: number;
}) {
  const { lang, pick, digits } = useLocale();

  return (
    <View style={{ position: "absolute", inset: 0 }} pointerEvents="none">
      {labels.map((label) => {
        if (label.kind === "month" && label.index) {
          /* Inside the राशि band, and dimmed off the Sun: a बिक्रम month *is* a
             solar rashi, so the one lit is whichever sign the Sun stands in. No
             glyph — the राशि label just outside already carries it. */
          const boxWidth = 64 * scale;
          return (
            <Text
              key={label.id}
              numberOfLines={1}
              className="absolute font-semibold"
              style={[
                nepaliTextStyle(11 * scale),
                {
                  left: label.x - boxWidth / 2,
                  top: label.y - 7 * scale,
                  width: boxWidth,
                  textAlign: "center",
                  color: "#e3d9a8",
                  opacity: label.dim ? 0.45 : 1,
                },
              ]}
            >
              {bsMonthLabel(label.index, lang)}
            </Text>
          );
        }
        if (label.kind === "rashi" && label.index) {
          const Icon = RASHI_ICONS[label.index - 1];
          const iconSize = 22 * scale;
          const boxWidth = 76 * scale;
          const fontSize = 14 * scale;
          return (
            <View
              key={label.id}
              style={{ position: "absolute", left: label.x - boxWidth / 2, top: label.y - 12 * scale, width: boxWidth }}
              className="items-center"
            >
              <Icon width={iconSize} height={iconSize} color="#f4c542" />
              <Text
                className="font-bold"
                style={[nepaliTextStyle(fontSize), { color: LABEL_COLOR.rashi }]}
                numberOfLines={1}
              >
                {formatRashiByNumber(label.index, lang)}
              </Text>
            </View>
          );
        }
        if (label.kind === "nakshatra" && label.index) {
          const nak = NAKSHATRA_ICONS[label.index - 1];
          const boxWidth = 90 * scale;
          const fontSize = 12 * scale;
          return (
            <Text
              key={label.id}
              style={[
                { position: "absolute", left: label.x - boxWidth / 2, top: label.y - 6 * scale, width: boxWidth, textAlign: "center", color: LABEL_COLOR.nakshatra },
                nepaliTextStyle(fontSize),
              ]}
              numberOfLines={1}
            >
              {nak ? (lang === "en" ? nak.en : nak.ne) : ""}
            </Text>
          );
        }
        if (label.kind === "asterism" && label.index) {
          /* The name of the star group itself, sitting on the stars. Short, so
             it does not smother the figure it belongs to. */
          const nak = NAKSHATRA_SHORT[label.index - 1];
          return (
            <Text
              key={label.id}
              style={[
                { position: "absolute", left: label.x - 30, top: label.y + 6, width: 60, textAlign: "center", color: LABEL_COLOR.asterism },
                nepaliTextStyle(10),
              ]}
              className="text-[10px] font-bold"
              numberOfLines={1}
            >
              {nak ? (lang === "en" ? nak.en : nak.ne) : ""}
            </Text>
          );
        }
        if (label.kind === "cardinal") {
          return (
            <Text
              key={label.id}
              style={{ position: "absolute", left: label.x - 14, top: label.y - 10, width: 28, textAlign: "center", color: LABEL_COLOR.cardinal }}
              className="text-sm font-bold"
            >
              {label.text}
            </Text>
          );
        }
        if (label.kind === "station") {
          const st = SOLAR_STATIONS.find((x) => x.id === label.text);
          return (
            <Text
              key={label.id}
              style={[
                { position: "absolute", left: label.x - 60, top: label.y - 7, width: 120, textAlign: "center", color: LABEL_COLOR.station },
                nepaliTextStyle(10),
              ]}
              className="text-[10px] font-bold"
              numberOfLines={2}
            >
              {st ? (lang === "en" ? st.en : st.ne) : ""}
            </Text>
          );
        }
        if (label.kind === "axis") {
          return (
            <Text
              key={label.id}
              style={[
                { position: "absolute", left: label.x - 60, top: label.y - 16, width: 120, textAlign: "center", color: LABEL_COLOR.axis },
                nepaliTextStyle(9),
              ]}
              className="text-[9px] font-bold"
              numberOfLines={2}
            >
              {label.text === "earth"
                ? pick("पृथ्वीको अक्ष", "Earth's axis")
                : pick("कक्षाको लम्ब", "Orbit's perpendicular")}
            </Text>
          );
        }
        if (label.kind === "obliquity") {
          return (
            <Text
              key={label.id}
              style={[
                { position: "absolute", left: label.x - 45, top: label.y - 7, width: 90, textAlign: "center", color: LABEL_COLOR.tilt },
                nepaliTextStyle(11),
              ]}
              className="text-[11px] font-bold"
              numberOfLines={1}
            >
              {`${digits((label.deg ?? 23.44).toFixed(2))}°`}
            </Text>
          );
        }
        if (label.kind === "polestar") {
          const star = POLE_STARS.find((p) => p.en === label.text);
          if (!star) return null;
          // index 1 marks the star the pole is nearest right now.
          const reigning = label.index === 1;
          return (
            <View
              key={label.id}
              style={{ position: "absolute", left: label.x - 55, top: label.y + 8, width: 110 }}
              className="items-center"
            >
              <Text
                style={[
                  { color: reigning ? LABEL_COLOR.station : LABEL_COLOR.poleStar },
                  nepaliTextStyle(reigning ? 11 : 9),
                ]}
                className={reigning ? "text-[11px] font-bold" : "text-[9px]"}
                numberOfLines={1}
              >
                {lang === "en" ? star.en.replace(/\s*\(.*\)$/, "") : star.ne}
              </Text>
              <Text
                style={[{ color: LABEL_COLOR.overlayDim }, nepaliTextStyle(8)]}
                className="text-[8px]"
                numberOfLines={1}
              >
                {formatPoleYear(label.year, lang, digits)}
              </Text>
            </View>
          );
        }
        if (label.kind === "tropic") {
          return (
            <Text
              key={label.id}
              style={[
                { position: "absolute", left: label.x - 55, top: label.y - 7, width: 110, textAlign: "center", color: LABEL_COLOR.tropic },
                nepaliTextStyle(9),
              ]}
              className="text-[9px]"
              numberOfLines={1}
            >
              {label.text === "cancer"
                ? pick("कर्कट रेखा · २३.४४°उ", "Tropic of Cancer · 23.44°N")
                : pick("मकर रेखा · २३.४४°द", "Tropic of Capricorn · 23.44°S")}
            </Text>
          );
        }
        if (label.kind === "observer") {
          return (
            <View
              key={label.id}
              style={{ position: "absolute", left: label.x - 55, top: label.y - 8, width: 110 }}
              className="items-center"
            >
              <Ionicons name="location" size={14 * scale} color={LABEL_COLOR.observer} />
              <Text
                className="font-bold"
                style={[nepaliTextStyle(10 * scale), { color: LABEL_COLOR.observer }]}
                numberOfLines={1}
              >
                {pick("तपाईं यहाँ", "You are here")}
              </Text>
            </View>
          );
        }
        if (label.kind === "azimuth") {
          return (
            <Text
              key={label.id}
              style={{ position: "absolute", left: label.x - 16, top: label.y - 6, width: 32, textAlign: "center", color: LABEL_COLOR.azimuth }}
              className="text-[9px]"
            >
              {label.text}
            </Text>
          );
        }
        if (label.kind === "graha" && label.key) {
          return (
            <Text
              key={label.id}
              style={[
                { position: "absolute", left: label.x - 45, top: label.y + 10, width: 90, textAlign: "center", color: GRAHA_COLOR[label.key] },
                nepaliTextStyle(10),
              ]}
              className="text-[10px] font-bold"
              numberOfLines={1}
            >
              {lang === "en" ? GRAHA_NAME[label.key].en : GRAHA_NAME[label.key].ne}
            </Text>
          );
        }
        return null;
      })}
    </View>
  );
});

function Chip({
  active,
  label,
  onPress,
  overlay,
  compact,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  /** Floating over the canvas: force light text, whatever the app theme is. */
  overlay?: boolean;
  /** Tighter, for the single row that floats over a fullscreen sky. */
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border active:opacity-70 ${
        compact ? "px-2.5 py-1" : "px-3 py-1.5"
      } ${active ? "border-secondary bg-secondary/15" : "border-border bg-background"}`}
      style={overlay ? { backgroundColor: "rgba(255,255,255,0.08)" } : undefined}
      accessibilityRole="button"
    >
      <Text
        className={`font-medium ${compact ? "text-[11px]" : "text-xs"} ${
          active ? "text-secondary" : "text-muted-foreground"
        }`}
        numberOfLines={1}
        style={[
          nepaliTextStyle(compact ? 10 : 11),
          overlay ? { color: active ? LABEL_COLOR.rashi : LABEL_COLOR.overlayText } : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** A transport control: icon only, with the label carried by accessibility. */
function IconButton({
  name,
  label,
  active,
  overlay,
  compact,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  overlay?: boolean;
  /** Tighter, for the single row that floats over a fullscreen sky. */
  compact?: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const tint = active
    ? overlay
      ? LABEL_COLOR.rashi
      : colors.secondary
    : overlay
      ? LABEL_COLOR.overlayText
      : colors.mutedForeground;

  return (
    <Pressable
      onPress={onPress}
      className={`items-center justify-center rounded-full border active:opacity-70 ${
        compact ? "h-8 w-8" : "h-10 w-10"
      } ${active ? "border-secondary bg-secondary/15" : "border-border bg-background"}`}
      style={overlay ? { backgroundColor: "rgba(255,255,255,0.08)" } : undefined}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={name} size={compact ? 17 : 20} color={tint} />
    </Pressable>
  );
}

/**
 * Zoom and fullscreen, sitting on top of the sky. Double the old 32pt: against a
 * star field a small dark disc reads as scenery, and on a tablet the scene is
 * now tall enough that 32pt vanished into it entirely.
 */
function RoundButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-16 w-16 items-center justify-center rounded-full bg-black/45 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        className="font-bold"
        style={{ color: LABEL_COLOR.hud, fontSize: 32, lineHeight: 38 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default AakashGocharSky;
