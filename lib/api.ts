import { Platform } from "react-native";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};
// Canonical host (www) — the apex `vedicpatro.com` 301-redirects to www, which
// native fetch follows silently but the browser blocks on cross-origin (the
// redirect carries no CORS header). Hitting www directly avoids the hop.
const CONFIGURED_API_BASE = (extra.apiBaseUrl as string) ?? "https://www.vedicpatro.com/api";
// On the *web* build in dev, the production API sends no CORS headers, so a
// cross-origin browser fetch is blocked. Route through the same-origin `/api`
// Metro dev proxy instead (see metro.config.js). Native and web-production hit
// the real host directly.
export const API_BASE =
  Platform.OS === "web" && __DEV__ ? "/api" : CONFIGURED_API_BASE;
export const API_VERSION = (extra.apiVersion as string) ?? "v1";
export const DATA_BASE = `${API_BASE}/${API_VERSION}`;
export const PANCHANGA_CACHE_VERSION = "25";
export const SAIT_CACHE_VERSION = "14";

export interface PushkaraNavamshaHit {
  degree?: number;
  degree_dms?: string;
  local_time?: string;
  local_time_short?: string;
}

export type NavataraTone = "best" | "good" | "neutral" | "bad" | "worst";

export interface NavataraRow {
  index: number;
  name: string;
  name_en?: string;
  tara: string;
  quality: string;
  tone: NavataraTone;
  tara_num: number;
}

export interface NavataraTableBlock {
  moon_index: number;
  moon_label: string;
  moon_label_en?: string;
  rows: NavataraRow[];
}

export interface BalamChip {
  number?: number;
  name?: string;
  name_ne?: string;
}

export interface NivasShoolDirection {
  direction_ne?: string;
  direction_en?: string;
}

export interface NivasShoolSegment extends NivasShoolDirection {
  key?: string;
  symbol?: string;
  name_en?: string;
  name_ne?: string;
  subtitle_en?: string;
  subtitle_ne?: string;
  is_auspicious?: boolean;
  end_local_time_short?: string;
  until_full_night?: boolean;
  till_full_night?: boolean;
  start_local_time_short?: string;
  loka?: string;
}

export interface NivasShoolBlock {
  homahuti?: { current?: NivasShoolSegment; segments?: NivasShoolSegment[] };
  disha_shool?: NivasShoolDirection & { auspicious_directions?: NivasShoolDirection[] };
  rahu_vasa?: NivasShoolDirection;
  agnivasa?: { current?: NivasShoolSegment; segments?: NivasShoolSegment[] };
  shivavasa?: { current?: NivasShoolSegment; segments?: NivasShoolSegment[] };
  chandra_vasa?: { current?: NivasShoolSegment; segments?: NivasShoolSegment[] };
  bhadravasa?: { active?: boolean; segments?: NivasShoolSegment[] };
  kumbha_chakra?: { current?: NivasShoolSegment; segments?: NivasShoolSegment[] };
}

export interface ApiHoraSlot {
  index: number;
  phase: "day" | "night";
  phase_ne: string;
  planet: string;
  planet_ne: string;
  planet_en: string;
  quality_ne: "शुभ" | "अशुभ";
  tone: "good" | "bad";
  bad: boolean;
  start_local_time_short: string;
  end_local_time_short: string;
  start_g: number;
  end_g: number;
}

export interface UdayaLagnaRow {
  number?: number;
  name?: string;
  name_ne?: string;
  start_local_time_short?: string;
  end_local_time_short?: string;
  start_local_time?: string;
  end_local_time?: string;
  start_hours_clock?: string;
  end_hours_clock?: string;
  pushkara_navamsha?: PushkaraNavamshaHit[];
}

export interface BalamTill {
  end_local_time_short?: string;
  end_local_time?: string;
  end_hours_clock?: string;
}

export interface BalamBlock {
  till?: BalamTill | null;
  set1?: BalamChip[];
  set2?: BalamChip[];
}

export interface PanchakaSegment {
  name?: string;
  name_ne?: string;
  good?: boolean;
  start_local_time_short?: string;
  end_local_time_short?: string;
  start_local_time?: string;
  end_local_time?: string;
  start_hours_clock?: string;
  end_hours_clock?: string;
  label_ne?: string;
  label_en?: string;
}

export interface RashiSpan {
  number?: number;
  name?: string;
  name_ne?: string;
  end_local_time?: string;
  end_local_time_short?: string;
  end_hours_clock?: string;
  end_ghati_clock?: string;
}

