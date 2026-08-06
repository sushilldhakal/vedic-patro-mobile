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

export function getMonthDayYoga(day: CalendarDay, lang: Lang): string {
  const ne = day.yoga_ne ?? day.yoga ?? "—";
  const en = day.yoga ?? day.yoga_ne ?? "—";
  return (lang === "en" ? en : ne) ?? en ?? ne;
}

export function getMonthDayKarana(day: CalendarDay, lang: Lang): string {
  const ne = day.karana_ne ?? day.karana ?? "—";
  const en = day.karana ?? day.karana_ne ?? "—";
  return (lang === "en" ? en : ne) ?? en ?? ne;
}
