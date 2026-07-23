import type { CalendarDay, PanchangaDay } from "@/lib/api";
import { adToBS, BS_MONTH_NAMES, BS_MONTHS_NE } from "@/lib/bs-calendar";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import type { AppLanguage } from "@/lib/i18n";

const NEPALI_DIGITS: Record<string, string> = {
  "0": "०", "1": "१", "2": "२", "3": "३", "4": "४",
  "5": "५", "6": "६", "7": "७", "8": "८", "9": "९",
};

function normalizeLang(lang?: string): AppLanguage {
  return lang?.slice(0, 2) === "en" ? "en" : "ne";
}

function pickLocale(lang: string | undefined, ne?: string, en?: string): string {
  return normalizeLang(lang) === "en" ? en ?? ne ?? "" : ne ?? en ?? "";
}

export function toNepaliDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => NEPALI_DIGITS[d] ?? d);
}

function formatLocaleDigits(value: string | number, lang?: string): string {
  return normalizeLang(lang) === "en" ? String(value) : toNepaliDigits(value);
}

export function formatTimeShort(time?: string | null): string | undefined {
  if (!time) return undefined;
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return time;
  return `${match[1]!.padStart(2, "0")}:${match[2]!}`;
}

export function formatClockNepali(time?: string | null, lang?: string): string | undefined {
  if (!time) return undefined;
  const short = formatTimeShort(time) ?? time;
  return formatLocaleDigits(short, lang);
}