export interface NakshatraPadaSpan {
  nakshatra_number?: number;
  nakshatra_name?: string;
  nakshatra_name_ne?: string;
  pada?: number;
  pada_ne?: string;
  end_local_time?: string;
  end_local_time_short?: string;
  end_hours_clock?: string;
  end_ghati_clock?: string;
}

export interface MuhurtaNowBlock {
  active?: boolean;
  start_time?: string;
  end_time?: string;
  start_local?: string;
  end_local?: string;
  label_ne?: string;
  label_en?: string;
}

export interface LagnaSpan {
  number?: number;
  name?: string;
  name_ne?: string;
  degree_in_rashi?: number;
  longitude?: number;
  start_time?: string;
  end_time?: string;
  start_ghati_clock?: string;
  start_hours_clock?: string;
  start_local_time?: string;
  start_local_time_short?: string;
  end_ghati_clock?: string;
  end_hours_clock?: string;
  end_local_time?: string;
  end_local_time_short?: string;
  pushkara_navamsha?: PushkaraNavamshaHit[];
}

export interface SaitMonthAllResponse {
  bs_year: number;
  bs_month: number;
  month_name_ne: string;
  categories: Record<string, number[]>;
}

export interface LocationParams {
  city_id?: number;
  city?: string;
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

function withSaitCache(path: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}sv=${SAIT_CACHE_VERSION}`;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${DATA_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export interface CalendarDayAnga {
  name?: string;
  name_ne?: string;
}

export interface CalendarDayDetail {
  paksha?: string;
  paksha_ne?: string;
  tithi?: CalendarDayAnga;
  nakshatra?: CalendarDayAnga;
  yoga?: CalendarDayAnga;
  karana?: CalendarDayAnga;
  chandra_rashi?: string;
  chandra_rashi_ne?: string;
  udaya_lagna?: Array<{ rashi?: string; rashi_ne?: string; name_en?: string; name_ne?: string }>;
  lagna_spans?: Array<{ rashi?: string; rashi_ne?: string; name_en?: string; name_ne?: string }>;
  planets?: Record<string, { rashi?: string; rashi_ne?: string; rashi_no?: number }>;
  moon?: { rise?: string; set?: string };
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
  chandra_rashi?: string;
  chandra_rashi_ne?: string;
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonset?: string;
  festivals: string[];
  is_public_holiday?: boolean;
  outsideMonth?: boolean;
  panchanga?: CalendarDayDetail;
}

export interface MonthCalendar {
  year_bs: number;
  month_bs: number;
  calendar: CalendarDay[];
}

type PanchangaAnga = {
  name?: string;
  name_ne?: string;
  end_local_time?: string;
  end_hours_clock?: string;
  end_ghati_clock?: string;
  next?: PanchangaAnga;
};

type PlanetBlock = {
  longitude?: number;
  rashi?: number;
  rashi_name?: string;
  rashi_ne?: string;
  deg_in_rashi?: number;
  dms_in_rashi?: string;
};

type SolarCorrection = {
  minutes?: number;
  seconds?: number;
  sign?: "dhan" | "rin";
  sign_ne?: string;
};

export interface PanchangaDay {
  mode?: "ephemeris" | "udaya";
  date_bs?: string;
  date_ad?: string;
  panchanga_date_ad?: string;
  /** Local wall-clock instant used for ephemeris queries, e.g. "2026-07-22 14:30". */
  query_instant_local?: string;
  before_sunrise_of_civil_day?: boolean;
  weekday?: string;
  location?: { name?: string; city_id?: number; lat?: number; lon?: number; timezone?: string };
  lagna?: { name?: string; name_ne?: string; degree_in_rashi?: number; longitude?: number };
  lagna_spans?: LagnaSpan[];
  chandra_rashi?: { name_ne?: string; number?: number; name?: string } | string;
  chandra_rashi_spans?: RashiSpan[];
  nakshatra_pada_spans?: NakshatraPadaSpan[];
  muhurta_now?: {
    rahu_kalam?: MuhurtaNowBlock;
    yamaganda?: MuhurtaNowBlock;
    gulika?: MuhurtaNowBlock;
    abhijit?: MuhurtaNowBlock;
  };
  tithi?: PanchangaAnga;
  nakshatra?: PanchangaAnga;
  yoga?: PanchangaAnga;
  karana?: PanchangaAnga;
  paksha?: { label_ne?: string; label_en?: string };
  paksha_ne?: string;
  sunrise?: { local_time_short?: string } | string;
  sunset?: { local_time_short?: string } | string;
  moonrise?: { local?: string; local_time_short?: string };
  moonset?: { local?: string; local_time_short?: string };
  sun?: { sunrise?: string; sunset?: string };
  moon?: { rise?: string; set?: string };
  ritu?: { name?: string; name_ne?: string; season?: string } | string;
  ritu_ne?: string;
  planets?: Record<string, PlanetBlock | string>;
  planets_anchor?: { type?: string; label_ne?: string; label_en?: string; local_time?: string };
  solar_corrections?: {
    belaantar?: SolarCorrection;
    deshaantar?: SolarCorrection;
  };
  tarabala_table?: NavataraTableBlock;
  chandrabala_table?: NavataraTableBlock;
  hora?: ApiHoraSlot[];
  hora_day?: ApiHoraSlot[];
  udaya_lagna?: UdayaLagnaRow[];
  samvatsara?: {
    key?: string;
    name_ne?: string;
    name_en?: string;
    cycle?: number;
    deity?: string;
    index?: number;
  };
  festivals?: Array<{
    id?: string;
    name?: string;
    name_ne?: string;
    name_en?: string;
    is_public_holiday?: boolean;
    bs_start_date?: string;
    start_date?: string;
  }>;
  is_public_holiday?: boolean;
  bs_date?: { year: number; month: number; day: number; month_name_ne?: string };
  detail?: {
    tithi?: PanchangaAnga;
    nakshatra?: PanchangaAnga;
    yoga?: PanchangaAnga;
    karana?: PanchangaAnga;
    sunrise?: { local_time_short?: string };
    sunset?: { local_time_short?: string };
    moonrise?: { local?: string; local_time_short?: string };
    moonset?: { local?: string; local_time_short?: string };
    planets?: Record<string, PlanetBlock | string>;
    planets_anchor?: { type?: string };
    solar_corrections?: {
      belaantar?: SolarCorrection;
      deshaantar?: SolarCorrection;
    };
    muhurta?: PanchangaDay["muhurta"];
    ritu?: { name?: string; name_ne?: string; season?: string };
    ritu_pauranik?: { name?: string; name_ne?: string; season?: string };
    choghadiya?: Array<{ name_ne: string; start_g: number; end_g: number; bad?: boolean }>;
    hora?: ApiHoraSlot[];
    hora_day?: ApiHoraSlot[];
    tarabala_table?: NavataraTableBlock;
    chandrabala_table?: NavataraTableBlock;
    udaya_lagna?: UdayaLagnaRow[];
    lagna_spans?: LagnaSpan[];
    day_ghati?: number;
    vaara?: { name_ne?: string; name_english?: string; number?: number };
    paksha?: { name?: string; label_ne?: string; label_en?: string };
    weekday?: { name_ne?: string; name_english?: string };
    muhurta_now?: PanchangaDay["muhurta_now"];
    instant_lagna?: PanchangaDay["lagna"];
    nivas_shool?: NivasShoolBlock;
    chandrabalam?: BalamBlock;
    tarabalam?: BalamBlock;
    panchaka_rahita?: PanchakaSegment[];
    chandra_rashi?: PanchangaDay["chandra_rashi"];
    lagna?: PanchangaDay["lagna"];
  };
  muhurta?: {
    rahu_kalam?: { start_time?: string; end_time?: string };
    abhijit?: { start_time?: string; end_time?: string; solar_noon?: string; is_auspicious?: boolean };
    yamaganda?: { start_time?: string; end_time?: string };
    gulika?: { start_time?: string; end_time?: string };
    inauspicious_timings?: Array<{
      key?: string;
      name_ne?: string;
      name_en?: string;
      segments?: Array<{
        start_local_time_short?: string;
        end_local_time_short?: string;
        until_full_night?: boolean;
      }>;
    }>;
  };
  display?: { bs_ne?: string; gregorian_en?: string; ns_ne?: string };
  nivas_shool?: NivasShoolBlock;
  surya_rashi?: { name?: string; name_ne?: string };
  surya_rashi_ne?: string;
  surya_nakshatra?: { name?: string; name_ne?: string };
  chandra_balam?: BalamBlock | unknown;
  chandrabalam?: BalamBlock;
  tara_balam?: BalamBlock | unknown;
  tarabalam?: BalamBlock;
  panchaka?: unknown;
  panchaka_rahita?: PanchakaSegment[];
  din_vishesh?: unknown;
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

export interface CivilTimelineSeg {
  name_ne?: string | null;
  name?: string | null;
  end_min: number;
}

export interface CivilTimelineBand {
  name_ne?: string | null;
  bad?: boolean;
  start_min: number;
  end_min: number;
}

export interface CivilTimelineHora {
  planet_ne?: string | null;
  planet_en?: string | null;
  bad?: boolean;
  start_min: number;
  end_min: number;
}

export interface CivilTimelineLagna {
  name_ne?: string | null;
  name?: string | null;
  start_min: number;
  end_min: number;
}

export interface CivilTimeline {
  anchor: "civil";
  date_ad: string;
  sunrise_min: number;
  sunset_min: number | null;
  moonrise_min: number | null;
  moonset_min: number | null;
  weekday_ne?: string | null;
  weekday_en?: string | null;
  paksha_ne?: string | null;
  rows: {
    tithi: CivilTimelineSeg[];
    nakshatra: CivilTimelineSeg[];
    yoga: CivilTimelineSeg[];
    karana: CivilTimelineSeg[];
  };
  choghadiya: CivilTimelineBand[];
  hora: CivilTimelineHora[];
  lagna: CivilTimelineLagna[];
  planets?: PanchangaDay["planets"];
  planets_anchor?: unknown;
}

export interface City {
  id: number;
  name: string;
  ascii_name: string;
  lat: number;
  lon: number;
  country: string;
  population: number;
  timezone: string;
  admin1?: string | null;
  admin1_name?: string | null;
  local?: boolean;
}

export interface CitiesSearchResponse {
  query: string;
  count: number;
  cities: City[];
}

export interface NearestCityResponse {
  lat: number;
  lon: number;
  city: City;
}

export const cityKeys = {
  search: (q: string, country?: string) => ["cities", "search", q, country ?? "all"] as const,
};

export const searchCities = (q: string, limit = 15, country?: string) => {
  const params = new URLSearchParams({ q, limit: String(limit) });
  if (country) params.set("country", country);
  return get<CitiesSearchResponse>(`/nepal/cities/search?${params.toString()}`);
};

export const fetchNearestCity = (lat: number, lon: number, country?: string) => {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  if (country) params.set("country", country);
  return get<NearestCityResponse>(`/nepal/cities/nearest?${params.toString()}`);
};

function locationKey(loc?: LocationParams): string {
  const l = loc ?? DEFAULT_LOCATION;
  return [l.city_id, l.lat, l.lon, l.timezone].join(":");
}

export function locationCacheKey(location?: LocationParams): string {
  return locationKey(location);
}

export const panchangaKeys = {
  today: (loc?: LocationParams) => ["panchanga", "today", locationKey(loc)] as const,
  day: (date: string, era: string, loc?: LocationParams) =>
    ["panchanga", "day", PANCHANGA_CACHE_VERSION, date, era, locationKey(loc)] as const,
  atTime: (datetime: string, loc?: LocationParams) =>
    ["panchanga", "at-time", PANCHANGA_CACHE_VERSION, datetime, locationKey(loc)] as const,
  civil: (date: string, loc?: LocationParams) =>
    ["panchanga", "civil", PANCHANGA_CACHE_VERSION, date, locationKey(loc)] as const,
};

export const apiKeys = {
  month: (y: number, m: number, loc?: LocationParams) =>
    ["month", y, m, locationKey(loc)] as const,
  panchanga: (date: string, era: string, loc?: LocationParams) =>
    ["panchanga", date, era, locationKey(loc)] as const,
  today: (loc?: LocationParams) => ["panchanga", "today", locationKey(loc)] as const,
  holidays: (year: number) => ["holidays", year] as const,
  convertAd: (d: string) => ["convert", "ad", d] as const,
  convertBs: (d: string) => ["convert", "bs", d] as const,
  saitMonthAll: (y: number, m: number, loc?: LocationParams) =>
    ["sait", "month-all", SAIT_CACHE_VERSION, y, m, locationKey(loc)] as const,
};

export const fetchMonthCalendar = async (
  year: number,
  month: number,
  location?: LocationParams,
): Promise<MonthCalendar> => {
  const data = await get<MonthCalendar>(
    appendLocation(withCache(`/panchanga/${year}/${month}?full=true`), location),
  );
  return {
    ...data,
    calendar: data.calendar.map(normalizeMonthDay),
  };
};

function normalizeMonthDay(day: CalendarDay): CalendarDay {
  const nested = day.panchanga;
  const nestedRashi =
    typeof nested?.chandra_rashi === "object"
      ? {
          en: (nested.chandra_rashi as { name?: string }).name,
          ne: (nested.chandra_rashi as { name_ne?: string }).name_ne ?? nested.chandra_rashi_ne,
        }
      : {
          en: typeof nested?.chandra_rashi === "string" ? nested.chandra_rashi : undefined,
          ne: nested?.chandra_rashi_ne,
        };

  return {
    ...day,
    nakshatra: day.nakshatra ?? nested?.nakshatra?.name,
    nakshatra_ne: day.nakshatra_ne ?? nested?.nakshatra?.name_ne,
    yoga: day.yoga ?? nested?.yoga?.name,
    yoga_ne: day.yoga_ne ?? nested?.yoga?.name_ne,
    karana: day.karana ?? nested?.karana?.name,
    karana_ne: day.karana_ne ?? nested?.karana?.name_ne,
    moonrise: day.moonrise ?? nested?.moon?.rise,
    moonset: day.moonset ?? nested?.moon?.set,
    chandra_rashi: day.chandra_rashi ?? nestedRashi.en,
    chandra_rashi_ne: day.chandra_rashi_ne ?? nestedRashi.ne,
  };
}

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

export const fetchPanchangaAtTime = (
  datetime: string,
  location?: LocationParams,
  options?: { ayanamsha?: string },
) => {
  const params = new URLSearchParams();
  params.set("datetime", datetime);
  if (options?.ayanamsha) params.set("ayanamsha", options.ayanamsha);
  return get<PanchangaDay>(
    appendLocation(withCache(`/panchanga/at-time?${params.toString()}`), location),
  );
};

export const fetchCivilTimeline = (date: string, era: "bs" | "ad" = "ad", location?: LocationParams) =>
  get<{ civil_timeline: CivilTimeline }>(
    appendLocation(withCache(`/panchanga/${date}?era=${era}&detail=false&civil=true`), location),
  ).then((r) => r.civil_timeline);

export const fetchHolidays = (year: number) =>
  get<HolidaysResponse>(withCache(`/nepal/holidays?year=${year}&era=bs`));

// ─── Gochar (planetary transits) ─────────────────────────────────────────────

export interface GocharNextEntry {
  to_rashi?: string;
  to_rashi_ne?: string;
  to_nakshatra?: string;
  to_nakshatra_ne?: string;
  to_pada?: number;
  to_pada_ne?: string;
  label_ne?: string;
  entry_time_local: string;
  entry_time_local_short?: string;
  entry_time_utc?: string;
}

export interface GocharGraha {
  name_ne: string;
  name_vedic?: string;
  symbol: string;
  rashi?: string;
  rashi_ne?: string;
  rashi_no?: number;
  motion?: string;
  is_retrograde?: boolean;
  next_rashi_entry?: GocharNextEntry | null;
  next_nakshatra_entry?: GocharNextEntry | null;
  next_pada_entry?: GocharNextEntry | null;
}

export interface GocharResponse {
  date_ad: string;
  date_bs?: string;
  gochar: Record<string, GocharGraha>;
}

export const gocharKeys = {
  day: (date: string, era: string, location?: LocationParams) =>
    ["gochar", date, era, locationCacheKey(location)] as const,
};

export const fetchGochar = (date: string, era: "bs" | "ad" = "ad", location?: LocationParams) =>
  get<GocharResponse>(appendLocation(`/nepal/gochar/${date}?era=${era}`, location));

export const fetchSaitMonthAll = async (
  year: number,
  month: number,
  location?: LocationParams,
): Promise<SaitMonthAllResponse> => {
  const data = await get<SaitMonthAllResponse>(
    withSaitCache(appendLocation(`/nepal/sait/${year}/month/${month}`, location)),
  );
  if (!data?.categories || typeof data.categories !== "object") {
    throw new Error(`Invalid sait response for ${year}/${month}`);
  }
  return data;
};

export const fetchAdToBs = (date: string) => get<ConvertAdToBs>(`/convert/ad-to-bs/${date}`);
export const fetchBsToAd = (date: string) => get<ConvertBsToAd>(`/convert/bs-to-ad/${date}`);

export function timeShort(v: PanchangaDay["sunrise"]): string {
  if (!v) return "—";
  if (typeof v === "string") return v.slice(0, 5);
  return v.local_time_short?.slice(0, 5) ?? "—";
}
