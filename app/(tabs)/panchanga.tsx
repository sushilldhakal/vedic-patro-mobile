import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchPanchanga,
  locationCacheKey,
  panchangaKeys,
} from "@/lib/api";
import { adToBS } from "@/lib/bs-calendar";
import {
  buildAtTimeDatetime,
  chartDateAd,
  fetchEphemerisPanchangaDay,
  isEphemerisPanchanga,
} from "@/lib/ephemeris-adapters";
import { formatTimeShort, getSunrise, getSunset } from "@/lib/panchanga-format";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { DayTimeline } from "@/components/panchanga/DayTimeline";
import { PanchangaWheel } from "@/components/panchanga/PanchangaWheel";
import { PanchangaAsidePanels } from "@/components/panchanga/PanchangaAsidePanels";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { EphemerisModeBanner } from "@/components/panchanga/MuhurtaNowPanel";
import {
  DinVisheshSection,
  FestivalsSection,
  MuhurtaTimingsSection,
  NivasShoolSection,
  PanchangCoreSection,
  BalamSection,
  PanchakaLagnaSection,
  RashiSection,
  RituSection,
  SunMoonSamvatSection,
} from "@/components/panchanga/PanchangaSections";
import {
  defaultClockForTimezone,
  usePanchangaClock,
} from "@/components/panchanga/use-panchanga-mode";
import { LoadingState } from "@/components/ui/States";
import { displayLocationLabel, usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";
import {
  floatingNavBottomPadding,
  PAGE_HORIZONTAL_PADDING,
  PANCHANGA_SIDEBAR_SPLIT,
  PANCHANGA_SIDEBAR_WIDTH,
} from "@/lib/mobile-nav";
import { useBreakpoint } from "@/lib/responsive";

function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseAdStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export default function PanchangaScreen() {
  const { pick } = useLocale();
  const { width, isTablet, isCompact } = useBreakpoint();
  const splitSidebar = width >= PANCHANGA_SIDEBAR_SPLIT;
  const params = useLocalSearchParams<{ date?: string }>();
  const { location, setLocation, ready } = usePanchangaLocation();

  const [date, setDate] = useState(() =>
    typeof params.date === "string" && params.date ? parseAdStr(params.date) : new Date(),
  );
  const timezoneForMode = location.params.timezone ?? "Asia/Kathmandu";
  const { clock, setClock } = usePanchangaClock(timezoneForMode);
  const [clockUserAdjusted, setClockUserAdjusted] = useState(false);

  useEffect(() => {
    if (typeof params.date === "string" && params.date) {
      setDate(parseAdStr(params.date));
    }
  }, [params.date]);

  const adDateStr = toAdStr(date);
  const bs = adToBS(date);
  const atTimeDatetime = buildAtTimeDatetime(adDateStr, clock);

  const udayaQuery = useQuery({
    queryKey: panchangaKeys.day(adDateStr, "ad", location.params),
    queryFn: () => fetchPanchanga(adDateStr, "ad", location.params),
    enabled: ready,
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  const instantQuery = useQuery({
    queryKey: panchangaKeys.atTime(atTimeDatetime, location.params),
    queryFn: () => fetchEphemerisPanchangaDay(atTimeDatetime, adDateStr, location.params),
    enabled: ready,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  const { data, isError } = instantQuery;
  const ephemeris = isEphemerisPanchanga(data);
  const wheelData = udayaQuery.data;
  const showWheelSkeleton = udayaQuery.isLoading && !wheelData;

  const sunrise = wheelData ? getSunrise(wheelData) : data ? getSunrise(data) : undefined;
  const sunset = wheelData ? getSunset(wheelData) : data ? getSunset(data) : undefined;
  const effectiveTimezone = resolveTimeZone(data?.location?.timezone, location.params.timezone);
  const isToday = adDateStr === todayAdStringInTimezone(new Date(), effectiveTimezone);
  const locationLabel = displayLocationLabel(location, data?.location?.name);
  const chartAd = data ? chartDateAd(data, adDateStr) : adDateStr;
  const todayAd = todayAdStringInTimezone(new Date(), effectiveTimezone);

  const clockSyncedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setClockUserAdjusted(false);
  }, [adDateStr]);

  const handleClockChange = useCallback(
    (next: string) => {
      setClockUserAdjusted(true);
      setClock(next);
    },
    [setClock],
  );

  useEffect(() => {
    const syncKey = `${adDateStr}|${locationCacheKey(location.params)}`;
    if (clockSyncedKeyRef.current === syncKey) return;
    if (clockUserAdjusted) return;

    if (isToday) {
      clockSyncedKeyRef.current = syncKey;
      setClock(defaultClockForTimezone(effectiveTimezone));
      return;
    }

    const sunriseClock = formatTimeShort(wheelData ? getSunrise(wheelData) : undefined);
    if (!sunriseClock) return;
    clockSyncedKeyRef.current = syncKey;
    setClock(sunriseClock);
  }, [
    adDateStr,
    location.params,
    isToday,
    effectiveTimezone,
    clockUserAdjusted,
    wheelData,
    setClock,
  ]);

  if (!ready || (udayaQuery.isLoading && !wheelData)) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{
          paddingBottom: floatingNavBottomPadding(isTablet),
          paddingHorizontal: PAGE_HORIZONTAL_PADDING,
          paddingTop: isCompact ? 12 : 16,
        }}
      >
        <LoadingState />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="mx-auto w-full max-w-[1400px] flex-1 bg-background"
      contentContainerStyle={{
        paddingBottom: floatingNavBottomPadding(isTablet),
        paddingTop: isCompact ? 12 : 16,
        paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        className="gap-4"
        style={splitSidebar ? { flexDirection: "row", alignItems: "flex-start", gap: 20 } : undefined}
      >
        <View className="min-w-0 flex-1 gap-4">
          <PanchangaDateNav
            date={date}
            onDateChange={setDate}
            todayAd={todayAd}
            clock={clock}
            onClockChange={handleClockChange}
            toolbar={
              <LocationSelector location={location} onLocationChange={setLocation} />
            }
          />
          {ephemeris && data ? <EphemerisModeBanner p={data} clock={clock} /> : null}
          {wheelData || showWheelSkeleton ? (
            <DayTimeline
              p={wheelData}
              loading={showWheelSkeleton}
              dateAd={adDateStr}
              isToday={isToday}
              timezone={effectiveTimezone}
              needleClock={clockUserAdjusted ? clock : undefined}
              showNeedle={clockUserAdjusted || isToday}
            />
          ) : null}
        </View>

        <View
          className="min-w-0 gap-4"
          style={
            splitSidebar
              ? { width: PANCHANGA_SIDEBAR_WIDTH, flexShrink: 0, alignSelf: "flex-start" }
              : { width: "100%" }
          }
        >
          <PanchangaAsidePanels
            sunrise={sunrise}
            sunset={sunset}
            timezone={effectiveTimezone}
            ephemeris={ephemeris}
            data={data}
            clock={clock}
            chartAd={chartAd}
            location={location.params}
          />
        </View>
      </View>

      <View className="mt-4 gap-4">
        {wheelData || showWheelSkeleton ? (
          <PanchangaWheel
            p={wheelData}
            loading={showWheelSkeleton}
            bsYear={bs.year}
            bsMonthNe={bs.monthName}
            bsDay={bs.day}
            isToday={isToday}
            timezone={effectiveTimezone}
            locationLabel={locationLabel}
          />
        ) : null}

        {isError ? (
          <View className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
            <Text className="text-sm text-destructive">
              {pick("पञ्चाङ्ग लोड गर्न सकिएन।", "Could not load panchanga.")}
            </Text>
          </View>
        ) : null}

        {data ? (
          <View className="gap-3">
            <SunMoonSamvatSection p={data} />
            <PanchangCoreSection p={data} />
            <RashiSection p={wheelData ?? data} />
            <RituSection p={data} />
            <BalamSection p={wheelData ?? data} clock={clock} />
            <PanchakaLagnaSection p={wheelData ?? data} clock={clock} />
            <NivasShoolSection p={data} fallback={wheelData} />
            <MuhurtaTimingsSection p={data} />
            <DinVisheshSection p={data} />
            <FestivalsSection p={data} />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
