import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { BsMonthHeaderTitle } from "@/components/home/BsMonthHeaderTitle";
import { BsCalendarGrid } from "@/components/home/BsCalendarGrid";
import { PanchangaAsidePanel } from "@/components/home/PanchangaAsidePanel";
import { PanchangaMonthGrid } from "@/components/home/PanchangaMonthGrid";
import { PatroViewToggle, type HomePatroView } from "@/components/home/PatroViewToggle";
import { VedicPatroLoader } from "@/components/branding/VedicPatroLoader";
import { ErrorState } from "@/components/ui/States";
import { apiKeys, fetchMonthCalendar, fetchPanchanga, fetchSaitMonthAll, type CalendarDay } from "@/lib/api";
import {
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  getCurrentBs,
  shiftBsMonth,
  todayAdString,
} from "@/lib/bs-calendar";
import { buildCalendarGridDays, buildLocalMonthDays } from "@/lib/local-calendar";
import { useLocale } from "@/lib/i18n";
import { floatingNavBottomPadding } from "@/lib/mobile-nav";
import { useBreakpoint } from "@/lib/responsive";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";

const ASIDE_SPLIT = 1081;
const ASIDE_MAX_WIDTH = 400;

function monthStartAd(ctx: { year: number; month: number; days: CalendarDay[] }): string {
  const first = ctx.days.find((d) => d.day === 1) ?? ctx.days[0];
  return first?.date_ad ?? todayAdString();
}

