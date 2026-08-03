import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useQueries, useQuery } from "@tanstack/react-query";
import { BsMonthHeaderTitle } from "@/components/home/BsMonthHeaderTitle";
import { BsCalendarGrid } from "@/components/home/BsCalendarGrid";
import { PanchangaAsidePanel } from "@/components/home/PanchangaAsidePanel";
import { PanchangaMonthGrid } from "@/components/home/PanchangaMonthGrid";
import { type HomePatroView } from "@/components/home/PatroViewToggle";
import { VedicPatroLoader } from "@/components/branding/VedicPatroLoader";
import { ErrorState } from "@/components/ui/States";
import {
  apiKeys,
  fetchFestivals,
  fetchMonthCalendar,
  fetchPanchanga,
  fetchSaitMonthAll,
  type CalendarDay,
  type Festival,
  type MonthBrowseEra,
} from "@/lib/api";
import {
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  bsToAD,
  getBSMonthLength,
  getCurrentBs,
  shiftBsMonth,
  todayAdString,
} from "@/lib/bs-calendar";
import {
  applyHolidaysToDays,
  buildCalendarGridDays,
  buildLocalMonthDays,
  mergeEnrichedDays,
} from "@/lib/local-calendar";
import { useLocale } from "@/lib/i18n";
import { floatingNavBottomPadding, PAGE_HORIZONTAL_PADDING } from "@/lib/mobile-nav";
import { useBreakpoint } from "@/lib/responsive";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";

const ASIDE_SIDEBAR_SPLIT = 1280;
const ASIDE_WIDTH = 360;
const ASIDE_MAX_WIDTH = 400;

function monthStartAd(ctx: { year: number; month: number; days: CalendarDay[] }): string {
  const first = ctx.days.find((d) => d.day === 1) ?? ctx.days[0];
  return first?.date_ad ?? todayAdString();
}

function mergeMonthFromApi(
  year: number,
  month: number,
  calendar: CalendarDay[] | undefined,
  lang: string,
  festivals: Festival[] | undefined,
) {
  const local = buildLocalMonthDays(year, month);
  let merged = calendar?.length ? mergeEnrichedDays(local, calendar) : local;
  if (festivals?.length) merged = applyHolidaysToDays(merged, festivals, lang);
  return merged;
}

