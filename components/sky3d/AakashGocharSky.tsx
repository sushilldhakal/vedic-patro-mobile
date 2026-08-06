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
import { Text } from "@/components/ui/Text";
import type { GocharGraha } from "@/lib/api";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import { adToBS, bsMonthLabel, WEEKDAYS_SHORT_NE } from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { nativeWindThemeVars } from "@/lib/nativewind-theme-vars";
import { formatRashiByNumber } from "@/lib/rashi-i18n";
import { useTheme, useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { GRAHA_COLOR } from "@/lib/sky3d/geocentric-model";
import { KATHMANDU, type Observer } from "@/lib/sky3d/horizon";
import { calibrate, type SkyCalibration } from "@/lib/sky3d/orbital-model";
import { RASHI_ICONS } from "@/lib/sky3d/rashi-icons";
import { getZonedTimeParts, todayAdStringInTimezone } from "@/lib/zoned-time";
import { SOLAR_STATIONS } from "@/lib/sky3d/sky-geometry";
import {
  AakashGocharScene,
  type FocusKey,
  type SceneToggles,
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
  tropic: "#e2d264",
  hud: "#ffffff",
  hudDim: "rgba(255,255,255,0.72)",
  overlayText: "rgba(236,242,244,0.88)",
  overlayDim: "rgba(236,242,244,0.62)",
} as const;

/**
 * The speed ladder, in simulated seconds per real second. Pressing a fast
 * button repeatedly climbs it; pause drops back to the first rung.
 */
const SPEED_LADDER = [
  { seconds: 60, ne: "१ मिनेट/से", en: "1 min/s" },
  { seconds: 7200, ne: "२ घण्टा/से", en: "2 hr/s" },
  { seconds: 172800, ne: "२ दिन/से", en: "2 days/s" },
  { seconds: 604800, ne: "१ हप्ता/से", en: "1 week/s" },
  { seconds: 5184000, ne: "२ महिना/से", en: "2 months/s" },
];
/** Camera distance that frames the whole system in the space view. */
const SYSTEM_DISTANCE = 26;
/** Zoom value that opens the horizon view out to a ~120° fisheye. */
const HORIZON_WIDE = 45;
/** Default zoom in the Earth-globe view — frames the globe and its ring. */
const GLOBE_VIEW = 78;

export type AakashGocharSkyProps = {
  /** Gochar rows for {@link date} — the API longitudes the model is pinned to. */
  gochar?: Record<string, GocharGraha>;
  /** The date the gochar rows describe; the simulation starts here. */
  date: Date;
  /** Where the sky is being watched from. Drives the whole horizon view. */
  observer?: Observer;
  /** The place's timezone — the clock in the HUD reads on its wall, not UTC. */
  timeZone?: string;
  height?: number;
};

export function AakashGocharSky({
  gochar,
  date,
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

  const sim = useRef<SimState>({
    timeMs: date.getTime(),
    secondsPerRealSecond: SPEED_LADDER[0].seconds,
    playing: true,
  });
  const view = useRef<ViewState>({ yaw: 0.5, pitch: 0.62, distance: SYSTEM_DISTANCE });

  const [mode, setMode] = useState<SkyMode>("space");
  const [playing, setPlaying] = useState(true);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [selectedKey, setSelectedKey] = useState<GrahaKey | null>(null);
  const [focusKey, setFocusKey] = useState<FocusKey>("earth");
  const [sample, setSample] = useState<SkySample | null>(null);
  const [toggles, setToggles] = useState<SceneToggles>({
    belts: true,
    grid: true,
    lockStars: true,
    labels: true,
  });
  const [fullscreen, setFullscreen] = useState(false);

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
          /* The camera is kept north of the ecliptic in both the space and the
             globe view. From the south side the zodiac reads backwards — the
             rashi and every graha running clockwise — and that is never what
             you want to be looking at. Only the horizon view, where you are
             standing on the ground and may look anywhere, keeps the full range;
             all of them clamp short of the pole so the view cannot flip over on
             itself. */
          const lowestPitch = modeRef.current === "horizon" ? -1.45 : 0.08;
          view.current.pitch = Math.min(
            1.45,
            Math.max(lowestPitch, gestureStart.current.pitch + g.dy * 0.005),
          );
        },
      }),
    [],
  );

  const onSample = useCallback((next: SkySample) => setSample(next), []);
  const onSelect = useCallback((key: GrahaKey) => {
    setSelectedKey((prev) => (prev === key ? null : key));
  }, []);

  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /* Fullscreen runs under the status bar, so the HUD and the zoom buttons have
     to start below the clock and the battery — and below the notch, which the
     insets do not always report from inside a modal. */
  const overlayTop = fullscreen ? Math.max(insets.top, 28) + 16 : 12;
  const simDate = sample ? new Date(sample.timeMs) : date;

  /**
   * The clock reading, in the calendar the reader is using and on the wall of
   * the place they picked — not UTC, and not the device's own zone.
   */
  const simStamp = useMemo(() => {
    const dateAd = todayAdStringInTimezone(simDate, timeZone);
    const { hour, minute } = getZonedTimeParts(simDate, timeZone);
    const clock = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const weekday = new Date(`${dateAd}T12:00:00Z`).getUTCDay();
    const place = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;

    if (lang === "en") {
      return { date: dateAd, time: `${clock} · ${place}` };
    }
    const bs = adToBS(new Date(`${dateAd}T12:00:00`));
    return {
      date: `${digits(bs.year)} ${bsMonthLabel(bs.month, "ne")} ${digits(bs.day)}, ${WEEKDAYS_SHORT_NE[weekday]}बार`,
      time: `${digits(clock)} · ${place}`,
    };
  }, [simDate, timeZone, lang, digits]);

  const isDay = mode === "horizon" && (sample?.sunAltitude ?? -90) > -0.5;

  const zoomBy = (factor: number) => {
    view.current.distance = Math.min(120, Math.max(0.35, view.current.distance * factor));
  };

  // Fullscreen gives the sky the whole window and floats the controls over it.
  const canvasHeight = fullscreen ? windowHeight : height;

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
              selectedKey={selectedKey}
              focusKey={focusKey}
              toggles={toggles}
              onSelect={onSelect}
              onSample={onSample}
            />
          </Suspense>
        </Canvas>

        {/* Labels ride over the canvas rather than in it — real Devanagari type,
            positioned from the scene's own projection of each anchor. */}
        {toggles.labels && sample ? (
          <View style={{ position: "absolute", inset: 0 }} pointerEvents="none">
            {sample.labels.map((label) => {
              if (label.kind === "rashi" && label.index) {
                const Icon = RASHI_ICONS[label.index - 1];
                return (
                  <View
                    key={label.id}
                    style={{ position: "absolute", left: label.x - 34, top: label.y - 12, width: 68 }}
                    className="items-center"
                  >
                    <Icon width={16} height={16} color="#f4c542" />
                    <Text
                      className="text-[10px] font-bold"
                      style={[nepaliTextStyle(10), { color: LABEL_COLOR.rashi }]}
                      numberOfLines={1}
                    >
                      {formatRashiByNumber(label.index, lang)}
                    </Text>
                  </View>
                );
              }
              if (label.kind === "nakshatra" && label.index) {
                const nak = NAKSHATRA_ICONS[label.index - 1];
                return (
                  <Text
                    key={label.id}
                    style={[
                      { position: "absolute", left: label.x - 40, top: label.y - 6, width: 80, textAlign: "center", color: LABEL_COLOR.nakshatra },
                      nepaliTextStyle(9),
                    ]}
                    className="text-[9px]"
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
        ) : null}

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

        <View className="absolute right-3 gap-1.5" style={{ top: overlayTop }}>
          <RoundButton label="+" onPress={() => zoomBy(0.7)} />
          <RoundButton label="−" onPress={() => zoomBy(1.4)} />
          <RoundButton
            label={fullscreen ? "✕" : "⛶"}
            onPress={() => setFullscreen((f) => !f)}
          />
        </View>
      </View>

      {/* Floating over the canvas, this panel is always dark glass — so it runs
          on the dark tokens whatever the app theme is, or light-mode text would
          come out near-black on it. */}
      <View
        className={
          fullscreen
            ? "dark absolute inset-x-0 bottom-0 gap-2.5 px-3 pb-5 pt-3"
            : "gap-2.5 border-t border-border bg-card px-3 py-3"
        }
        style={
          fullscreen
            ? [nativeWindThemeVars("dark"), { backgroundColor: "rgba(4, 9, 12, 0.62)" }]
            : undefined
        }
      >
        {/* View */}
        <View className="flex-row items-center gap-2">
          <Chip
            active={mode === "space"}
            label={pick("अन्तरिक्ष दृश्य", "Space view")}
            onPress={() => {
              setMode("space");
              setFocusKey("earth");
              view.current = { yaw: 0.5, pitch: 0.62, distance: SYSTEM_DISTANCE };
            }}
            overlay={fullscreen}
          />
          <Chip
            active={mode === "globe"}
            label={pick("पृथ्वी गोला", "Earth globe")}
            onPress={() => {
              setMode("globe");
              setFocusKey("earth");
              view.current = { yaw: 0.6, pitch: 0.42, distance: GLOBE_VIEW };
            }}
            overlay={fullscreen}
          />
        </View>

        {/* Transport — one row, all icons. Each press of a fast button steps
            further up the speed ladder; pause drops back to normal. */}
        <View className="flex-row items-center gap-1">
          <IconButton
            name="play-back"
            label={pick("पछाडि छिटो", "Faster backward")}
            active={!playing ? false : reverse && speedIndex > 0}
            overlay={fullscreen}
            onPress={() => stepSpeed("back")}
          />
          <IconButton
            name={playing ? "pause" : "play"}
            label={playing ? pick("रोक्नुहोस्", "Pause") : pick("चलाउनुहोस्", "Play")}
            active={playing}
            overlay={fullscreen}
            onPress={togglePlay}
          />
          <IconButton
            name="play-forward"
            label={pick("अगाडि छिटो", "Faster forward")}
            active={!playing ? false : !reverse && speedIndex > 0}
            overlay={fullscreen}
            onPress={() => stepSpeed("forward")}
          />
          <View className="w-2" />
          <IconButton
            name="refresh"
            label={pick("मितिमा फर्कनुहोस्", "Back to the chosen date")}
            active={false}
            overlay={fullscreen}
            onPress={() => {
              /* The nav above starts on today, so with no date chosen this is
                 simply "back to now". */
              sim.current.timeMs = date.getTime();
            }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          <Chip
            active={toggles.labels}
            label={pick("नाम", "Labels")}
            onPress={() => setToggles((t) => ({ ...t, labels: !t.labels }))}
            overlay={fullscreen}
          />
          <Chip
            active={toggles.belts}
            label={pick("राशि/नक्षत्र", "Zodiac")}
            onPress={() => setToggles((t) => ({ ...t, belts: !t.belts }))}
            overlay={fullscreen}
          />
          <Chip
            active={toggles.grid}
            label={pick("दिक् ग्रिड", "Alt-az grid")}
            onPress={() => setToggles((t) => ({ ...t, grid: !t.grid }))}
            overlay={fullscreen}
          />
          <Chip
            active={toggles.lockStars}
            label={pick("तारा स्थिर", "Lock to stars")}
            onPress={() => setToggles((t) => ({ ...t, lockStars: !t.lockStars }))}
            overlay={fullscreen}
          />
        </ScrollView>

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

function Chip({
  active,
  label,
  onPress,
  overlay,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  /** Floating over the canvas: force light text, whatever the app theme is. */
  overlay?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 active:opacity-70 ${
        active ? "border-secondary bg-secondary/15" : "border-border bg-background"
      }`}
      style={overlay ? { backgroundColor: "rgba(255,255,255,0.08)" } : undefined}
      accessibilityRole="button"
    >
      <Text
        className={`text-xs font-medium ${active ? "text-secondary" : "text-muted-foreground"}`}
        style={[
          nepaliTextStyle(11),
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
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  overlay?: boolean;
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
      className={`h-10 w-10 items-center justify-center rounded-full border active:opacity-70 ${
        active ? "border-secondary bg-secondary/15" : "border-border bg-background"
      }`}
      style={overlay ? { backgroundColor: "rgba(255,255,255,0.08)" } : undefined}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={name} size={20} color={tint} />
    </Pressable>
  );
}

function RoundButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-8 w-8 items-center justify-center rounded-full bg-black/45 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text className="text-base font-bold" style={{ color: LABEL_COLOR.hud }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default AakashGocharSky;
