import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, StatusBar, View,  } from "react-native"
import { Text } from "@/components/ui/Text"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PanchangaDay } from "@/lib/api";
import { fetchPanchangaAtTime, panchangaKeys } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { SkeletonPulse } from "@/components/ui/SkeletonPulse";
import { useLocale } from "@/lib/i18n";
import { getPanchangaDetail } from "@/lib/panchanga-format";
import { BS_MONTHS_NE, BS_MONTH_NAMES } from "@/lib/bs-calendar";
import { minutesSinceMidnightInTimezone, resolveTimeZone } from "@/lib/zoned-time";
import {
  buildWheelDetail,
  buildWheelMarkers,
  buildWheelMarkersAtTime,
  DEFAULT_WHEEL_TWEAKS,
  gClock,
  scrubGToDatetime,
} from "@/lib/wheel-data";
import { useBreakpoint } from "@/lib/responsive";
import {
  computeFullscreenWheelHeight,
  computeInlineWheelStageSize,
} from "@/lib/wheel-layout";
import { WheelChart, type WheelHover, type WheelPick } from "./WheelChart";
import { WheelPanel } from "./WheelPanel";
import { parseClockParts } from "./use-panchanga-mode";
import {
  wheelLegendDot,
  wheelLegendRow,
} from "@/lib/wheel-classes";
import type { YearWheelScrub } from "@/lib/wheel-year-scrub";

export type { YearWheelScrub };

const W_BG = "#061f21";
const W_ACCENT = "#c62828";
const W_INK = "#eaf3f1";
const W_INK_DIM = "rgba(234, 243, 241, 0.65)";
const W_INK_FAINT = "rgba(234, 243, 241, 0.45)";
const W_DOCK_BG = "rgba(11, 20, 22, 0.94)";
const W_DOCK_BORDER = "rgba(143, 191, 193, 0.28)";
const wheelDockIconStyle = {
  width: 32,
  height: 32,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: W_DOCK_BORDER,
};

const headEyebrowStyle = {
  color: W_INK_FAINT,
  fontSize: 12,
  fontWeight: "600" as const,
  letterSpacing: 1.6,
  textTransform: "uppercase" as const,
};
const headTitleStyle = {
  color: W_INK,
  fontSize: 18,
  fontWeight: "700" as const,
  lineHeight: 24,
  marginTop: 4,
};
const headSubStyle = {
  color: W_INK_DIM,
  fontSize: 14,
  marginTop: 4,
};

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
  /** When true, only fetch at-time state after the user moves the time slider. */
  atTimeScrubOnly?: boolean;
  /**
   * Range view: playback across a window of days. Replaces the whole time dock —
   * the day and the time both come from the page's own date chrome instead.
   */
  yearScrub?: YearWheelScrub;
  /** "HH:MM" — where the needle sits when the wheel has no time slider of its own. */
  clock?: string;
  /** Fullscreen-only calendar button; opens whatever `fullscreenOverlay` renders. */
  onOpenDatePicker?: () => void;
  /** Rendered inside the fullscreen modal so a picker can sit above the wheel. */
  fullscreenOverlay?: ReactNode;
};


function GhatiScrubber({
  value,
  onChange,
  trackWidth = 120,
}: {
  value: number;
  onChange: (g: number) => void;
  trackWidth?: number;
}) {
  return (
    <Slider
      style={{ width: trackWidth, height: 32 }}
      minimumValue={0}
      maximumValue={60}
      step={0.25}
      value={value}
      onValueChange={onChange}
      minimumTrackTintColor={W_ACCENT}
      maximumTrackTintColor="rgba(255,255,255,0.14)"
      thumbTintColor={W_ACCENT}
      accessibilityLabel="Time scrubber"
    />
  );
}

/**
 * The range wheel's whole control set: step/play backward, play-pause, step/play
 * forward, and — in fullscreen only — a calendar button for the date-time picker.
 * Pressing the direction you are already playing ramps 1×→2×→4×→8×.
 *
 * Deliberately nothing else: the day and the time are the page's business here,
 * so there is no time slider, no "now", no reload and no zoom buttons.
 */