export default function HomeScreen() {
  const { pick, digits, lang } = useLocale();
  const { width, isTablet } = useBreakpoint();
  const { location, setLocation } = usePanchangaLocation();
  const initial = getCurrentBs();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [browseEra, setBrowseEra] = useState<MonthBrowseEra>("bs");
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [patroView, setPatroView] = useState<HomePatroView>("calendar");
  const scrollRef = useRef<ScrollView | null>(null);
  const [asideOffsetY, setAsideOffsetY] = useState(0);
  const todayAd = todayAdString();
  const splitAside = width >= ASIDE_SIDEBAR_SPLIT;

  const prevBm = useMemo(() => shiftBsMonth(year, month, -1), [year, month]);
  const nextBm = useMemo(() => shiftBsMonth(year, month, 1), [year, month]);
  const canFetchPrev = !(month === 1 && year <= BS_SUPPORTED_START_YEAR);
  const canFetchNext = !(month === 12 && year >= BS_SUPPORTED_END_YEAR);

  const handleSelectDay = useCallback((day: CalendarDay) => {
    if (day.outsideMonth) return;
    setSelectedDay(day);
  }, []);

  useEffect(() => {
    if (!selectedDay || splitAside || asideOffsetY <= 0) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, asideOffsetY - 72), animated: true });
  }, [selectedDay, splitAside, asideOffsetY]);

  const monthQueries = useQueries({
    queries: [
      {
        queryKey: apiKeys.month(prevBm.year, prevBm.month, location.params, browseEra),
        queryFn: () => fetchMonthCalendar(prevBm.year, prevBm.month, location.params, { era: browseEra }),
        staleTime: 1000 * 60 * 60,
        enabled: canFetchPrev,
      },
      {
        queryKey: apiKeys.month(year, month, location.params, browseEra),
        queryFn: () => fetchMonthCalendar(year, month, location.params, { era: browseEra }),
        staleTime: 1000 * 60 * 60,
      },
      {
        queryKey: apiKeys.month(nextBm.year, nextBm.month, location.params, browseEra),
        queryFn: () => fetchMonthCalendar(nextBm.year, nextBm.month, location.params, { era: browseEra }),
        staleTime: 1000 * 60 * 60,
        enabled: canFetchNext,
      },
    ],
  });

  const [prevQ, currentQ, nextQ] = monthQueries;

  const festivalYears = useMemo(() => {
    const years = new Set<number>([year, prevBm.year, nextBm.year]);
    return [...years].filter((y) => y >= 60 && y <= BS_SUPPORTED_END_YEAR);
  }, [year, prevBm.year, nextBm.year]);

  const festivalQueries = useQuery({
    queryKey: ["festivals-home", ...festivalYears, lang],
    queryFn: async () => {
      const lists = await Promise.all(festivalYears.map((y) => fetchFestivals(y, lang === "en" ? "en" : "ne")));
      const byKey = new Map<string, (typeof lists)[0]["festivals"][0]>();
      for (const res of lists) {
        for (const f of res.festivals ?? []) {
          if (f.start_date) byKey.set(`${f.id}:${f.start_date}`, f);
        }
      }
      return [...byKey.values()];
    },
    staleTime: 1000 * 60 * 60,
  });

  const yearFestivals = festivalQueries.data;

  const crossEraSubtitle = useMemo(() => {
    const start = bsToAD(year, month, 1);
    const end = bsToAD(year, month, getBSMonthLength(year, month));
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const yl = (y: number) => (lang === "en" ? String(y) : digits(y));
    if (startMonth === endMonth && startYear === endYear) return `${startMonth} ${yl(startYear)}`;
    if (startYear === endYear) return `${startMonth}/${endMonth} ${yl(startYear)}`;
    return `${startMonth} ${yl(startYear)}/${endMonth} ${yl(endYear)}`;
  }, [year, month, lang, digits]);

  const monthDays = useMemo(
    () =>
      mergeMonthFromApi(year, month, currentQ.data?.calendar, lang, yearFestivals),
    [year, month, currentQ.data?.calendar, lang, yearFestivals],
  );

  const gridDays = useMemo(() => {
    let grid = buildCalendarGridDays(year, month, {
      prev: prevQ.data?.calendar,
      current: currentQ.data?.calendar,
      next: nextQ.data?.calendar,
    });
    if (yearFestivals?.length) grid = applyHolidaysToDays(grid, yearFestivals, lang);
    return grid;
  }, [year, month, prevQ.data?.calendar, currentQ.data?.calendar, nextQ.data?.calendar, yearFestivals, lang]);

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

  const monthLoading = currentQ.isLoading && !currentQ.data;
  const monthError = currentQ.isError;
  const monthFetching = monthQueries.some((q) => q.isFetching && q.data);

  const calendarBlock = (
    <View className="min-w-0 flex-1">
      <BsMonthHeaderTitle
        year={year}
        month={month}
        browseEra={browseEra}
        onBrowseEraChange={setBrowseEra}
        onPrev={() => goMonth(-1)}
        onNext={() => goMonth(1)}
        onToday={goToday}
        crossEraSubtitle={crossEraSubtitle}
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

      {monthLoading ? (
        <View className="py-16">
          <VedicPatroLoader />
        </View>
      ) : monthError ? (
        <ErrorState
          message={pick("पात्रो लोड गर्न सकिएन।", "Could not load calendar.")}
          onRetry={() => currentQ.refetch()}
        />
      ) : patroView === "panchanga" ? (
        <PanchangaMonthGrid
          days={gridDays}
          year={year}
          month={month}
          todayAd={todayAd}
          selectedAd={selectedDay?.date_ad ?? (viewingCurrentBsMonth ? todayAd : undefined)}
          loading={monthFetching}
          onPickDay={handleSelectDay}
        />
      ) : (
        <BsCalendarGrid
          days={gridDays}
          selectedAd={selectedDay?.date_ad ?? (viewingCurrentBsMonth ? todayAd : undefined)}
          todayAd={todayAd}
          publicHolidayDates={publicHolidayDates}
          onSelectDay={handleSelectDay}
          isEnriching={monthFetching}
        />
      )}
    </View>
  );

  const asideBlock = (
    <View
      style={
        splitAside
          ? {
              width: ASIDE_WIDTH,
              maxWidth: ASIDE_MAX_WIDTH,
              flexGrow: 0,
              flexShrink: 0,
              alignSelf: "flex-start",
            }
          : {
              width: "100%",
              alignSelf: "stretch",
            }
      }
      className="min-w-0 w-full"
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
      ref={scrollRef}
      className="flex-1 bg-background"
      contentContainerClassName="mx-auto w-full max-w-[1400px] pt-4"
      contentContainerStyle={{
        paddingBottom: floatingNavBottomPadding(isTablet),
        paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      }}
    >
      <View className={splitAside ? "flex-row items-start gap-5" : "gap-5"}>
        {calendarBlock}
        <View onLayout={(e) => setAsideOffsetY(e.nativeEvent.layout.y)}>{asideBlock}</View>
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
