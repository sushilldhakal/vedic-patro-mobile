import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { PanchangaWheel } from "@/components/panchanga/PanchangaWheel";
import { PatroDateSheet } from "@/components/patro-date/PatroDateSheet";
import { usePatroDateSheet } from "@/components/patro-date/use-patro-date-sheet";
import { Text } from "@/components/ui/Text";
import {
  defaultClockForTimezone,
  usePanchangaClock,
} from "@/components/panchanga/use-panchanga-mode";
import { fetchYearWheelCalendar, locationCacheKey, yearWheelKeys } from "@/lib/api";
import {
  adToBS,
  bsToAD,
  BS_MONTHS_NE,
  BS_MONTH_NAMES,
  getBSMonthLength,
} from "@/lib/bs-calendar";
import { formatTimeShort, getSunrise } from "@/lib/panchanga-format";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import {
  buildYearWheelDays,
  sliceWheelWindow,
  wheelWindowBounds,
  yearWheelIndexOfAdDate,
} from "@/lib/panchanga-year-wheel";
import { useBreakpoint } from "@/lib/responsive";
import { displayLocationLabel, usePanchangaLocation } from "@/lib/use-panchanga-location";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";

/** Slowest tick; the scrub's speed multiplier divides into it. */
const PLAY_BASE_MS = 900;
const MAX_PLAY_SPEED = 8;

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

/**
 * Panchanga wheel over a moving two-month window — header matches daily `/panchanga`.
 *
 * The date chrome picks the centre (Shrawan 17 opens Ashar 17 → Bhadra 17) and
 * playback walks that window a day at a time, so a tithi's drift against the
 * nakshatras is something you watch rather than infer.
 */