function WheelRangeDock({
  pick,
  digits,
  scrub,
  fullscreen,
  onToggleFullscreen,
  onOpenDatePicker,
  bottomInset,
}: {
  pick: (ne: string, en: string) => string;
  digits: (n: number | string) => string | number;
  scrub: YearWheelScrub;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenDatePicker?: () => void;
  bottomInset: number;
}) {
  const playing = scrub.direction !== 0;
  const dayLabel = scrub.dayInYear ?? scrub.day;
  const totalLabel = scrub.daysInYear ?? scrub.totalDays;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 8,
        right: 8,
        bottom: 14 + bottomInset,
        alignItems: "center",
        zIndex: 22,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          maxWidth: "100%",
          borderRadius: 999,
          borderWidth: 1,
          borderColor: W_DOCK_BORDER,
          backgroundColor: W_DOCK_BG,
          paddingHorizontal: 12,
          paddingVertical: 8,
          shadowColor: "#000",
          shadowOpacity: 0.55,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        <Pressable
          onPress={scrub.onBackward}
          style={[
            wheelDockIconStyle,
            scrub.direction === -1 ? { backgroundColor: W_ACCENT } : null,
          ]}
          accessibilityLabel={pick("पछाडि चलाउनुहोस्", "Play backward")}
        >
          <Ionicons name="play-back" size={15} color={W_INK} />
        </Pressable>
        <Pressable
          onPress={playing ? scrub.onPause : scrub.onForward}
          style={wheelDockIconStyle}
          accessibilityLabel={playing ? pick("रोक्नुहोस्", "Pause") : pick("चलाउनुहोस्", "Play")}
        >
          <Ionicons name={playing ? "pause" : "play"} size={15} color={W_INK} />
        </Pressable>
        <Pressable
          onPress={scrub.onForward}
          style={[
            wheelDockIconStyle,
            scrub.direction === 1 ? { backgroundColor: W_ACCENT } : null,
          ]}
          accessibilityLabel={pick("अगाडि चलाउनुहोस्", "Play forward")}
        >
          <Ionicons name="play-forward" size={15} color={W_INK} />
        </Pressable>

        <Text style={{ color: W_INK, fontSize: 13, fontWeight: "600", flexShrink: 0 }}>
          {digits(dayLabel)}
          <Text style={{ color: W_INK_DIM }}>
            /{digits(totalLabel)}
            {playing ? ` · ${digits(scrub.speed)}×` : ""}
          </Text>
        </Text>

        {/* The page's date chrome is out of reach in fullscreen, so the picker
            comes to the wheel — and opens without dropping out of fullscreen. */}
        {fullscreen && onOpenDatePicker ? (
          <Pressable
            onPress={onOpenDatePicker}
            style={wheelDockIconStyle}
            accessibilityLabel={pick("मिति र समय", "Date and time")}
          >
            <Ionicons name="calendar-outline" size={16} color={W_INK} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={onToggleFullscreen}
          style={wheelDockIconStyle}
          accessibilityLabel={
            fullscreen ? pick("सामान्य दृश्य", "Exit full screen") : pick("पूर्ण स्क्रिन", "Full screen")
          }
        >
          <Ionicons name={fullscreen ? "contract-outline" : "expand-outline"} size={16} color={W_INK} />
        </Pressable>
      </View>
    </View>
  );
}

function WheelDock({
  pick,
  digits,
  scrubG,
  scrubClock,
  isToday,
  onScrubChange,
  onSnapNow,
  onReset,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  expanded,
  scrubTrackWidth,
  bottomInset,
}: {
  pick: (ne: string, en: string) => string;
  digits: (n: number | string) => string | number;
  scrubG: number;
  scrubClock: string;
  isToday?: boolean;
  onScrubChange: (g: number) => void;
  onSnapNow: () => void;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
  expanded: boolean;
  scrubTrackWidth: number;
  bottomInset?: number;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 8,
        right: 8,
        bottom: 14 + (bottomInset ?? 0),
        alignItems: "center",
        zIndex: 22,
      }}
    >
      <View
        pointerEvents="box-none"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          maxWidth: "100%",
          borderRadius: 999,
          borderWidth: 1,
          borderColor: W_DOCK_BORDER,
          backgroundColor: W_DOCK_BG,
          paddingHorizontal: 14,
          paddingVertical: 10,
          shadowColor: "#000",
          shadowOpacity: 0.55,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1, minWidth: 0 }}>
          <Text style={{ color: W_INK_DIM, fontSize: 14, flexShrink: 0 }}>{pick("समय", "Time")}</Text>
          <GhatiScrubber value={scrubG} onChange={onScrubChange} trackWidth={scrubTrackWidth} />
          <Text style={{ color: W_INK, minWidth: 52, textAlign: "center", fontSize: 14, fontWeight: "600" }}>
            {digits(scrubClock)}
          </Text>
        </View>

        <View style={{ width: 1, height: 26, backgroundColor: W_DOCK_BORDER }} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {isToday ? (
            <Pressable
              onPress={onSnapNow}
              style={{
                height: 30,
                borderRadius: 999,
                backgroundColor: W_ACCENT,
                paddingHorizontal: 14,
                justifyContent: "center",
              }}
              accessibilityLabel={pick("अहिलेको समय", "Current time")}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1a1205" }}>{pick("आज", "Now")}</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onReset}
            style={wheelDockIconStyle}
            accessibilityLabel={pick("रिलोड · जुम रिसेट · सूर्योदय", "Reload · reset zoom · sunrise")}
          >
            <Ionicons name="refresh-outline" size={16} color={W_INK} />
          </Pressable>
          <Pressable
            onPress={onZoomIn}
            style={wheelDockIconStyle}
            accessibilityLabel={pick("जुम इन", "Zoom in")}
          >
            <Ionicons name="add-outline" size={18} color={W_INK} />
          </Pressable>
          <Pressable
            onPress={onZoomOut}
            style={wheelDockIconStyle}
            accessibilityLabel={pick("जुम आउट", "Zoom out")}
          >
            <Ionicons name="remove-outline" size={18} color={W_INK} />
          </Pressable>
          <Pressable
            onPress={onToggleFullscreen}
            style={wheelDockIconStyle}
            accessibilityLabel={
              expanded ? pick("सामान्य दृश्य", "Exit full screen") : pick("पूर्ण स्क्रिन", "Full screen")
            }
          >
            <Ionicons name={expanded ? "contract-outline" : "expand-outline"} size={16} color={W_INK} />
          </Pressable>
        </View>
      </View>
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
  atTimeScrubOnly = false,
  yearScrub,
  clock,
  onOpenDatePicker,
  fullscreenOverlay,
}: Omit<Props, "loading" | "p"> & { p: PanchangaDay }) {
  const { pick, digits } = useLocale();
  const { width: screenW, height: screenH, isTablet, isLandscape } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const inlineStageSize = computeInlineWheelStageSize({
    containerWidth,
    screenW,
    screenH,
    safeAreaTop: insets.top,
  });
  const fullscreenStageHeight = computeFullscreenWheelHeight(screenH);
  const compactHead = isTablet || isLandscape;
  const scrubTrackWidth = isTablet ? (isLandscape ? 120 : 168) : Math.min(120, Math.max(88, screenW * 0.22));
  const det = useMemo(() => buildWheelDetail(p), [p]);
  const tz = resolveTimeZone(p?.location?.timezone, timezone);
  const [now, setNow] = useState(() => new Date());
  const [spin, setSpin] = useState(0);
  const [scrubPinned, setScrubPinned] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [picked, setPicked] = useState<WheelPick | null>(null);
  const [hover, setHover] = useState<WheelHover | null>(null);

  const nowG = useMemo(() => {
    const mins = minutesSinceMidnightInTimezone(now, tz, true);
    let g = (mins - det.sunriseMin) / 24;
    if (g < 0) g += 60;
    return Math.max(0, Math.min(60, g));
  }, [now, det.sunriseMin, tz]);

  /* Range view: the wheel has no time slider, so the needle follows the clock
     the page's date chrome is holding. */
  const rangeMode = Boolean(yearScrub);
  const clockG = useMemo(() => {
    if (!clock) return null;
    const { hour, minute } = parseClockParts(clock);
    let g = (hour * 60 + minute - det.sunriseMin) / 24;
    if (g < 0) g += 60;
    return Math.max(0, Math.min(60, g));
  }, [clock, det.sunriseMin]);

  const [scrubG, setScrubG] = useState(() => (isToday ? nowG : 0));
  const [debouncedScrubG, setDebouncedScrubG] = useState(scrubG);
  const effectiveG = rangeMode ? (clockG ?? 0) : scrubG;

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

  /* In the year view the day itself is what moves, so at-time state is only
     worth fetching once the user reaches for the time slider — otherwise every
     playback tick would queue a request the wheel never gets to draw. */
  const scrubbing = atTimeScrubOnly
    ? scrubPinned
    : scrubPinned || Math.abs(scrubG - (isToday && !scrubPinned ? nowG : 0)) > 0.05;
  /* Playback would queue an at-time request per tick and draw none of them, so
     the range view stays on the day's own state and moves the needle locally. */
  const needsAtTime = Boolean(anchorAd) && scrubbing && !rangeMode;

  const scrubQ = useQuery({
    queryKey: panchangaKeys.atTime(scrubDatetime, locationParams),
    queryFn: () => fetchPanchangaAtTime(scrubDatetime, locationParams),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled: needsAtTime,
  });

  const atTimeData = needsAtTime && !scrubQ.isPlaceholderData ? scrubQ.data : undefined;
  const markers = useMemo(
    () => (atTimeData ? buildWheelMarkersAtTime(atTimeData) : buildWheelMarkers(p, det, effectiveG)),
    [atTimeData, p, det, effectiveG],
  );

  const handleScrubChange = useCallback((g: number) => {
    setScrubG(g);
    setScrubPinned(true);
  }, []);

  const snapToNow = useCallback(() => {
    const freshNow = new Date();
    setNow(freshNow);
    const mins = minutesSinceMidnightInTimezone(freshNow, tz, true);
    let g = (mins - det.sunriseMin) / 24;
    if (g < 0) g += 60;
    setScrubPinned(false);
    setSpin(0);
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setScrubG(Math.max(0, Math.min(60, g)));
  }, [det.sunriseMin, tz]);

  const resetToSunrise = useCallback(() => {
    setScrubPinned(true);
    setSpin(0);
    setScrubG(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleLeave = useCallback(() => setHover(null), []);
  const handlePick = useCallback((next: WheelPick) => setPicked(next), []);

  const handleZoom = useCallback((next: number) => {
    const z = Math.max(0.55, Math.min(14, next));
    setZoom(z);
    if (z <= 1) setPan({ x: 0, y: 0 });
  }, []);

  const toggleExpanded = useCallback(() => setExpanded((v) => !v), []);

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

  const scrubClock = gClock(effectiveG, det.sunriseMin);
  const scrubTithi = atTimeData
    ? ((getPanchangaDetail(atTimeData)?.tithi as { name_ne?: string; name?: string } | undefined) ??
      (atTimeData.tithi as { name_ne?: string; name?: string } | undefined))
    : undefined;
  const tithiNe = scrubTithi?.name_ne ?? det.tithi2[0]?.ne ?? "—";
  const tithiEn = scrubTithi?.name ?? det.tithi2[0]?.en ?? tithiNe;
  const locLabel = locationLabel ?? p.location?.name ?? pick("काठमाडौं", "Kathmandu");

  const renderHeader = (fullscreen?: boolean) => {
    const eyebrow = compactHead
      ? { ...headEyebrowStyle, fontSize: 10, letterSpacing: 1.2 }
      : headEyebrowStyle;
    const title = compactHead
      ? { ...headTitleStyle, fontSize: fullscreen ? 14 : 15, lineHeight: 19, marginTop: 2 }
      : headTitleStyle;
    const sub = compactHead
      ? { ...headSubStyle, fontSize: 12, marginTop: 2 }
      : headSubStyle;
    const top = fullscreen ? insets.top + 6 : compactHead ? 8 : 10;

    return (
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top,
          left: 16,
          right: 16,
          zIndex: 20,
        }}
      >
        {!compactHead ? (
          <Text style={eyebrow}>{pick("पञ्चाङ्ग चक्र", "Nepali Patro · Panchanga Wheel")}</Text>
        ) : null}
        <Text style={title}>
          {isToday && !scrubPinned ? `${pick("आजको", "Today's")} ` : ""}
          {pick("ग्रह–नक्षत्र · तिथि–करण चक्र", "Graha–Nakshatra · Tithi–Karana wheel")}{" "}
          <Text style={{ color: W_ACCENT }}>{digits(bsYear)}</Text>
        </Text>
        <Text style={sub} numberOfLines={compactHead ? 1 : 2}>
          {pick(det.weekday.ne, det.weekday.en)}, {pick(bsMonthNe, bsMonthEnOf(bsMonthNe))} {digits(bsDay)} ·{" "}
          {pick(tithiNe, tithiEn)} · {locLabel}
        </Text>
      </View>
    );
  };

  const renderStage = (size: number | "fill", fullscreen: boolean) => (
    <View
      style={
        size === "fill"
          ? {
              width: "100%",
              height: fullscreenStageHeight,
              overflow: "hidden",
              backgroundColor: W_BG,
            }
          : {
              width: "100%",
              height: size,
              overflow: "hidden",
              backgroundColor: W_BG,
            }
      }
      onLayout={(e) => {
        setContainerWidth(e.nativeEvent.layout.width);
      }}
    >
      {renderHeader(fullscreen)}
      <View className="flex-1">
        <WheelChart
          det={det}
          markers={markers}
          spin={spin}
          tw={DEFAULT_WHEEL_TWEAKS}
          bsYear={bsYear}
          sel={picked}
          hover={hover}
          onHover={setHover}
          onLeave={handleLeave}
          onPick={handlePick}
          onSpin={setSpin}
          zoom={zoom}
          onZoom={handleZoom}
          pan={pan}
          onPan={(x, y) => setPan({ x, y })}
        />
      </View>

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 16,
          // The year row takes a band of its own above the time dock.
          bottom: (fullscreen ? 88 + insets.bottom : 72) + (yearScrub ? 60 : 0),
          gap: 6,
          maxWidth: size === "fill" ? "45%" : "45%",
          zIndex: 20,
        }}
      >
        <View className={`${wheelLegendRow} flex-row items-center gap-1.5`}>
          <View className={wheelLegendDot} style={{ backgroundColor: W_ACCENT }} />
          <Text style={{ fontSize: 13, color: W_INK_DIM }}>
            {pick("लग्न · वर्तमान नक्षत्र · तिथि", "Lagna · current nakshatra · tithi")}
          </Text>
        </View>
        {!isTablet && !fullscreen ? (
          <Text style={{ fontSize: 12, color: W_INK_FAINT }}>
            {pick("घुमाउन तान्नुहोस् · जुम गर्नुहोस् · दुई औंलाले सार्नुहोस्", "Drag to rotate · pinch to zoom · two fingers to pan")}
          </Text>
        ) : null}
        {isTablet || fullscreen ? (
          <>
            <View className={`${wheelLegendRow} flex-row items-center gap-1.5`}>
              <View className={wheelLegendDot} style={{ backgroundColor: "#f2a81d" }} />
              <Text style={{ fontSize: 13, color: W_INK_DIM }}>{pick("सूर्य राशि", "Sun sign")}</Text>
            </View>
            <View className={`${wheelLegendRow} flex-row items-center gap-1.5`}>
              <View className={wheelLegendDot} style={{ backgroundColor: "#d3dce4" }} />
              <Text style={{ fontSize: 13, color: W_INK_DIM }}>{pick("चन्द्र राशि", "Moon sign")}</Text>
            </View>
          </>
        ) : null}
      </View>

      {yearScrub ? (
        <WheelRangeDock
          pick={pick}
          digits={digits}
          scrub={yearScrub}
          fullscreen={fullscreen}
          onToggleFullscreen={toggleExpanded}
          onOpenDatePicker={onOpenDatePicker}
          bottomInset={fullscreen ? insets.bottom : 0}
        />
      ) : (
        <WheelDock
          pick={pick}
          digits={digits}
          scrubG={scrubG}
          scrubClock={scrubClock}
          isToday={isToday}
          onScrubChange={handleScrubChange}
          onSnapNow={snapToNow}
          onReset={resetToSunrise}
          onZoomIn={() => handleZoom(zoom * 1.4)}
          onZoomOut={() => handleZoom(zoom / 1.4)}
          onToggleFullscreen={toggleExpanded}
          expanded={fullscreen}
          scrubTrackWidth={scrubTrackWidth}
          bottomInset={fullscreen ? insets.bottom : 0}
        />
      )}
    </View>
  );

  const wheelShell = renderStage(inlineStageSize, false);

  return (
    <>
      <View
        className="overflow-hidden rounded-2xl border border-border"
        style={{ backgroundColor: W_BG }}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        {wheelShell}
      </View>

      <WheelPanel sel={picked} open={!!picked} num={digits} onClose={() => setPicked(null)} />

      <Modal
        visible={expanded}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={toggleExpanded}
      >
        <StatusBar barStyle="light-content" backgroundColor={W_BG} translucent />
        <View style={{ flex: 1, backgroundColor: W_BG }}>
          {renderStage("fill", true)}
          {/* Inside the fullscreen modal on purpose: a sheet mounted by the page
              would open behind it, and closing fullscreen to pick a date is
              exactly what the calendar button exists to avoid. */}
          {fullscreenOverlay}
        </View>
      </Modal>
    </>
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
      <SkeletonPulse className="mx-auto bg-muted/20" style={{ width: 320, height: 320 }} />
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
  atTimeScrubOnly,
  yearScrub,
  clock,
  onOpenDatePicker,
  fullscreenOverlay,
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
      atTimeScrubOnly={atTimeScrubOnly}
      yearScrub={yearScrub}
      clock={clock}
      onOpenDatePicker={onOpenDatePicker}
      fullscreenOverlay={fullscreenOverlay}
    />
  );
}

export const PanchangaWheel = memo(PanchangaWheelImpl);
