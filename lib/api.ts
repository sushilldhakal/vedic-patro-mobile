import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};
export const API_BASE = (extra.apiBaseUrl as string) ?? "https://vedicpatro.com/api";
export const API_VERSION = (extra.apiVersion as string) ?? "v1";
export const DATA_BASE = `${API_BASE}/${API_VERSION}`;
export const PANCHANGA_CACHE_VERSION = "25";

export interface LocationParams {
  city_id?: number;
  lat?: number;
  lon?: number;
  timezone?: string;
}

export const DEFAULT_LOCATION: LocationParams = {
  city_id: 1283240,
  timezone: "Asia/Kathmandu",
};

function appendLocation(path: string, location?: LocationParams): string {
  const loc = location ?? DEFAULT_LOCATION;
  const params = new URLSearchParams();
  if (loc.city_id != null) params.set("city_id", String(loc.city_id));
  if (loc.lat != null) params.set("lat", String(loc.lat));
  if (loc.lon != null) params.set("lon", String(loc.lon));
  if (loc.timezone) params.set("timezone", loc.timezone);
  const qs = params.toString();
  if (!qs) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${qs}`;
}

function withCache(path: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}cv=${PANCHANGA_CACHE_VERSION}`;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${DATA_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export interface CalendarDay {
  day: number;
  date_ad: string;
  weekday: string;
  weekday_en?: string;
  weekday_ne?: string;
  tithi: string;
  tithi_ne?: string;
  nakshatra?: string;
  nakshatra_ne?: string;
  paksha?: string;
  paksha_ne?: string;
  yoga?: string;
  yoga_ne?: string;
  karana?: string;
  karana_ne?: string;
  sunrise?: string;
  sunset?: string;
  festivals: string[];
  is_public_holiday?: boolean;
  outsideMonth?: boolean;
}

export interface MonthCalendar {
  year_bs: number;
  month_bs: number;
  calendar: CalendarDay[];
}

export interface PanchangaDay {
  date_bs?: string;
  date_ad?: string;
  weekday?: string;
  tithi?: { name?: string; name_ne?: string };
  nakshatra?: { name?: string; name_ne?: string };
  yoga?: { name?: string; name_ne?: string };
  karana?: { name?: string; name_ne?: string };
  paksha?: { label_ne?: string; label_en?: string };
  sunrise?: { local_time_short?: string } | string;
  sunset?: { local_time_short?: string } | string;
  moonrise?: { local_time_short?: string };
  moonset?: { local_time_short?: string };
  samvatsara?: { name_ne?: string; name_en?: string };
  festivals?: Array<{ name?: string; name_ne?: string; is_public_holiday?: boolean }>;
  is_public_holiday?: boolean;
  bs_date?: { year: number; month: number; day: number; month_name_ne?: string };
  muhurta?: {
    rahu_kalam?: { start_time?: string; end_time?: string };
    abhijit?: { start_time?: string; end_time?: string };
    yamaganda?: { start_time?: string; end_time?: string };
    gulika?: { start_time?: string; end_time?: string };
  };
  display?: { bs_ne?: string; gregorian_en?: string };
}

export interface Holiday {
  name?: string;
  name_ne?: string;
  date_ad?: string;
  date_bs?: string;
  is_public_holiday?: boolean;
}

export interface HolidaysResponse {
  count: number;
  holidays: Holiday[];
}

export interface ConvertAdToBs {
  ad_date: string;
  bs_year: number;
  bs_month: number;
  bs_day: number;
  bs_month_name?: string;
  bs_month_name_ne?: string;
}

export interface ConvertBsToAd {
  bs_date: string;
  ad_date: string;
}

export const apiKeys = {
  month: (y: number, m: number) => ["month", y, m] as const,
  panchanga: (date: string, era: string) => ["panchanga", date, era] as const,
  today: () => ["panchanga", "today"] as const,
  holidays: (year: number) => ["holidays", year] as const,
  convertAd: (d: string) => ["convert", "ad", d] as const,
  convertBs: (d: string) => ["convert", "bs", d] as const,
};

export const fetchMonthCalendar = (year: number, month: number, location?: LocationParams) =>
  get<MonthCalendar>(
    appendLocation(withCache(`/panchanga/${year}/${month}?full=true`), location),
  );

export const fetchPanchanga = (date: string, era: "bs" | "ad" = "bs", location?: LocationParams) =>
  get<PanchangaDay>(
    appendLocation(
      withCache(`/panchanga/${date}?era=${era}&festivals=true&detail=true`),
      location,
    ),
  );

export const fetchTodayPanchanga = (location?: LocationParams) => {
  const today = new Date().toISOString().split("T")[0];
  return get<PanchangaDay>(
    appendLocation(
      withCache(`/panchanga/${today}?era=ad&festivals=true&detail=true`),
      location,
    ),
  );
};

export const fetchHolidays = (year: number) =>
  get<HolidaysResponse>(withCache(`/nepal/holidays?year=${year}&era=bs`));

export const fetchAdToBs = (date: string) => get<ConvertAdToBs>(`/convert/ad-to-bs/${date}`);
export const fetchBsToAd = (date: string) => get<ConvertBsToAd>(`/convert/bs-to-ad/${date}`);

export function timeShort(v: PanchangaDay["sunrise"]): string {
  if (!v) return "—";
  if (typeof v === "string") return v.slice(0, 5);
  return v.local_time_short?.slice(0, 5) ?? "—";
}
