import type { CalendarDay } from "./api";
import {
  BS_MONTHS_NE,
  bsToAD,
  getBSMonthLength,
  shiftBsMonth,
} from "./bs-calendar";

const WEEKDAYS_NE = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"] as const;
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function formatAdIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildLocalMonthDays(year: number, month: number): CalendarDay[] {
  const monthLength = getBSMonthLength(year, month);
  const days: CalendarDay[] = [];
  for (let day = 1; day <= monthLength; day += 1) {
    const adDate = bsToAD(year, month, day);
    const weekdayIdx = adDate.getDay();
    days.push({
      day,
      date_ad: formatAdIso(adDate),
      weekday: WEEKDAYS_NE[weekdayIdx],
      weekday_en: WEEKDAYS_EN[weekdayIdx],
      weekday_ne: WEEKDAYS_NE[weekdayIdx],
      tithi: "",
      festivals: [],
    });
  }
  return days;
}

export function buildCalendarGridDays(
  year: number,
  month: number,
  enriched?: CalendarDay[],
): CalendarDay[] {
  const current = buildLocalMonthDays(year, month);
  const byAd = new Map(enriched?.map((d) => [d.date_ad, d]) ?? []);
  const merged = current.map((d) => ({ ...d, ...byAd.get(d.date_ad) }));

  const firstWeekday = bsToAD(year, month, 1).getDay();
  const grid: CalendarDay[] = [];

  const prev = shiftBsMonth(year, month, -1);
  const prevLen = getBSMonthLength(prev.year, prev.month);
  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const day = prevLen - i;
    const adDate = bsToAD(prev.year, prev.month, day);
    grid.push({
      day,
      date_ad: formatAdIso(adDate),
      weekday: WEEKDAYS_NE[adDate.getDay()],
      tithi: "",
      festivals: [],
      outsideMonth: true,
    });
  }

  grid.push(...merged);

  while (grid.length % 7 !== 0) {
    const nextDayNum = grid.length - firstWeekday - merged.length + 1;
    const next = shiftBsMonth(year, month, 1);
    const adDate = bsToAD(next.year, next.month, nextDayNum);
    grid.push({
      day: nextDayNum,
      date_ad: formatAdIso(adDate),
      weekday: WEEKDAYS_NE[adDate.getDay()],
      tithi: "",
      festivals: [],
      outsideMonth: true,
    });
  }

  while (grid.length < 42) {
    const idx = grid.length - firstWeekday - merged.length + 1;
    const next = shiftBsMonth(year, month, 1);
    const adDate = bsToAD(next.year, next.month, idx);
    grid.push({
      day: idx,
      date_ad: formatAdIso(adDate),
      weekday: WEEKDAYS_NE[adDate.getDay()],
      tithi: "",
      festivals: [],
      outsideMonth: true,
    });
  }

  return grid;
}

export function mergeEnrichedDays(local: CalendarDay[], enriched: CalendarDay[]): CalendarDay[] {
  const byAd = new Map(enriched.map((d) => [d.date_ad, d]));
  return local.map((d) => ({ ...d, ...byAd.get(d.date_ad) }));
}
