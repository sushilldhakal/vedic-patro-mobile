import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "@/components/AppShell";
import { HomeRashifalSignPicker } from "@/components/home/HomeRashifalSignPicker";
import { GrahaBanner } from "@/components/graha/GrahaPageParts";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { defaultClockForTimezone } from "@/components/panchanga/use-panchanga-mode";
import { RashifalPersonalCard } from "@/components/rashifal/RashifalPersonalCard";
import { RashifalProfilePicker } from "@/components/rashifal/RashifalProfilePicker";
import { ErrorState } from "@/components/ui/States";
import { VedicPatroLoader } from "@/components/branding/VedicPatroLoader";
import type { Profile } from "@/lib/auth/client";
import {
  RASHIFAL_PERIODS,
  fetchPersonalRashifal,
  fetchRashifal,
  rashifalKeys,
  type RashifalPeriod,
} from "@/lib/api";
import { profileChartParams } from "@/lib/kundali/profile-chart";
import { instantCacheKey } from "@/lib/instant-query";
import { useLocale } from "@/lib/i18n";
import { floatingNavBottomPadding, PAGE_HORIZONTAL_PADDING } from "@/lib/mobile-nav";
import {
  RASHIFAL_PERIOD_ICON,
  rashifalRangeLabel,
  rashifalStepDate,
} from "@/lib/rashifal-ui";
import { useBreakpoint } from "@/lib/responsive";
import { useThemeColors } from "@/lib/theme-context";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { cn } from "@/lib/utils";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";
import { nepaliTextStyle } from "@/lib/nepali-text";

function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const PERIOD_LABEL: Record<RashifalPeriod, { ne: string; en: string }> = {
  daily: { ne: "दैनिक", en: "Daily" },
  weekly: { ne: "साप्ताहिक", en: "Weekly" },
  monthly: { ne: "मासिक", en: "Monthly" },
  yearly: { ne: "वार्षिक", en: "Yearly" },
};

