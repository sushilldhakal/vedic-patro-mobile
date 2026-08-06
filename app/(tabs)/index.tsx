import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
  todayAdString,
} from "@/lib/bs-calendar";
import {
  applyHolidaysToDays,
  buildAdCalendarGridDays,
  buildCalendarGridDays,
  buildLocalAdMonthDays,
  buildLocalMonthDays,
  getBsMonthsOverlappingAdMonth,
  mergeEnrichedDays,
} from "@/lib/local-calendar";
import { useLocale } from "@/lib/i18n";
import { floatingNavBottomPadding, homeContentInset } from "@/lib/mobile-nav";
import { formatPatroMonthCrossEraSubtitle } from "@/lib/patro-headline-subtitle";
import { isGregorianBrowseEra } from "@/lib/patro-era";
import { shiftPatroBrowseMonth } from "@/lib/patro-year-browse-step";
import { usePatroMonthBrowse } from "@/lib/use-patro-month-browse";
import { useBreakpoint } from "@/lib/responsive";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useThemeColors } from "@/lib/theme-context";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";

const ASIDE_SIDEBAR_SPLIT = 1280;
const ASIDE_WIDTH = 360;
const ASIDE_MAX_WIDTH = 400;

function monthStartAd(ctx: { year: number; month: number; days: CalendarDay[] }): string {
  const first = ctx.days.find((d) => d.day === 1) ?? ctx.days[0];
  return first?.date_ad ?? todayAdString();
}