export default function HomeScreen() {
  const { pick } = useLocale();
  const { width, isTablet } = useBreakpoint();
  const router = useRouter();
  const { location, setLocation } = usePanchangaLocation();
  const initial = getCurrentBs();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [patroView, setPatroView] = useState<HomePatroView>("calendar");
  const todayAd = todayAdString();
  const splitAside = width >= ASIDE_SPLIT;

  const monthQuery = useQuery({
    queryKey: apiKeys.month(year, month, location.params),
    queryFn: () => fetchMonthCalendar(year, month, location.params),
  });

  const monthDays = useMemo(() => {
    const local = buildLocalMonthDays(year, month);
    const enriched = monthQuery.data?.calendar ?? [];
    const byAd = new Map(enriched.map((d) => [d.date_ad, d]));
    return local.map((d) => ({ ...d, ...byAd.get(d.date_ad) }));
  }, [year, month, monthQuery.data]);

  const gridDays = useMemo(
    () => (patroView === "calendar" ? buildCalendarGridDays(year, month, monthDays) : monthDays),
    [patroView, year, month, monthDays],
  );

  const viewingCurrentBsMonth = useMemo(() => {
    const todayBs = adToBS(new Date(`${todayAd}T12:00:00`));
    return year === todayBs.year && month === todayBs.month;
  }, [year, month, todayAd]);

  const asideAdDate = useMemo(() => {
    if (selectedDay?.date_ad) return selectedDay.date_ad;
    if (viewingCurrentBsMonth) return todayAd;
    return monthStartAd({ year, month, days: monthDays });
  }, [selectedDay, viewingCurrentBsMonth, todayAd, year, month, monthDays]);

  const panchangaQ = useQuery({
    queryKey: apiKeys.panchanga(asideAdDate, "ad", location.params),
    queryFn: () => fetchPanchanga(asideAdDate, "ad", location.params),
  });

  const saitQ = useQuery({
    queryKey: apiKeys.saitMonthAll(year, month, location.params),
    queryFn: () => fetchSaitMonthAll(year, month, location.params),
    staleTime: 1000 * 60 * 60,
    retry: 2,
  });

  const publicHolidayDates = useMemo(() => {
    const set = new Set<string>();
    for (const d of monthDays) {
      if (d.is_public_holiday) set.add(d.date_ad);
    }
    return set;
  }, [monthDays]);

  const goMonth = useCallback(
    (delta: number) => {
      const next = shiftBsMonth(year, month, delta);
      setYear(next.year);
      setMonth(next.month);
      setSelectedDay(null);
    },
    [year, month],
  );

  const goToday = () => {
    const bs = adToBS(new Date(`${todayAd}T12:00:00`));
    setYear(bs.year);
    setMonth(bs.month);
    setSelectedDay(null);
  };

  const calendarBlock = (
    <View className="min-w-0 flex-1">
      <BsMonthHeaderTitle
        year={year}
        month={month}
        todayAd={todayAd}
        onPrev={() => goMonth(-1)}
        onNext={() => goMonth(1)}
        onToday={goToday}
        onMonthChange={(m) => {
          setMonth(m);
          setSelectedDay(null);
        }}
        onYearChange={(y) => {
          setYear(y);
          setSelectedDay(null);
        }}
        prevDisabled={month === 1 && year <= BS_SUPPORTED_START_YEAR}
        nextDisabled={month === 12 && year >= BS_SUPPORTED_END_YEAR}
        patroView={patroView}
        onPatroViewChange={(v) => {
          setPatroView(v);
          setSelectedDay(null);
        }}
        location={location}
        onLocationChange={setLocation}
      />

      {monthQuery.isLoading && !monthQuery.data ? (
        <View className="py-16">
          <VedicPatroLoader />
        </View>
      ) : monthQuery.isError ? (
        <ErrorState
          message={pick("पात्रो लोड गर्न सकिएन।", "Could not load calendar.")}
          onRetry={() => monthQuery.refetch()}
        />
      ) : patroView === "panchanga" ? (
        <PanchangaMonthGrid
          days={gridDays}
          year={year}
          month={month}
          todayAd={todayAd}
          selectedAd={selectedDay?.date_ad ?? (viewingCurrentBsMonth ? todayAd : undefined)}
          loading={monthQuery.isFetching && !!monthQuery.data}
          onPickDay={(day) => {
            setSelectedDay(day);
            router.push({ pathname: "/panchanga", params: { date: day.date_ad } });
          }}
        />
      ) : (
        <BsCalendarGrid
          days={gridDays}
          selectedAd={selectedDay?.date_ad ?? (viewingCurrentBsMonth ? todayAd : undefined)}
          todayAd={todayAd}
          publicHolidayDates={publicHolidayDates}
          onSelectDay={(day) => {
            if (day.outsideMonth) return;
            setSelectedDay((prev) => (prev?.date_ad === day.date_ad ? null : day));
          }}
          isEnriching={monthQuery.isFetching && !!monthQuery.data}
        />
      )}
    </View>
  );

  const asideBlock = (
    <View
      style={
        splitAside
          ? { width: 360, maxWidth: "38%" }
          : { width: "100%", maxWidth: ASIDE_MAX_WIDTH, alignSelf: "center" }
      }
      className={splitAside ? "min-w-0 flex-1" : "min-w-0 w-full self-center"}
    >
      <PanchangaAsidePanel
        month={month}
        year={year}
        selectedAd={asideAdDate}
        todayAd={todayAd}
        selectedDay={selectedDay}
        contextDays={monthDays}
        p={panchangaQ.data}
        loading={panchangaQ.isLoading}
        error={panchangaQ.isError}
        onRetry={() => panchangaQ.refetch()}
        saitData={saitQ.data}
        saitLoading={saitQ.isPending}
        saitError={saitQ.isError}
        onSaitRetry={() => saitQ.refetch()}
        location={location.params}
      />
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="mx-auto w-full max-w-[1400px] px-4 pt-4 md:px-6"
      contentContainerStyle={{ paddingBottom: floatingNavBottomPadding(isTablet) }}
    >
      <View className={splitAside ? "flex-row items-start gap-5" : "gap-5"}>
        {calendarBlock}
        {asideBlock}
      </View>

      <Text className="mt-7 text-center text-sm text-muted-foreground">
        {pick(
          "वैदिक पात्रो · नेपाल पञ्चाङ्ग · गणना स्थान: काठमाडौं",
          "Powered by Vedic Patro · Nepal Panchanga · Default location Kathmandu",
        )}
      </Text>
    </ScrollView>
  );
}
