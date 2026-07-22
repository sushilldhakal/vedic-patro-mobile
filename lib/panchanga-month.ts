import type { CalendarDay } from "@/lib/api";

type Lang = "ne" | "en";

export function getMonthDayChandraRashi(day: CalendarDay, lang: Lang): string | undefined {
  const moon = day.panchanga?.planets?.moon;
  const ne =
    day.chandra_rashi_ne ??
    day.panchanga?.chandra_rashi_ne ??
    moon?.rashi_ne ??
    day.chandra_rashi ??
    day.panchanga?.chandra_rashi ??
    moon?.rashi;
  const en =
    day.chandra_rashi ??
    day.panchanga?.chandra_rashi ??
    moon?.rashi ??
    day.chandra_rashi_ne ??
    day.panchanga?.chandra_rashi_ne ??
    moon?.rashi_ne;
  return (lang === "en" ? en : ne) ?? en ?? ne;
}

export function getMonthDayNakshatra(day: CalendarDay, lang: Lang): string | undefined {
  const ne =
    day.nakshatra_ne ??
    day.panchanga?.nakshatra?.name_ne ??
    day.nakshatra ??
    day.panchanga?.nakshatra?.name;
  const en =
    day.nakshatra ??
    day.panchanga?.nakshatra?.name ??
    day.nakshatra_ne ??
    day.panchanga?.nakshatra?.name_ne;
  return (lang === "en" ? en : ne) ?? en ?? ne;
}

/** First udaya lagna rashi at sunrise — shown in panchanga patro cells on web-adjacent layouts. */
export function getMonthDayUdayaLagna(day: CalendarDay, lang: Lang): string | undefined {
  const rows = day.panchanga?.udaya_lagna ?? day.panchanga?.lagna_spans;
  const first = rows?.[0];
  if (!first) return undefined;
  const ne = first.rashi_ne ?? first.name_ne;
  const en = first.rashi ?? first.name_en;
  return (lang === "en" ? en : ne) ?? en ?? ne;
}