export default function PanchangaYearScreen() {
  const { pick, digits } = useLocale();
  const { isCompact } = useBreakpoint();
  const { location, setLocation, ready } = usePanchangaLocation();

  const [date, setDate] = useState(() => new Date());
  /* The window's centre, moved only by a date the user picks. `date` itself
     follows playback, so centring on it would make the window chase the needle. */
  const [anchor, setAnchor] = useState(() => new Date());
  const adDateStr = toAdStr(date);
  const bsYear = adToBS(date).year;

  const tz = resolveTimeZone(undefined, location.params.timezone);
  const todayAd = todayAdStringInTimezone(new Date(), tz);
  const isToday = adDateStr === todayAd;

  const { clock, setClock } = usePanchangaClock(tz);
  const [clockUserAdjusted, setClockUserAdjusted] = useState(false);
  const clockSyncedKeyRef = useRef<string | null>(null);

  const [dayIndex, setDayIndex] = useState(1);
  const [play, setPlay] = useState<{ dir: -1 | 0 | 1; speed: number }>({ dir: 0, speed: 1 });

  const bounds = useMemo(() => wheelWindowBounds(anchor), [anchor]);

  /* Days still come from the bulk year payload — ~5 KB a day against the month
     endpoint's ~55 KB — and get sliced down to the window. A window straddling
     Chaitra pulls the next year too; both are cached for the session. */
  const yearQueries = useQueries({
    queries: bounds.years.map((y) => ({
      queryKey: yearWheelKeys.year(y, location.params),
      queryFn: () => fetchYearWheelCalendar(y, location.params),
      enabled: ready,
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: 1000 * 60 * 60,
      placeholderData: keepPreviousData,
    })),
  });

  const windowLoading = yearQueries.some((q) => q.isLoading);
  const windowFetching = yearQueries.some((q) => q.isFetching);
  const windowError = yearQueries.some((q) => q.isError);
  const yearsStamp = yearQueries.map((q) => q.dataUpdatedAt).join("|");

  const days = useMemo(() => {
    const all = yearQueries
      .flatMap((q) => buildYearWheelDays(q.data))
      .sort((a, b) => a.dateAd.localeCompare(b.dateAd));
    return sliceWheelWindow(all, bounds);
    // yearsStamp stands in for the query data itself, which is a new array each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearsStamp, bounds]);
  const total = days.length;

  const landedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!total) return;
    const key = `${bounds.startAd}|${bounds.endAd}`;
    if (landedRef.current === key) return;
    landedRef.current = key;
    setDayIndex(yearWheelIndexOfAdDate(days, toAdStr(anchor)) ?? 1);
  }, [anchor, bounds, days, total]);

  const clamped = total ? Math.min(Math.max(1, dayIndex), total) : 1;
  const current = days[clamped - 1];
  const wheelData = current?.p;

  const scrubbingRef = useRef(false);
  useEffect(() => {
    if (scrubbingRef.current || !current?.dateAd) return;
    if (current.dateAd === adDateStr) return;
    setDate(parseAdStr(current.dateAd));
  }, [current?.dateAd, adDateStr]);

  useEffect(() => {
    if (play.dir === 0 || !total) return;
    const tick = Math.max(70, Math.round(PLAY_BASE_MS / play.speed));
    const id = setInterval(() => {
      setDayIndex((d) => {
        const cur = Math.min(Math.max(1, d), total);
        if (play.dir === 1) return cur >= total ? 1 : cur + 1;
        return cur <= 1 ? total : cur - 1;
      });
    }, tick);
    return () => clearInterval(id);
  }, [play, total]);

  const pausePlay = useCallback(() => setPlay({ dir: 0, speed: 1 }), []);

  const stepForward = useCallback(() => {
    setPlay((p) =>
      p.dir === 1 ? { dir: 1, speed: Math.min(p.speed * 2, MAX_PLAY_SPEED) } : { dir: 1, speed: 1 },
    );
  }, []);
  const stepBackward = useCallback(() => {
    setPlay((p) =>
      p.dir === -1
        ? { dir: -1, speed: Math.min(p.speed * 2, MAX_PLAY_SPEED) }
        : { dir: -1, speed: 1 },
    );
  }, []);

  /* A date from the header or the fullscreen picker re-centres the window on it;
     the landing effect then puts the needle on that day. */
  const handleDateChange = useCallback(
    (d: Date) => {
      pausePlay();
      scrubbingRef.current = false;
      setDate(d);
      setAnchor(d);
      const idx = yearWheelIndexOfAdDate(days, toAdStr(d));
      if (idx != null) setDayIndex(idx);
    },
    [days, pausePlay],
  );

  const handleClockChange = useCallback(
    (next: string) => {
      setClockUserAdjusted(true);
      setClock(next);
    },
    [setClock],
  );

  useEffect(() => {
    setClockUserAdjusted(false);
  }, [adDateStr]);

  useEffect(() => {
    const syncKey = `${adDateStr}|${locationCacheKey(location.params)}`;
    if (clockSyncedKeyRef.current === syncKey) return;
    if (clockUserAdjusted) return;

    if (isToday) {
      clockSyncedKeyRef.current = syncKey;
      setClock(defaultClockForTimezone(tz));
      return;
    }

    const sunriseClock = formatTimeShort(wheelData ? getSunrise(wheelData) : undefined);
    if (!sunriseClock) return;
    clockSyncedKeyRef.current = syncKey;
    setClock(sunriseClock);
  }, [adDateStr, location.params, isToday, tz, clockUserAdjusted, wheelData, setClock]);

  const monthNe = current ? (BS_MONTHS_NE[current.bsMonth - 1] ?? "") : "";
  const locationLabel = displayLocationLabel(location, current?.p?.location?.name);

  const dateSheet = usePatroDateSheet();
  const monthOptions = useMemo(
    () =>
      BS_MONTHS_NE.map((ne, i) => ({
        value: i + 1,
        label: pick(ne, BS_MONTH_NAMES[i] ?? ne),
      })),
    [pick],
  );

  /* Lives inside the wheel's fullscreen modal — a sheet mounted out here would
     open behind it, and leaving fullscreen to pick a date is what the wheel's
     calendar button exists to avoid. */
  const fullscreenDateSheet = (
    <PatroDateSheet
      sheet={dateSheet}
      mode="year-month-time"
      era="bs"
      year={current?.bsYear ?? bsYear}
      month={current?.bsMonth ?? 1}
      day={current?.bsDay ?? 1}
      clock={clock}
      monthOptions={monthOptions}
      todayAd={todayAd}
      showTime
      location={location}
      onLocationChange={setLocation}
      onCommit={(draft) => {
        const day = Math.min(draft.day, getBSMonthLength(draft.year, draft.month));
        handleDateChange(bsToAD(draft.year, draft.month, day));
        handleClockChange(draft.clock);
      }}
    />
  );

  const windowLabel = useMemo(() => {
    const from = adToBS(parseAdStr(bounds.startAd));
    const to = adToBS(parseAdStr(bounds.endAd));
    const name = (m: number) => pick(BS_MONTHS_NE[m - 1] ?? "", BS_MONTH_NAMES[m - 1] ?? "");
    return `${name(from.month)} ${digits(from.day)} — ${name(to.month)} ${digits(to.day)}`;
  }, [bounds, pick, digits]);

  const headerToolbar = !isCompact ? (
    <LocationSelector
      location={location}
      onLocationChange={setLocation}
      className="max-w-[8rem]"
    />
  ) : undefined;

  return (
    <AppShell title="" showHeader={false}>
      <PanchangaDateNav
        date={date}
        onDateChange={handleDateChange}
        todayAd={todayAd}
        adDateStr={adDateStr}
        wheelData={wheelData}
        clock={clock}
        onClockChange={handleClockChange}
        location={location}
        onLocationChange={setLocation}
        toolbar={headerToolbar}
        hideNavLocation={!isCompact}
      />

      <View className="gap-3">
        <PanchangaWheel
          p={current?.p}
          loading={windowLoading || !current}
          bsYear={bsYear}
          bsMonthNe={monthNe || BS_MONTHS_NE[0]!}
          bsDay={current?.bsDay ?? 1}
          isToday={current?.dateAd === todayAd}
          timezone={tz}
          locationLabel={locationLabel}
          clock={clock}
          onOpenDatePicker={dateSheet.openDate}
          fullscreenOverlay={fullscreenDateSheet}
          yearScrub={{
            day: clamped,
            totalDays: total || 1,
            direction: play.dir,
            speed: play.speed,
            onForward: stepForward,
            onBackward: stepBackward,
            onPause: pausePlay,
            onDayChange: (d) => {
              pausePlay();
              scrubbingRef.current = true;
              setDayIndex(d);
              const row = days[d - 1];
              if (row?.dateAd) setDate(parseAdStr(row.dateAd));
              requestAnimationFrame(() => {
                scrubbingRef.current = false;
              });
            },
            onJumpDay: (d) => {
              pausePlay();
              scrubbingRef.current = true;
              setDayIndex(d);
              const row = days[d - 1];
              if (row?.dateAd) setDate(parseAdStr(row.dateAd));
              requestAnimationFrame(() => {
                scrubbingRef.current = false;
              });
            },
            onScrubStart: () => {
              pausePlay();
              scrubbingRef.current = true;
            },
            onScrubEnd: () => {
              scrubbingRef.current = false;
            },
          }}
        />

        {windowError ? (
          <View className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
            <Text className="text-sm text-destructive" style={nepaliTextStyle(13)}>
              {pick("पञ्चाङ्ग लोड गर्न सकिएन।", "Could not load the panchanga.")}
            </Text>
          </View>
        ) : windowFetching ? (
          <Text className="px-1 text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
            {pick("लोड हुँदै…", "Loading…")}
          </Text>
        ) : total ? (
          <Text className="px-1 text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
            {windowLabel} · {pick(`${digits(total)} दिन`, `${total} days`)}
          </Text>
        ) : null}
      </View>
    </AppShell>
  );
}
