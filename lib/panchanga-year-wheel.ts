/**
 * The BS year flattened into an ordered list of days, so the year wheel can be
 * driven by a single index.
 *
 * Everything the scrub needs — which day, which month, which AD date, and the
 * wheel state itself — comes from the one bulk response, so playing through a
 * year is pure local indexing rather than 365 fetches.
 */

import type { PanchangaDay, YearWheelCalendar } from "@/lib/api";
import { adToBS, bsToAD, getBSMonthLength, shiftBsMonth } from "@/lib/bs-calendar";

export interface YearWheelDay {
  /** 1-based position in the year — what the scrub slider carries. */
  index: number;
  dateAd: string;
  bsYear: number;
  bsMonth: number;
  bsDay: number;
  /** Absent only if the payload skipped this day; the wheel shows its skeleton. */
  p?: PanchangaDay;
}

/** "2083-01-01" → { year: 2083, month: 1, day: 1 }; null on anything else. */
function parseBsDate(value?: string): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m, day: d };
}

export function buildYearWheelDays(payload?: YearWheelCalendar): YearWheelDay[] {
  if (!payload?.calendar?.length) return [];

  /* The calendar is in order, so walking the month lengths alongside it gives
     every day its BS month even when a row carries no date_bs of its own. */
  const months = [...(payload.months ?? [])].sort((a, b) => a.month_bs - b.month_bs);
  let monthIdx = 0;
  let dayInMonth = 0;

  return payload.calendar.map((row, i) => {
    dayInMonth += 1;
    const seg = months[monthIdx];
    if (seg && dayInMonth > seg.month_length) {
      monthIdx += 1;
      dayInMonth = 1;
    }

    const parsed = parseBsDate(row.panchanga?.date_bs);
    const walked = months[monthIdx];

    return {
      index: i + 1,
      dateAd: row.date_ad ?? row.panchanga?.date_ad ?? "",
      bsYear: parsed?.year ?? payload.year_bs,
      bsMonth: parsed?.month ?? walked?.month_bs ?? 1,
      bsDay: parsed?.day ?? row.day ?? dayInMonth,
      p: row.panchanga,
    };
  });
}

/** 1-based index of an AD date within the list, or null when it falls outside. */
export function yearWheelIndexOfAdDate(days: YearWheelDay[], dateAd: string): number | null {
  const found = days.findIndex((d) => d.dateAd === dateAd);
  return found < 0 ? null : found + 1;
}

function adDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface WheelWindowBounds {
  startAd: string;
  endAd: string;
  /** BS years the window touches — one, or two when it straddles Chaitra/Baishakh. */
  years: number[];
}

/**
 * The scrub window: the same day one BS month back through the same day one
 * month on — Shrawan 17 gives Ashar 17 → Bhadra 17, about 60 days.
 *
 * A short month clamps the endpoint to its last day (Magh 30 back into a
 * 29-day Poush lands on Poush 29), so the window never names a date that
 * doesn't exist.
 */
export function wheelWindowBounds(centre: Date): WheelWindowBounds {
  const bs = adToBS(centre);
  const back = shiftBsMonth(bs.year, bs.month, -1);
  const fwd = shiftBsMonth(bs.year, bs.month, 1);

  const startDay = Math.min(bs.day, getBSMonthLength(back.year, back.month));
  const endDay = Math.min(bs.day, getBSMonthLength(fwd.year, fwd.month));

  const start = bsToAD(back.year, back.month, startDay);
  const end = bsToAD(fwd.year, fwd.month, endDay);

  const years = back.year === fwd.year ? [back.year] : [back.year, fwd.year];
  return { startAd: adDateStr(start), endAd: adDateStr(end), years };
}

/** The window's days, in order, renumbered 1..n for the scrub. */
export function sliceWheelWindow(
  days: YearWheelDay[],
  { startAd, endAd }: Pick<WheelWindowBounds, "startAd" | "endAd">,
): YearWheelDay[] {
  return days
    .filter((d) => d.dateAd >= startAd && d.dateAd <= endAd)
    .map((d, i) => ({ ...d, index: i + 1 }));
}