export default function RashifalScreen() {
  const params = useLocalSearchParams<{ period?: string }>();
  const initialPeriod = RASHIFAL_PERIODS.includes(params.period as RashifalPeriod)
    ? (params.period as RashifalPeriod)
    : "daily";

  const { pick, lang, digits } = useLocale();
  const colors = useThemeColors();
  const { isTablet } = useBreakpoint();
  const { location, setLocation } = usePanchangaLocation();
  const tz = resolveTimeZone(undefined, location.params.timezone);
  const todayAd = todayAdStringInTimezone(new Date(), tz);
  const [date, setDate] = useState(() => new Date(`${todayAd}T12:00:00`));
  const [clock, setClock] = useState(() => defaultClockForTimezone(tz));
  const [period, setPeriod] = useState<RashifalPeriod>(initialPeriod);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState(false);

  const dateAd = useMemo(() => toAdStr(date), [date]);

  const profileChart = selectedProfile ? profileChartParams(selectedProfile) : null;
  const hasBirthChart = Boolean(
    profileChart &&
      profileChart.location.params.lat != null &&
      profileChart.location.params.lon != null,
  );

  const generalQ = useQuery({
    queryKey: rashifalKeys.block(dateAd, period, location.params),
    queryFn: () => fetchRashifal(dateAd, period, location.params),
    enabled: !selectedProfile,
    staleTime: 1000 * 60 * 15,
    placeholderData: keepPreviousData,
  });

  const personalQ = useQuery({
    queryKey: rashifalKeys.personal(
      dateAd,
      period,
      selectedProfile?.id ?? "",
      location.params,
      profileChart ? instantCacheKey(profileChart.moment) : "",
    ),
    queryFn: () =>
      fetchPersonalRashifal(
        dateAd,
        period,
        {
          moment: profileChart!.moment,
          birthLat: profileChart!.location.params.lat as number,
          birthLon: profileChart!.location.params.lon as number,
          birthTz: profileChart!.location.params.timezone ?? "Asia/Kathmandu",
        },
        location.params,
      ),
    enabled: Boolean(selectedProfile && hasBirthChart),
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  });

  const windowSource = selectedProfile ? personalQ.data : generalQ.data;
  const rangeLabel = useMemo(
    () => rashifalRangeLabel(windowSource, period, lang, digits),
    [windowSource, period, lang, digits],
  );

  const handleSelectProfile = (profile: Profile | null) => {
    const chart = profile ? profileChartParams(profile) : null;
    if (profile && (!chart || chart.location.params.lat == null || chart.location.params.lon == null)) {
      setProfileError(true);
      setSelectedProfile(null);
      return;
    }
    setProfileError(false);
    setSelectedProfile(profile);
  };

  const loading = selectedProfile
    ? personalQ.isFetching && !personalQ.data
    : generalQ.isFetching && !generalQ.data;
  const error = selectedProfile ? personalQ.isError : generalQ.isError;

  const defaultSignId = generalQ.data?.frame?.sun_sign;

  return (
    <AppShell title={pick("राशिफल", "Rashifal")} showHeader={false}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: PAGE_HORIZONTAL_PADDING,
          paddingBottom: floatingNavBottomPadding(isTablet),
          gap: 16,
        }}
      >
        <GrahaBanner
          icon="sparkles-outline"
          title={pick("राशिफल", "Rashifal")}
          blurb={pick(
            "सूर्योदय पञ्चाङ्ग, चन्द्रबल र गोचरमा आधारित गणितीय राशिफल",
            "Computed rashifal from sunrise panchanga, chandrabala & transits",
          )}
        />

        <PanchangaDateNav
          date={date}
          onDateChange={setDate}
          todayAd={todayAd}
          clock={clock}
          onClockChange={setClock}
          location={location}
          onLocationChange={setLocation}
          crossEraSubtitleOverride={period !== "daily" ? rangeLabel : undefined}
          onPrev={
            period !== "daily"
              ? () => setDate(rashifalStepDate(windowSource, period, date, -1))
              : undefined
          }
          onNext={
            period !== "daily"
              ? () => setDate(rashifalStepDate(windowSource, period, date, 1))
              : undefined
          }
        />

        <View className="flex-row rounded-xl border border-border bg-card p-1">
          {RASHIFAL_PERIODS.map((p) => {
            const active = p === period;
            const icon = RASHIFAL_PERIOD_ICON[p];
            return (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                className={cn(
                  "min-h-10 flex-1 flex-row items-center justify-center gap-1 rounded-lg px-1 py-2",
                  active ? "bg-tab-active" : "",
                )}
              >
                <Ionicons
                  name={icon}
                  size={16}
                  color={active ? colors.primary : colors.mutedForeground}
                />
                {active ? (
                  <Text
                    className="text-[10px] font-bold text-foreground"
                    style={nepaliTextStyle(10)}
                    numberOfLines={1}
                  >
                    {pick(PERIOD_LABEL[p].ne, PERIOD_LABEL[p].en)}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <RashifalProfilePicker selectedId={selectedProfile?.id ?? null} onSelect={handleSelectProfile} />
        {profileError ? (
          <Text className="text-center text-xs text-destructive">
            {pick("जन्म मिति र स्थान प्रोफाइलमा भर्नुहोस्।", "Add birth date and place to the profile.")}
          </Text>
        ) : null}

        {loading && !windowSource ? (
          <View className="py-16">
            <VedicPatroLoader />
          </View>
        ) : error ? (
          <ErrorState
            message={pick("राशिफल लोड गर्न सकिएन।", "Could not load rashifal.")}
            onRetry={() => (selectedProfile ? personalQ.refetch() : generalQ.refetch())}
          />
        ) : selectedProfile && personalQ.data ? (
          <RashifalPersonalCard name={selectedProfile.full_name} personal={personalQ.data} />
        ) : generalQ.data?.signs?.length ? (
          <HomeRashifalSignPicker
            signs={generalQ.data.signs}
            period={period}
            defaultSignId={defaultSignId}
            contentInset={PAGE_HORIZONTAL_PADDING}
          />
        ) : (
          <Text className="py-8 text-center text-sm text-muted-foreground">
            {pick("यस अवधिको राशिफल उपलब्ध छैन।", "Rashifal unavailable for this period.")}
          </Text>
        )}
      </ScrollView>
    </AppShell>
  );
}
