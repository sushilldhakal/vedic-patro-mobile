import type { PatroBrowseEra } from "@/lib/patro-era";

/** @deprecated use {@link PatroBrowseEra} */
export type MonthBrowseEra = PatroBrowseEra;

/** Mirrors web `PATRO_EPHEMERIS_SIGNED_MAX` / `BBS_URL_YEAR_MAX`. */
export const PATRO_BS_BROWSE_YEAR_MAX = 17247;
export const PATRO_BBS_BROWSE_YEAR_MAX = 13201;
export const PATRO_AD_BROWSE_YEAR_MAX = 17191;
export const PATRO_BC_BROWSE_YEAR_MAX = 13201;

const NATIVE_SELECT_YEAR_RADIUS = 100;

export function maxBrowseYearForEra(era: PatroBrowseEra): number {
  switch (era) {
    case "bbs":
      return PATRO_BBS_BROWSE_YEAR_MAX;
    case "ad":
      return PATRO_AD_BROWSE_YEAR_MAX;
    case "bc":
      return PATRO_BC_BROWSE_YEAR_MAX;
    default:
      return PATRO_BS_BROWSE_YEAR_MAX;
  }
}

export function isValidBrowseYear(era: PatroBrowseEra, year: number): boolean {
  return Number.isFinite(year) && year >= 1 && year <= maxBrowseYearForEra(era);
}

export function clampBrowseYear(era: PatroBrowseEra, year: number): number {
  const max = maxBrowseYearForEra(era);
  return Math.min(Math.max(1, Math.trunc(year)), max);
}

export { togglePatroBrowseEra as toggleBrowseEra } from "@/lib/patro-era";
export { toggleBrowseEraForLang } from "@/lib/patro-era";

/** Windowed year list for pickers (~201 years around selection). */
export function windowedBrowseYears(
  era: PatroBrowseEra,
  currentYear: number,
  radius = NATIVE_SELECT_YEAR_RADIUS,
): number[] {
  const max = maxBrowseYearForEra(era);
  const y = clampBrowseYear(era, currentYear);
  const start = Math.max(1, y - radius);
  const end = Math.min(max, y + radius);
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

export function browseYearSelectOptions(
  era: PatroBrowseEra,
  currentYear: number,
  digits: (n: number) => string,
): { value: number; label: string }[] {
  return windowedBrowseYears(era, currentYear).map((y) => ({
    value: y,
    label: digits(y),
  }));
}
