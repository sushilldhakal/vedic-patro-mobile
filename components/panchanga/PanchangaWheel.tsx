import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PanchangaDay } from "@/lib/api";
import { fetchPanchangaAtTime, panchangaKeys } from "@/lib/api";
import { Card } from "@/components/ui/Card";
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
import { PAGE_HORIZONTAL_PADDING } from "@/lib/mobile-nav";
import { useBreakpoint } from "@/lib/responsive";
import { WheelChart, type WheelHover, type WheelPick } from "./WheelChart";
import { WheelPanel } from "./WheelPanel";
import {
  wheelIconBtn,
  wheelLegendDot,
  wheelLegendRow,
} from "@/lib/wheel-classes";

const W_BG = "#061f21";
const W_STAGE = "#0a2e30";
const W_ACCENT = "#c62828";
const W_INK = "#eaf3f1";
const W_INK_DIM = "rgba(234, 243, 241, 0.65)";
const W_INK_FAINT = "rgba(234, 243, 241, 0.45)";
const W_DOCK_BG = "rgba(11, 20, 22, 0.94)";
const W_DOCK_BORDER = "rgba(143, 191, 193, 0.28)";

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
  marginTop: 6,
};
const headSubStyle = {
  color: W_INK_DIM,
  fontSize: 14,
  marginTop: 6,
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
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 8,
        right: 8,
        bottom: 14,
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
            className={wheelIconBtn}
            style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: W_DOCK_BORDER }}
            accessibilityLabel={pick("रिलोड · जुम रिसेट · सूर्योदय", "Reload · reset zoom · sunrise")}
          >
            <Ionicons name="refresh-outline" size={16} color={W_INK} />
          </Pressable>
          <Pressable
            onPress={onZoomIn}
            className={wheelIconBtn}
            style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: W_DOCK_BORDER }}
            accessibilityLabel={pick("जुम इन", "Zoom in")}
          >
            <Ionicons name="add-outline" size={18} color={W_INK} />
          </Pressable>
          <Pressable
            onPress={onZoomOut}
            className={wheelIconBtn}
            style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: W_DOCK_BORDER }}
            accessibilityLabel={pick("जुम आउट", "Zoom out")}
          >
            <Ionicons name="remove-outline" size={18} color={W_INK} />
          </Pressable>
          <Pressable
            onPress={onToggleFullscreen}
            className={wheelIconBtn}
            style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: W_DOCK_BORDER }}
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
  const { width: screenW, height: screenH, isTablet } = useBreakpoint();
  const [containerWidth, setContainerWidth] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [fullscreenLayout, setFullscreenLayout] = useState({ width: 0, height: 0 });
  const fallbackWidth = Math.max(screenW - PAGE_HORIZONTAL_PADDING * 2, 280);
  const inlineStageSize = Math.min(Math.max(containerWidth || fallbackWidth, 280), isTablet ? 1400 : 640);
  const expandedStageSize =
    fullscreenLayout.width > 0 && fullscreenLayout.height > 0
      ? Math.min(fullscreenLayout.width, fullscreenLayout.height)
      : Math.min(screenW, screenH);
  const scrubTrackWidth = isTablet ? 168 : Math.min(120, Math.max(88, screenW * 0.22));
  const det = useMemo(() => buildWheelDetail(p), [p]);
  const tz = resolveTimeZone(p?.location?.timezone, timezone);
  const [now, setNow] = useState(() => new Date());
  const [spin, setSpin] = useState(0);
  const spinRef = useRef(spin);
  spinRef.current = spin;
  const [scrubPinned, setScrubPinned] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [picked, setPicked] = useState<WheelPick | null>(null);
  const [hover, setHover] = useState<WheelHover | null>(null);
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
    if (!expanded) setFullscreenLayout({ width: 0, height: 0 });
  }, [expanded]);

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
      onStartShouldSetPanResponder: () => false,
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

  const renderHeader = (fullscreen?: boolean) => (
    <View style={{ paddingHorizontal: fullscreen ? 16 : 16, paddingTop: fullscreen ? 8 : 16, paddingBottom: fullscreen ? 8 : 12 }}>
      <Text style={headEyebrowStyle}>{pick("पञ्चाङ्ग चक्र", "Nepali Patro · Panchanga Wheel")}</Text>
      <Text style={headTitleStyle}>
        {isToday && !scrubPinned ? `${pick("आजको", "Today's")} ` : ""}
        {pick("ग्रह–नक्षत्र · तिथि–करण चक्र", "Graha–Nakshatra · Tithi–Karana wheel")}{" "}
        <Text style={{ color: W_ACCENT }}>{digits(bsYear)}</Text>
      </Text>
      <Text style={headSubStyle}>
        {pick(det.weekday.ne, det.weekday.en)}, {pick(bsMonthNe, bsMonthEnOf(bsMonthNe))} {digits(bsDay)} ·{" "}
        {pick(tithiNe, tithiEn)} · {locLabel}
      </Text>
    </View>
  );

  const renderStage = (size: number, fullscreen: boolean) => (
    <View
      style={{
        width: size,
        height: size,
        alignSelf: "center",
        overflow: "hidden",
        backgroundColor: W_STAGE,
      }}
      onLayout={(e) => {
        wheelSize.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
      }}
    >
      <View className="flex-1" {...rotatePan.panHandlers}>
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

      {isTablet || fullscreen ? (
        <View
          pointerEvents="none"
          style={{ position: "absolute", left: 16, bottom: 72, gap: 6, maxWidth: size * 0.45 }}
        >
          <View className={`${wheelLegendRow} flex-row items-center gap-1.5`}>
            <View className={wheelLegendDot} style={{ backgroundColor: W_ACCENT }} />
            <Text style={{ fontSize: 13, color: W_INK_DIM }}>
              {pick("लग्न · वर्तमान नक्षत्र · तिथि", "Lagna · current nakshatra · tithi")}
            </Text>
          </View>
          <View className={`${wheelLegendRow} flex-row items-center gap-1.5`}>
            <View className={wheelLegendDot} style={{ backgroundColor: "#f2a81d" }} />
            <Text style={{ fontSize: 13, color: W_INK_DIM }}>{pick("सूर्य राशि", "Sun sign")}</Text>
          </View>
          <View className={`${wheelLegendRow} flex-row items-center gap-1.5`}>
            <View className={wheelLegendDot} style={{ backgroundColor: "#d3dce4" }} />
            <Text style={{ fontSize: 13, color: W_INK_DIM }}>{pick("चन्द्र राशि", "Moon sign")}</Text>
          </View>
        </View>
      ) : null}

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
      />
    </View>
  );

  const wheelShell = (
    <>
      {renderHeader()}
      {renderStage(inlineStageSize, false)}
      {!isTablet ? (
        <View className="gap-1.5 px-4 py-3">
          <View className={`${wheelLegendRow} flex-row items-center gap-1.5`}>
            <View className={wheelLegendDot} style={{ backgroundColor: W_ACCENT }} />
            <Text style={{ fontSize: 13, color: W_INK_DIM }}>
              {pick("लग्न · वर्तमान नक्षत्र · तिथि", "Lagna · current nakshatra · tithi")}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: W_INK_FAINT }}>
            {pick("घुमाउन तान्नुहोस् · जुम गर्नुहोस्", "Drag to rotate · pinch to zoom")}
          </Text>
        </View>
      ) : null}
    </>
  );

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
        <StatusBar barStyle="light-content" backgroundColor={W_BG} />
        <View style={{ flex: 1, backgroundColor: W_BG }}>
          <SafeAreaView style={{ flex: 1 }}>
            {renderHeader(true)}
            <View
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setFullscreenLayout({ width, height });
              }}
            >
              {expandedStageSize > 0 ? renderStage(expandedStageSize, true) : null}
            </View>
          </SafeAreaView>
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
      <View className="mx-auto animate-pulse bg-muted/20" style={{ width: 320, height: 320 }} />
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
