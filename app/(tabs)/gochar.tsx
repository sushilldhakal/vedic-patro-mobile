import { useMemo, useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { GocharIngressSection } from "@/components/gochar/GocharIngressSection";
import { GocharPlanetDeepDive } from "@/components/gochar/GocharPlanetDeepDive";
import { GocharSkySection } from "@/components/gochar/GocharSkySection";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { Text } from "@/components/ui/Text";
import { fetchGochar, fetchGocharIngress, gocharKeys } from "@/lib/api";
import { adToBS, bsToAD, BS_MONTH_NAMES, BS_MONTHS_NE, getBSMonthLength, shiftBsMonth } from "@/lib/bs-calendar";
import { formatGocharPatroDate } from "@/lib/gochar-page-utils";
import type { GrahaKey } from "@/lib/graha-details";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useBreakpoint } from "@/lib/responsive";
import { useThemeColors } from "@/lib/theme-context";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";

function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function GocharScreen() {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();
  const { width } = useBreakpoint();
  const { location, setLocation } = usePanchangaLocation();
  const tz = resolveTimeZone(undefined, location.params.timezone);
  const todayAd = todayAdStringInTimezone(new Date(), tz);
  const [date, setDate] = useState(() => new Date(`${todayAd}T12:00:00`));
  const [selectedPlanet, setSelectedPlanet] = useState<GrahaKey>("sun");

  const dateAd = useMemo(() => toAdStr(date), [date]);
  const bs = useMemo(() => adToBS(date), [date]);

  const gocharQ = useQuery({
    queryKey: gocharKeys.day(dateAd, "ad", location.params),
    queryFn: () => fetchGochar(dateAd, "ad", location.params),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  // Ingress list covers the browsed BS month, as on web.
  const ingressRange = useMemo(() => {
    const from = toAdStr(bsToAD(bs.year, bs.month, 1));
    const to = toAdStr(bsToAD(bs.year, bs.month, getBSMonthLength(bs.year, bs.month)));
    return { from, to };
  }, [bs.year, bs.month]);

  const ingressQ = useQuery({
    queryKey: gocharKeys.ingress(ingressRange.from, ingressRange.to, "patro", location.params),
    queryFn: () =>
      fetchGocharIngress(ingressRange.from, ingressRange.to, location.params, { level: "patro" }),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  const stepIngressMonth = (delta: number) => {
    const next = shiftBsMonth(bs.year, bs.month, delta);
    const day = Math.min(bs.day, getBSMonthLength(next.year, next.month));
    setDate(bsToAD(next.year, next.month, day));
  };

  const monthLabel = `${pick(BS_MONTHS_NE[bs.month - 1], BS_MONTH_NAMES[bs.month - 1])} ${digits(bs.year)}`;
  const dateLabel = formatGocharPatroDate(dateAd, lang);
  const gochar = gocharQ.data?.gochar;

  return (
    <AppShell
      title={pick("गोचर", "Gochar")}
      subtitle={pick(
        "प्रत्यक्ष ग्रह गोचर — स्थिति, आगामी प्रवेश र वक्री",
        "Live planetary transits — positions, upcoming ingresses & retrogrades",
      )}
      headerRight={<Ionicons name="planet-outline" size={26} color={colors.secondary} />}
    >
      <LocationSelector location={location} onLocationChange={setLocation} />
      <PanchangaDateNav date={date} onDateChange={setDate} todayAd={todayAd} />

      {gochar ? (
        <View className="gap-6">
          <GocharSkySection
            gochar={gochar}
            dateLabel={dateLabel}
            onSelectPlanet={setSelectedPlanet}
          />

          <View className={width >= 1024 ? "flex-row gap-6" : "gap-6"}>
            <GocharIngressSection
              events={ingressQ.data?.events ?? []}
              refDateAd={dateAd}
              loading={ingressQ.isLoading && !ingressQ.data}
              browseMonthLabel={monthLabel}
              onPrevMonth={() => stepIngressMonth(-1)}
              onNextMonth={() => stepIngressMonth(1)}
            />
            <GocharPlanetDeepDive
              gochar={gochar}
              selected={selectedPlanet}
              onSelect={setSelectedPlanet}
            />
          </View>
        </View>
      ) : gocharQ.isError ? (
        <Text style={{ color: colors.destructive, ...nepaliTextStyle(14) }} className="text-sm">
          {pick("गोचर ल्याउन सकिएन।", "Could not load transits.")}
        </Text>
      ) : (
        <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
          {pick("लोड हुँदै…", "Loading…")}
        </Text>
      )}

      <Text className="mt-4 text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
        {pick(
          "स्थितिहरू स्थानीय सूर्योदय (उदय) मा गणना गरिएका छन् — लाहिरी निरयन।",
          "Positions are computed at local sunrise (udaya) — Lahiri sidereal.",
        )}
      </Text>
    </AppShell>
  );
}
