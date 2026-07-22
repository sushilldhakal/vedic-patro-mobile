import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DayTimeline } from "@/components/panchanga/DayTimeline";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { PanchangaWheel } from "@/components/panchanga/PanchangaWheel";
import { PanchangaDetailCard } from "@/components/PanchangaDetailCard";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { fetchPanchanga, panchangaKeys } from "@/lib/api";
import { BS_MONTHS_NE, adToBS } from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { floatingNavBottomPadding } from "@/lib/mobile-nav";
import { useBreakpoint } from "@/lib/responsive";
import { displayLocationLabel, usePanchangaLocation } from "@/lib/use-panchanga-location";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";

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
  const { isTablet } = useBreakpoint();
  const params = useLocalSearchParams<{ date?: string }>();
  const { location, setLocation, ready } = usePanchangaLocation();

  const [date, setDate] = useState(() =>
    typeof params.date === "string" && params.date ? parseAdStr(params.date) : new Date(),
  );

  useEffect(() => {
    if (typeof params.date === "string" && params.date) {
      setDate(parseAdStr(params.date));
    }
  }, [params.date]);

  const adDateStr = toAdStr(date);
  const bs = adToBS(date);
  const bsMonthNe = BS_MONTHS_NE[bs.month - 1] ?? "";
  const timezone = resolveTimeZone(undefined, location.params.timezone);
  const todayAd = todayAdStringInTimezone(new Date(), timezone);
  const isToday = adDateStr === todayAd;

  const panchangaQuery = useQuery({
    queryKey: panchangaKeys.day(adDateStr, "ad", location.params),
    queryFn: () => fetchPanchanga(adDateStr, "ad", location.params),
    enabled: ready,
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  const wheelData = panchangaQuery.data;
  const showWheelSkeleton = panchangaQuery.isLoading && !wheelData;
  const locationLabel = displayLocationLabel(location, wheelData?.location?.name);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: floatingNavBottomPadding(isTablet), paddingHorizontal: 16, paddingTop: 8, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <PanchangaDateNav
        date={date}
        onDateChange={setDate}
        todayAd={todayAd}
        toolbar={
          <LocationSelector location={location} onLocationChange={setLocation} />
        }
      />

      {!ready || (panchangaQuery.isLoading && !panchangaQuery.data) ? (
        <LoadingState />
      ) : panchangaQuery.isError ? (
        <ErrorState
          message={pick("पञ्चाङ्ग लोड गर्न सकिएन।", "Could not load panchanga.")}
          onRetry={() => panchangaQuery.refetch()}
        />
      ) : (
        <View className="gap-4">
          {(wheelData || showWheelSkeleton) && (
            <DayTimeline
              p={wheelData}
              loading={showWheelSkeleton}
              dateAd={adDateStr}
              isToday={isToday}
              timezone={timezone}
              showNeedle={isToday}
            />
          )}

          {(wheelData || showWheelSkeleton) && (
            <PanchangaWheel
              p={wheelData}
              loading={showWheelSkeleton}
              bsYear={bs.year}
              bsMonthNe={bsMonthNe}
              bsDay={bs.day}
              isToday={isToday}
              timezone={timezone}
              locationLabel={locationLabel}
            />
          )}

          {wheelData ? <PanchangaDetailCard data={wheelData} /> : null}
        </View>
      )}
    </ScrollView>
  );
}