function mergeMonthFromApi(
  era: MonthBrowseEra,
  year: number,
  month: number,
  calendar: CalendarDay[] | undefined,
  lang: string,
  festivals: Festival[] | undefined,
) {
  const local = isGregorianBrowseEra(era)
    ? buildLocalAdMonthDays(year, month)
    : buildLocalMonthDays(year, month);
  let merged = calendar?.length ? mergeEnrichedDays(local, calendar) : local;
  if (festivals?.length) merged = applyHolidaysToDays(merged, festivals, lang);
  return merged;
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { pick, digits, lang } = useLocale();
  const { width, isTablet, isPhone } = useBreakpoint();
  const { location, setLocation } = usePanchangaLocation();
  const {
    era: browseEra,
    year,
    month,
    setYear,
    setEra: setBrowseEra,
    setMonth,
    stepMonth,
    goToday: goTodayBrowse,
  } = usePatroMonthBrowse();
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [patroView, setPatroView] = useState<HomePatroView>("calendar");
  const scrollRef = useRef<ScrollView | null>(null);
  const [asideOffsetY, setAsideOffsetY] = useState(0);
  const todayAd = todayAdString();
  const splitAside = width >= ASIDE_SIDEBAR_SPLIT;

  const prevBm = useMemo(
    () => shiftPatroBrowseMonth(browseEra, year, month, -1),
    [browseEra, year, month],
  );
  const nextBm = useMemo(
    () => shiftPatroBrowseMonth(browseEra, year, month, 1),
    [browseEra, year, month],
  );
  const canFetchPrev = isGregorianBrowseEra(browseEra)
    ? !(year === 1 && month === 1)
    : !(month === 1 && year <= BS_SUPPORTED_START_YEAR);
  const canFetchNext = isGregorianBrowseEra(browseEra)
    ? true
    : !(month === 12 && year >= BS_SUPPORTED_END_YEAR);

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
    if (isGregorianBrowseEra(browseEra)) {
      const overlapping = getBsMonthsOverlappingAdMonth(year, month);
      const years = new Set(overlapping.map((m) => m.year));
      years.add(adToBS(new Date(`${todayAd}T12:00:00`)).year);
      return [...years].filter((y) => y >= 60 && y <= BS_SUPPORTED_END_YEAR);
    }
    const years = new Set<number>([year, prevBm.year, nextBm.year]);
    return [...years].filter((y) => y >= 60 && y <= BS_SUPPORTED_END_YEAR);
  }, [browseEra, year, month, prevBm.year, nextBm.year, todayAd]);

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

  const crossEraSubtitle = useMemo(
    () => formatPatroMonthCrossEraSubtitle(browseEra, year, month, lang, digits),
    [browseEra, year, month, lang, digits],
  );

  const monthDays = useMemo(
    () =>
      mergeMonthFromApi(browseEra, year, month, currentQ.data?.calendar, lang, yearFestivals),
    [browseEra, year, month, currentQ.data?.calendar, lang, yearFestivals],
  );

  const gridDays = useMemo(() => {
    const enriched = {
      prev: prevQ.data?.calendar,
      current: currentQ.data?.calendar,
      next: nextQ.data?.calendar,
    };
    if (isGregorianBrowseEra(browseEra)) {
      let grid = buildAdCalendarGridDays(year, month, enriched);
      if (yearFestivals?.length) grid = applyHolidaysToDays(grid, yearFestivals, lang);
      return grid;
    }
    let grid = buildCalendarGridDays(year, month, enriched);
    if (yearFestivals?.length) grid = applyHolidaysToDays(grid, yearFestivals, lang);
    return grid;
  }, [
    browseEra,
    year,
    month,
    prevQ.data?.calendar,
    currentQ.data?.calendar,
    nextQ.data?.calendar,
    yearFestivals,
    lang,
  ]);

  const viewingCurrentMonth = useMemo(() => {
    if (isGregorianBrowseEra(browseEra)) {
      const d = new Date(`${todayAd}T12:00:00`);
      return year === d.getFullYear() && month === d.getMonth() + 1;
    }
    const todayBs = adToBS(new Date(`${todayAd}T12:00:00`));
    return year === todayBs.year && month === todayBs.month;
  }, [browseEra, year, month, todayAd]);

  const asideAdDate = useMemo(() => {
    if (selectedDay?.date_ad) return selectedDay.date_ad;
    if (viewingCurrentMonth) return todayAd;
    return monthStartAd({ year, month, days: monthDays });
  }, [selectedDay, viewingCurrentMonth, todayAd, year, month, monthDays]);

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
      stepMonth(delta);
      setSelectedDay(null);
    },
    [stepMonth],
  );

  const goToday = () => {
    goTodayBrowse(todayAd);
    setSelectedDay(null);
  };

  const monthLoading = currentQ.isLoading && !currentQ.data;
  const monthError = currentQ.isError;
  const monthFetching = monthQueries.some((q) => q.isFetching && q.data);

  const contentInset = homeContentInset(isPhone);

  const monthHeaderBlock = (
    <View style={{ paddingHorizontal: contentInset }}>
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
        prevDisabled={!canFetchPrev}
        nextDisabled={!canFetchNext}
        patroView={patroView}
        onPatroViewChange={(v) => {
          setPatroView(v);
          setSelectedDay(null);
        }}
        location={location}
        onLocationChange={setLocation}
      />

      <Pressable
        onPress={() => router.push("/aakash-gochar")}
        className="mb-3 flex-row items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel={pick("३D आकाश गोचर", "3D Aakash Gochar")}
      >
        <Ionicons name="planet-outline" size={20} color={colors.secondary} />
        <Text className="flex-1 text-sm font-medium text-foreground" style={nepaliTextStyle(14)}>
          {pick("३D आकाश गोचर", "3D Aakash Gochar")}
        </Text>
        <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
          {pick("भूकेन्द्रित", "Geocentric")}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );

  const calendarBlock = (
    <View className="min-w-0 flex-1">
      {monthHeaderBlock}

      {monthLoading ? (
        <View className="py-16" style={{ paddingHorizontal: contentInset }}>
          <VedicPatroLoader />
        </View>
      ) : monthError ? (
        <View style={{ paddingHorizontal: contentInset }}>
          <ErrorState
            message={pick("पात्रो लोड गर्न सकिएन।", "Could not load calendar.")}
            onRetry={() => currentQ.refetch()}
          />
        </View>
      ) : patroView === "panchanga" ? (
        <PanchangaMonthGrid
          days={gridDays}
          year={year}
          month={month}
          todayAd={todayAd}
          selectedAd={selectedDay?.date_ad ?? (viewingCurrentMonth ? todayAd : undefined)}
          loading={monthFetching}
          onPickDay={handleSelectDay}
          edgeToEdge={isPhone}
        />
      ) : (
        <BsCalendarGrid
          days={gridDays}
          selectedAd={selectedDay?.date_ad ?? (viewingCurrentMonth ? todayAd : undefined)}
          todayAd={todayAd}
          publicHolidayDates={publicHolidayDates}
          onSelectDay={handleSelectDay}
          isEnriching={monthFetching}
          primaryDate={isGregorianBrowseEra(browseEra) ? "ad" : "bs"}
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
              paddingHorizontal: contentInset,
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
        browseEra={browseEra}
      />
    </View>
  );

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1 bg-background"
      contentContainerClassName="mx-auto w-full max-w-[1400px]"
      contentContainerStyle={{
        paddingBottom: floatingNavBottomPadding(isTablet),
        paddingHorizontal: isPhone ? 0 : contentInset,
        paddingTop: isPhone ? 12 : 16,
      }}
    >
      <View className={splitAside ? "flex-row items-start gap-5" : "gap-5"}>
        {calendarBlock}
        <View onLayout={(e) => setAsideOffsetY(e.nativeEvent.layout.y)}>{asideBlock}</View>
      </View>

      <Text
        className="mt-7 text-center text-sm text-muted-foreground"
        style={{ paddingHorizontal: contentInset }}
      >
        {pick(
          "वैदिक पात्रो · नेपाल पञ्चाङ्ग · गणना स्थान: काठमाडौं",
          "Powered by Vedic Patro · Nepal Panchanga · Default location Kathmandu",
        )}
      </Text>
    </ScrollView>
  );
}
