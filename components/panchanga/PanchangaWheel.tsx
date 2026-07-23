import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
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
import {
  wheelLegendDot,
  wheelLegendRow,
} from "@/lib/wheel-classes";

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

  const scrubClock = gClock(scrubG, det.sunriseMin);
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
          bottom: fullscreen ? 88 + insets.bottom : 72,
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