export function formatGhatiEnd(clock?: string | null): string | undefined {
  if (!clock) return undefined;
  const parts = clock.split(":").map(Number);
  const ghati = parts[0];
  const pala = parts[1];
  if (ghati == null || pala == null) return undefined;
  const totalMinutes = ghati * 24 + pala;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

type AngaPatro = {
  name_ne?: string;
  name?: string;
  end_local_time?: string;
  end_hours_clock?: string;
  end_ghati_clock?: string;
  next?: AngaPatro;
};

function angaEndsNextDay(anga: AngaPatro): boolean {
  if (anga.end_hours_clock) {
    const h = Number(anga.end_hours_clock.split(":")[0]);
    if (!Number.isNaN(h) && h >= 24) return true;
  }
  if (anga.end_ghati_clock) {
    const gh = Number(anga.end_ghati_clock.split(":")[0]);
    if (!Number.isNaN(gh) && gh >= 60) return true;
  }
  const end =
    formatTimeShort(anga.end_local_time) ??
    formatTimeShort(anga.end_hours_clock);
  if (end) {
    const h = Number(end.split(":")[0]);
    if (!Number.isNaN(h) && h < 5) return true;
  }
  return false;
}

function patroAngaEndClockLocalized(anga: AngaPatro, lang?: string): string | undefined {
  const t =
    formatTimeShort(anga.end_local_time) ??
    formatTimeShort(anga.end_hours_clock) ??
    formatGhatiEnd(anga.end_ghati_clock);
  if (!t) return undefined;
  const [hh, mm] = t.split(":");
  if (!hh || !mm) return formatLocaleDigits(t, lang);
  return formatLocaleDigits(`${hh.padStart(2, "0")}:${mm.padStart(2, "0")}`, lang);
}

export function formatAngaPatroChain(anga?: AngaPatro | null, lang?: string): string | undefined {
  if (!anga) return undefined;
  const isEn = normalizeLang(lang) === "en";
  const first = pickLocale(lang, anga.name_ne ?? anga.name, anga.name ?? anga.name_ne);
  if (!first) return undefined;
  let result = first;
  let node: AngaPatro | undefined = anga;
  while (node?.next) {
    const end = patroAngaEndClockLocalized(node, lang);
    const nextNode: AngaPatro = node.next;
    const nextName =
      pickLocale(lang, nextNode.name_ne ?? nextNode.name, nextNode.name ?? nextNode.name_ne) ?? "";
    if (!end || !nextName) break;
    const isLast = !nextNode.next;
    const dayNote =
      isLast && angaEndsNextDay(node) ? (isEn ? " (next day)" : "(अर्को दिन)") : "";
    result += isEn ? `•from ${end} ${nextName}${dayNote}` : `•${end} बाट ${nextName}${dayNote}`;
    node = nextNode;
  }
  return result;
}

export function formatAngaPatroTransitionHint(
  anga?: AngaPatro | null,
  lang?: string,
): string | undefined {
  const full = formatAngaPatroChain(anga, lang);
  const name = pickLocale(lang, anga?.name_ne ?? anga?.name, anga?.name ?? anga?.name_ne);
  if (!full || !name || full === name) return undefined;
  if (full.startsWith(name)) return full.slice(name.length);
  return full;
}

type SolarCorrection = {
  minutes?: number;
  seconds?: number;
  sign?: "dhan" | "rin";
  sign_ne?: string;
};

export type SolarCorrections = {
  belaantar?: SolarCorrection;
  deshaantar?: SolarCorrection;
};

export function formatPatroBelaantar(c?: SolarCorrection): string | undefined {
  if (!c || c.minutes == null || c.seconds == null) return undefined;
  const mm = toNepaliDigits(c.minutes);
  const ss = toNepaliDigits(String(c.seconds).padStart(2, "0"));
  const prefix = c.sign === "rin" ? "(-) " : "(+) ";
  return `${prefix}${mm}:${ss}`;
}

export function formatPatroDeshaantar(c?: SolarCorrection): string | undefined {
  if (!c || c.minutes == null || c.seconds == null) return undefined;
  const mm = toNepaliDigits(c.minutes);
  const ss = toNepaliDigits(String(c.seconds).padStart(2, "0"));
  if (c.sign === "rin") return `(-) ${mm}:${ss}`;
  return `उ ${mm}:${ss}`;
}

export function getPanchangaDetail(p: PanchangaDay) {
  return p.detail;
}

type RituBlock = { name?: string; name_ne?: string; season?: string };

function getDetailValue<T>(p: PanchangaDay, key: string): T | undefined {
  const detail = getPanchangaDetail(p) as Record<string, unknown> | undefined;
  return (detail?.[key] ?? (p as Record<string, unknown>)[key]) as T | undefined;
}

export function getRituDisplay(p?: PanchangaDay | null, lang?: string): string | undefined {
  if (!p) return undefined;
  const ritu = getDetailValue<RituBlock>(p, "ritu") ?? getDetailValue<RituBlock>(p, "ritu_pauranik");
  const top = typeof p.ritu === "object" ? p.ritu : undefined;
  const ne = ritu?.name_ne ?? top?.name_ne ?? p.ritu_ne;
  const en = ritu?.name ?? top?.name ?? ritu?.season ?? top?.season ?? ne;
  return pickLocale(lang, ne, en);
}

export function getRituSeason(p?: PanchangaDay | null, lang?: string): string | undefined {
  if (!p) return undefined;
  const ritu = getDetailValue<RituBlock>(p, "ritu") ?? getDetailValue<RituBlock>(p, "ritu_pauranik");
  const season =
    ritu?.season ??
    (typeof p.ritu === "object" ? p.ritu?.season : undefined);
  if (!season) return undefined;
  if (normalizeLang(lang) === "en") return season;
  const SEASON_NE: Record<string, string> = {
    Spring: "वसन्त",
    Summer: "ग्रीष्म",
    Autumn: "शरद्",
    Fall: "शरद्",
    Winter: "हिउँद",
    Monsoon: "वर्षा",
    Rainy: "वर्षा",
  };
  return SEASON_NE[season] ?? undefined;
}

export function getSolarCorrections(p: PanchangaDay): SolarCorrections | undefined {
  const detail = getPanchangaDetail(p);
  return detail?.solar_corrections ?? p.solar_corrections;
}

export function getSunrise(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const fromDetail = detail?.sunrise?.local_time_short;
  if (fromDetail) return fromDetail;
  if (typeof p.sunrise === "object") return p.sunrise?.local_time_short;
  if (typeof p.sunrise === "string") return p.sunrise;
  return p.sun?.sunrise;
}

export function getSunset(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const fromDetail = detail?.sunset?.local_time_short;
  if (fromDetail) return fromDetail;
  if (typeof p.sunset === "object") return p.sunset?.local_time_short;
  if (typeof p.sunset === "string") return p.sunset;
  return p.sun?.sunset;
}

export function getSunriseDisplay(p: PanchangaDay, lang?: string): string | undefined {
  return formatClockNepali(getSunrise(p), lang);
}

export function getSunsetDisplay(p: PanchangaDay, lang?: string): string | undefined {
  return formatClockNepali(getSunset(p), lang);
}

type MoonTimeBlock = { local?: string; local_time_short?: string };

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(y, m - 1, d + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function formatEventDateBs(isoDate: string, lang?: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return formatLocaleDigits(isoDate, lang);
  const bs = adToBS(new Date(y, m - 1, d));
  const isEn = normalizeLang(lang) === "en";
  const monthName = isEn ? BS_MONTH_NAMES[bs.month - 1] : BS_MONTHS_NE[bs.month - 1];
  return `${monthName} ${formatLocaleDigits(bs.day, lang)}`;
}

function getMoonTimeBlock(p: PanchangaDay, key: "moonrise" | "moonset"): MoonTimeBlock | undefined {
  const detail = getPanchangaDetail(p);
  const fromDetail = detail?.[key];
  if (fromDetail?.local_time_short) return fromDetail;
  const top = p[key];
  if (top?.local_time_short) return top;
  const fallback = key === "moonrise" ? p.moon?.rise : p.moon?.set;
  if (fallback) return { local_time_short: fallback };
  return undefined;
}

export function resolveMoonEventAdDate(
  p: PanchangaDay,
  key: "moonrise" | "moonset",
  block: MoonTimeBlock,
): string | undefined {
  const dayDate = p.date_ad;
  if (!dayDate) return block.local?.slice(0, 10);

  const eventDate = block.local?.slice(0, 10);
  const eventMin = parseTimeToMinutes(block.local_time_short);
  const sunriseMin = parseTimeToMinutes(getSunrise(p));

  if (eventDate && eventDate !== dayDate) {
    return eventDate;
  }

  if (key === "moonrise" && eventMin != null && sunriseMin != null && eventMin < sunriseMin) {
    return addDaysIso(dayDate, 1);
  }

  return eventDate ?? dayDate;
}

export function formatMoonEventDisplay(
  p: PanchangaDay,
  key: "moonrise" | "moonset",
  lang?: string,
): string | undefined {
  const block = getMoonTimeBlock(p, key);
  if (!block?.local_time_short) return undefined;
  const short = formatTimeShort(block.local_time_short) ?? block.local_time_short;
  const time = formatLocaleDigits(short, lang);
  const eventDate = resolveMoonEventAdDate(p, key, block);
  if (!time) return undefined;
  if (!eventDate) return time;
  return `${formatEventDateBs(eventDate, lang)} · ${time}`;
}

export function formatMonthMoonEventDisplay(
  day: {
    date_ad: string;
    sunrise?: string;
    moonrise?: string;
    moonrise_local?: string;
    moonset?: string;
    moonset_local?: string;
  },
  key: "moonrise" | "moonset",
  lang?: string,
): string | undefined {
  const time = key === "moonrise" ? day.moonrise : day.moonset;
  if (!time) return undefined;
  const local = key === "moonrise" ? day.moonrise_local : day.moonset_local;
  const block: MoonTimeBlock = { local_time_short: time, local };
  const pseudo = { date_ad: day.date_ad, sunrise: day.sunrise } as PanchangaDay;
  const eventDate = resolveMoonEventAdDate(pseudo, key, block);
  const short = formatTimeShort(time) ?? time;
  const timeLabel = formatLocaleDigits(short, lang);
  if (!timeLabel) return undefined;
  if (!eventDate) return timeLabel;
  return `${formatEventDateBs(eventDate, lang)} · ${timeLabel}`;
}

export function getMoonriseDisplay(p: PanchangaDay, lang?: string): string | undefined {
  return formatMoonEventDisplay(p, "moonrise", lang);
}

type PlanetDetail = {
  longitude?: number;
  rashi?: number;
  rashi_name?: string;
  rashi_ne?: string;
  deg_in_rashi?: number;
  dms_in_rashi?: string;
};

export function longitudeToDegreeCells(longitude: number): string {
  const rem = longitude % 30;
  const deg = Math.floor(rem);
  const min = Math.floor((rem - deg) * 60);
  let sec = Math.round(((rem - deg) * 60 - min) * 60);
  let m = min;
  let d = deg;
  if (sec >= 60) {
    sec -= 60;
    m += 1;
  }
  if (m >= 60) {
    m -= 60;
    d += 1;
  }
  return [d, m, sec].map((n) => toNepaliDigits(n)).join("|");
}

function dmsInRashiToDegreeCells(dms: string): string | undefined {
  const match = dms.match(/(\d+)°(\d+)'(\d+)"/);
  if (!match) return undefined;
  return [match[1], match[2], match[3]].map((n) => toNepaliDigits(Number(n))).join("|");
}

function planetLabelPair(key: string): { label: string; labelEn: string } {
  const g = GRAHA_NAME[key as GrahaKey];
  return { label: g?.ne ?? key, labelEn: g?.en ?? key };
}

function planetDegreeCells(info: PlanetDetail): string {
  if (info.dms_in_rashi) {
    const fromDms = dmsInRashiToDegreeCells(info.dms_in_rashi);
    if (fromDms) return fromDms;
  }
  if (info.deg_in_rashi != null && info.rashi != null) {
    return longitudeToDegreeCells((info.rashi - 1) * 30 + info.deg_in_rashi);
  }
  if (info.longitude != null) {
    return longitudeToDegreeCells(info.longitude);
  }
  return "—";
}

function isInstantPlanetsMode(p: PanchangaDay): boolean {
  const detail = getPanchangaDetail(p);
  const anchor = detail?.planets_anchor ?? p.planets_anchor;
  return p.mode === "ephemeris" || anchor?.type === "instant";
}

function resolvePlanetsRecord(
  p: PanchangaDay,
): Record<string, PlanetDetail | string> | undefined {
  const detail = getPanchangaDetail(p);
  const fromDetail = detail?.planets;
  const fromTop = p.planets;
  if (isInstantPlanetsMode(p)) {
    return fromDetail ?? fromTop;
  }
  return fromDetail ?? fromTop;
}

export function formatPlanetGocharLine(info: PlanetDetail): string {
  const cells = planetDegreeCells(info).split("|");
  const rashiNo = info.rashi;
  if (rashiNo != null && rashiNo >= 1 && rashiNo <= 12) {
    return [toNepaliDigits(rashiNo), ...cells].join(":");
  }
  return cells.join(":");
}

export function getPlanetGocharLines(
  p: PanchangaDay,
  lang?: string,
): { label: string; value: string }[] {
  const planets = resolvePlanetsRecord(p);
  if (!planets) return [];

  const order: GrahaKey[] = [
    "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu",
  ];

  return order
    .filter((key) => key in planets)
    .map((key) => {
      const { label: ne, labelEn: en } = planetLabelPair(key);
      const label = pickLocale(lang, ne, en);
      const info = planets[key];
      if (typeof info === "string") {
        return { label, value: info };
      }
      return { label, value: formatPlanetGocharLine(info) };
    });
}

function formatMuhurtaRange(start?: string, end?: string, lang?: string): string | undefined {
  if (!start || !end) return undefined;
  const s = formatClockNepali(start, lang) ?? start;
  const e = formatClockNepali(end, lang) ?? end;
  return `${s} – ${e}`;
}

function clockMinutes(time?: string | null): number | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function minutesToClock(mins: number): string {
  const rounded = Math.round(mins);
  const h = Math.floor(rounded / 60) % 24;
  const m = rounded % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type AbhijitMuhurtaInfo = {
  start_time: string;
  end_time: string;
  solar_noon?: string;
  rangeDisplay: string;
  noonDisplay?: string;
};

function computeAbhijitFromSunTimes(
  sunrise?: string | null,
  sunset?: string | null,
  lang?: string,
): AbhijitMuhurtaInfo | null {
  const sr = clockMinutes(sunrise);
  const ss = clockMinutes(sunset);
  if (sr == null || ss == null || ss <= sr) return null;
  const total = ss - sr;
  const muh = total / 15;
  const start_time = minutesToClock(sr + 7 * muh);
  const end_time = minutesToClock(sr + 8 * muh);
  const solar_noon = minutesToClock(sr + total / 2);
  const rangeDisplay = formatMuhurtaRange(start_time, end_time, lang) ?? `${start_time} – ${end_time}`;
  return {
    start_time,
    end_time,
    solar_noon,
    rangeDisplay,
    noonDisplay: formatClockNepali(solar_noon, lang),
  };
}

export function getAbhijitMuhurta(p: PanchangaDay, lang?: string): AbhijitMuhurtaInfo | null {
  const detail = getPanchangaDetail(p);
  const m = detail?.muhurta ?? p.muhurta;
  const ab = m?.abhijit;
  if (ab?.start_time && ab?.end_time) {
    const rangeDisplay = formatMuhurtaRange(ab.start_time, ab.end_time, lang);
    if (!rangeDisplay) return null;
    return {
      start_time: ab.start_time,
      end_time: ab.end_time,
      solar_noon: ab.solar_noon,
      rangeDisplay,
      noonDisplay: ab.solar_noon ? formatClockNepali(ab.solar_noon, lang) : undefined,
    };
  }
  return computeAbhijitFromSunTimes(getSunrise(p), getSunset(p), lang);
}

export function getTarabalaTable(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  return p.tarabala_table ?? detail?.tarabala_table;
}

export function getChandrabalamTable(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  return p.chandrabala_table ?? detail?.chandrabala_table;
}

export function getHoraSlots(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const block = p.hora ?? detail?.hora;
  return Array.isArray(block) ? block : [];
}

export function getHoraDaySlots(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const block = p.hora_day ?? detail?.hora_day;
  if (Array.isArray(block) && block.length) return block;
  return getHoraSlots(p).filter((slot) => slot.phase === "day");
}

export function getUdayaLagna(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const rows = detail?.udaya_lagna ?? p.udaya_lagna;
  return rows?.length ? rows : undefined;
}

export function formatShortClock(time?: string | null, lang?: string): string | undefined {
  if (!time) return undefined;
  const t = formatTimeShort(time) ?? time.slice(0, 5);
  return formatLocaleDigits(t, lang);
}

export function formatTimeRangeShort(
  start?: string | null,
  end?: string | null,
  lang?: string,
): string | undefined {
  const a = formatShortClock(start, lang);
  const b = formatShortClock(end, lang);
  if (!a || !b) return undefined;
  return `${a} → ${b}`;
}

export type PanchangaDetailCell = {
  label: string;
  value?: string;
  hint?: string;
  wide?: boolean;
  mono?: boolean;
};

export function buildPanchangaDetailCells(
  p: PanchangaDay,
  lang: string,
  selectedDay?: CalendarDay | null,
  labels?: {
    sunriseSunset: string;
    moonrise: string;
    ritu: string;
    nakshatra: string;
    yoga: string;
    karana: string;
    dash: string;
  },
): PanchangaDetailCell[] {
  const detail = getPanchangaDetail(p);
  const nakshatra = detail?.nakshatra ?? p.nakshatra;
  const yoga = detail?.yoga ?? p.yoga;
  const karana = detail?.karana ?? p.karana;

  const angaName = (anga?: AngaPatro | null) =>
    pickLocale(lang, anga?.name_ne ?? anga?.name, anga?.name ?? anga?.name_ne);

  const sunrise =
    getSunriseDisplay(p, lang) ??
    (selectedDay?.sunrise ? formatClockNepali(selectedDay.sunrise, lang) : undefined);
  const sunset =
    getSunsetDisplay(p, lang) ??
    (selectedDay?.sunset ? formatClockNepali(selectedDay.sunset, lang) : undefined);
  const moonrise =
    getMoonriseDisplay(p, lang) ??
    (selectedDay ? formatMonthMoonEventDisplay(selectedDay, "moonrise", lang) : undefined);

  const L = labels ?? {
    sunriseSunset: "सूर्योदय / सूर्यास्त",
    moonrise: "चन्द्रोदय",
    ritu: "ऋतु",
    nakshatra: "नक्षत्र",
    yoga: "योग",
    karana: "करण",
    dash: "—",
  };

  return [
    {
      label: L.sunriseSunset,
      value: sunrise && sunset ? `${sunrise} / ${sunset}` : undefined,
      mono: true,
    },
    { label: L.moonrise, value: moonrise ?? L.dash, mono: true },
    { label: L.ritu, value: getRituDisplay(p, lang), hint: getRituSeason(p, lang) },
    {
      label: L.nakshatra,
      value: angaName(nakshatra),
      hint: formatAngaPatroTransitionHint(nakshatra, lang),
    },
    {
      label: L.yoga,
      value: angaName(yoga),
      hint: formatAngaPatroTransitionHint(yoga, lang),
    },
    {
      label: L.karana,
      value: angaName(karana),
      hint: formatAngaPatroTransitionHint(karana, lang),
    },
  ];
}

// ─── Wheel / timeline helpers (shared with web patro) ─────────────────────

const RASHI_NE_LIST = [
  "मेष", "वृष", "मिथुन", "कर्कट", "सिंह", "कन्या",
  "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन",
] as const;

export const RASHI_SYM = [
  "", "", "", "", "", "",
  "", "", "", "", "", "",
] as const;

const RASHI_DISPLAY_NE: Record<string, string> = {
  मेष: "मेष",
  वृष: "वृषभ",
  मिथुन: "मिथुन",
  कर्कट: "कर्कट",
  सिंह: "सिंह",
  कन्या: "कन्या",
  तुला: "तुला",
  वृश्चिक: "वृश्चिक",
  धनु: "धनु",
  मकर: "मकर",
  कुम्भ: "कुम्भ",
  मीन: "मीन",
};

export function formatRashiDisplayNe(nameNe?: string): string | undefined {
  if (!nameNe) return undefined;
  return RASHI_DISPLAY_NE[nameNe] ?? nameNe;
}

export function rashiNeFromNumber(rashi?: number): string | undefined {
  if (rashi == null || rashi < 1 || rashi > 12) return undefined;
  return RASHI_NE_LIST[rashi - 1];
}

export function getLagnaSpans(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const fromTop = (p as PanchangaDay & { lagna_spans?: unknown[] }).lagna_spans;
  const fromDetail = detail?.lagna_spans as PanchangaDay["lagna_spans"];
  if (fromTop?.length) return fromTop;
  if (fromDetail?.length) return fromDetail;
  return undefined;
}

export function getMoonrise(p: PanchangaDay): string | undefined {
  return getMoonTimeBlock(p, "moonrise")?.local_time_short;
}

export function getMoonset(p: PanchangaDay): string | undefined {
  return getMoonTimeBlock(p, "moonset")?.local_time_short;
}

export function getPakshaEmoji(p: PanchangaDay): string {
  const detail = getPanchangaDetail(p);
  const paksha = detail?.paksha as { name?: string } | undefined;
  const name = (paksha?.name ?? "").toLowerCase();
  return name === "shukla" ? "🌓" : "🌗";
}

export function formatPakshaNepaliDisplay(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const paksha = detail?.paksha as { label_ne?: string } | undefined;
  const label = paksha?.label_ne ?? p.paksha?.label_ne ?? p.paksha_ne;
  if (!label) return undefined;
  return `${label} ${getPakshaEmoji(p)}`;
}

export type PlanetRow = {
  key: string;
  label: string;
  labelEn: string;
  rashiNe?: string;
  rashiEn?: string;
  coords: string;
};

function rashiEnFromNumber(rashi?: number): string | undefined {
  const EN = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];
  if (rashi == null || rashi < 1 || rashi > 12) return undefined;
  return EN[rashi - 1];
}

export function getPlanetRows(p: PanchangaDay): PlanetRow[] {
  const detail = getPanchangaDetail(p);
  const anchor = detail?.planets_anchor ?? p.planets_anchor;
  const instant = p.mode === "ephemeris" || anchor?.type === "instant";
  const planets = (instant ? detail?.planets ?? p.planets : detail?.planets ?? p.planets) as
    | Record<string, PlanetDetail | string>
    | undefined;
  if (!planets) return [];

  const order = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];
  return order
    .filter((key) => key in planets)
    .map((key) => {
      const g = GRAHA_NAME[key as GrahaKey];
      const info = planets[key];
      if (typeof info === "string") {
        return {
          key,
          label: g?.ne ?? key,
          labelEn: g?.en ?? key,
          coords: info,
        };
      }
      const rashiNe = info.rashi_ne ?? rashiNeFromNumber(info.rashi);
      const rashiEn = info.rashi_name ?? rashiEnFromNumber(info.rashi) ?? info.rashi_ne;
      return {
        key,
        label: g?.ne ?? key,
        labelEn: g?.en ?? key,
        rashiNe,
        rashiEn,
        coords: planetDegreeCells(info),
      };
    });
}

export function getPlanetsAnchorLabel(p: PanchangaDay, lang?: string): string {
  const detail = getPanchangaDetail(p);
  const anchor = detail?.planets_anchor ?? p.planets_anchor;
  const fallbackNe = "उदयकालिक स्पष्टग्रह (सूर्योदय)";
  const fallbackEn = "Planets at sunrise";
  const label = anchor?.label_ne || anchor?.label_en
    ? pickLocale(
        lang,
        anchor.label_ne ?? anchor.label_en ?? fallbackNe,
        anchor.label_en ?? anchor.label_ne ?? fallbackEn,
      )
    : pickLocale(lang, fallbackNe, fallbackEn);
  const time = anchor?.local_time
    ? formatLocaleDigits(formatTimeShort(anchor.local_time) ?? anchor.local_time, lang)
    : undefined;
  return time ? `${label} (${time})` : label;
}

export interface InauspiciousWindow {
  key: string;
  nameNe: string;
  nameEn: string;
  start: string;
  end: string;
  tillFullNight?: boolean;
}

export function getInauspiciousWindows(p: PanchangaDay): InauspiciousWindow[] {
  const detail = getPanchangaDetail(p);
  const m = (detail?.muhurta ?? p.muhurta) as {
    rahu_kalam?: { start_time?: string; end_time?: string };
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
  } | undefined;
  if (!m) return [];

  const out: InauspiciousWindow[] = [];
  const pushWin = (
    key: string,
    ne: string,
    en: string,
    w?: { start_time?: string; end_time?: string },
  ) => {
    if (w?.start_time && w?.end_time) {
      out.push({ key, nameNe: ne, nameEn: en, start: w.start_time, end: w.end_time });
    }
  };

  pushWin("rahu_kalam", "राहु", "Rahu", m.rahu_kalam);
  pushWin("yamaganda", "यमगण्ड", "Yamaganda", m.yamaganda);
  pushWin("gulika", "गुलिक", "Gulika", m.gulika);

  for (const entry of m.inauspicious_timings ?? []) {
    const key = entry.key || "ashubha";
    const ne = entry.name_ne || entry.name_en || entry.key || "अशुभ";
    const en = entry.name_en || entry.name_ne || entry.key || "Ashubha";
    for (const seg of entry.segments ?? []) {
      if (!seg.start_local_time_short) continue;
      if (seg.until_full_night && !seg.end_local_time_short) {
        out.push({ key, nameNe: ne, nameEn: en, start: seg.start_local_time_short, end: "", tillFullNight: true });
      } else if (seg.end_local_time_short) {
        out.push({
          key,
          nameNe: ne,
          nameEn: en,
          start: seg.start_local_time_short,
          end: seg.end_local_time_short,
        });
      }
    }
  }

  return out;
}
