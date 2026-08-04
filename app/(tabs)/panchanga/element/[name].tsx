import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { NavataraBalamCardGrid } from "@/components/panchanga/NavataraBalamCardGrid";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { defaultClockForTimezone } from "@/components/panchanga/use-panchanga-mode";
import {
  BsMonthPicker,
  BsYearPicker,
  useBsMonth,
  useBsYear,
} from "@/components/pickers/BsYearMonthPicker";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Text } from "@/components/ui/Text";
import {
  elementKeys,
  fetchElementDay,
  fetchElementSpans,
  fetchPanchanga,
  panchangaKeys,
  type ElementSpan,
  type ElementStamp,
  type PanchangaDay,
} from "@/lib/api";
import { getChandraBalamCards, getTaraBalamCards } from "@/lib/balam-cards";
import {
  choghadiyaLegendLabel,
  choghadiyaLegendMarker,
  choghadiyaRowLabel,
  choghadiyaTone,
  CHOGHADIYA_TYPE_KEYS,
  TONE_BY_KEY,
} from "@/lib/choghadiya-display";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import {
  elementDescriptionBlocks,
  ELEMENT_SECTION_LABELS,
} from "@/lib/panchanga-element-descriptions";
import { ELEMENT_BY_ID } from "@/lib/panchanga-elements";
import {
  formatElementStampDisplay,
  getChandrabalamTable,
  getTarabalaTable,
} from "@/lib/panchanga-format";
import { formatRashiDisplay } from "@/lib/rashi-i18n";
import { useBreakpoint } from "@/lib/responsive";
import { colorWithAlpha } from "@/lib/theme";
import { useThemeColors } from "@/lib/theme-context";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";

function clockFromGhati(sunriseMin: number | null, g: number): string | null {
  if (sunriseMin == null) return null;
  const total = sunriseMin + g * 24;
  let h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (h >= 24) h -= 24;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseHHMM(s?: string | null): number | null {
  if (!s) return null;
  const m = s.match(/(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Item width matching the web grid column count at each breakpoint. */
function useGridWidth(phone: number, tablet: number, desktop = tablet): string {
  const { width } = useBreakpoint();
  const cols = width >= 1024 ? desktop : width >= 640 ? tablet : phone;
  return cols === 1 ? "100%" : `${(100 / cols - 1).toFixed(2)}%`;
}

/* ── span (begin→end) view ─────────────────────────────────────────────── */

function SpanBoundary({
  label,
  stamp,
  tone,
}: {
  label: string;
  stamp: ElementStamp;
  tone: "begin" | "end";
}) {
  const { lang, digits } = useLocale();
  const colors = useThemeColors();
  const accent = tone === "begin" ? colors.accent : colors.danger;

  return (
    <View
      style={{ backgroundColor: colorWithAlpha(tone === "begin" ? "#2e7d32" : "#c62828", 0.1) }}
      className="gap-0.5 rounded-md px-2 py-1.5"
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text style={{ color: accent, ...nepaliTextStyle(11) }} className="text-xs font-semibold">
          {label}
        </Text>
        <Text className="font-num text-xs text-foreground">{digits(stamp.time_label)}</Text>
      </View>
      <Text
        className="text-sm font-semibold leading-snug text-foreground"
        style={nepaliTextStyle(14)}
      >
        {formatElementStampDisplay(stamp, lang)}
      </Text>
    </View>
  );
}

function SpanList({ spans }: { spans: ElementSpan[] }) {
  const { lang, pick } = useLocale();
  const width = useGridWidth(1, 2, 3);

  return (
    <View className="flex-row flex-wrap gap-2.5">
      {spans.map((s, i) => (
        <Card key={`${s.name}-${i}`} style={{ width: width as never }} className="gap-2 p-3">
          <View className="flex-row items-baseline justify-between gap-2">
            <Text className="text-base font-bold text-foreground" style={nepaliTextStyle(16)}>
              {lang === "en" ? s.name : s.name_ne}
            </Text>
            {s.paksha ? (
              <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
                {s.paksha === "shukla"
                  ? pick("शुक्ल पक्ष", "Shukla paksha")
                  : pick("कृष्ण पक्ष", "Krishna paksha")}
              </Text>
            ) : null}
          </View>
          <View className="gap-1.5">
            <SpanBoundary label={pick("सुरु", "Begins")} stamp={s.begins} tone="begin" />
            <SpanBoundary label={pick("अन्त्य", "Ends")} stamp={s.ends} tone="end" />
          </View>
        </Card>
      ))}
    </View>
  );
}

/* ── table (per-day) view ──────────────────────────────────────────────── */

type AnyRow = Record<string, unknown>;

function ToneRow({
  label,
  trailing,
  good,
  bad,
  width,
  badge,
}: {
  label: string;
  trailing?: string | null;
  good: boolean;
  bad: boolean;
  width: string;
  badge?: string;
}) {
  const colors = useThemeColors();
  const tone = bad
    ? { bg: colorWithAlpha("#c62828", 0.1), fg: colors.danger }
    : good
      ? { bg: colorWithAlpha("#2e7d32", 0.12), fg: colors.accent }
      : { bg: colors.surfaceInset, fg: colors.foreground };

  return (
    <View
      style={{ width: width as never, backgroundColor: tone.bg }}
      className="flex-row items-center justify-between gap-2 rounded-lg px-3 py-2"
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        <Text
          numberOfLines={2}
          style={{ color: tone.fg, ...nepaliTextStyle(13) }}
          className="shrink text-sm font-semibold"
        >
          {label}
        </Text>
        {badge ? (
          <View
            style={{ backgroundColor: colorWithAlpha("#0b565a", 0.2) }}
            className="rounded-full px-1.5 py-px"
          >
            <Text style={{ color: colors.secondary }} className="text-[10px] font-bold">
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      {trailing ? (
        <Text style={{ color: tone.fg }} className="font-num text-xs opacity-90">
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}

function ChoghadiyaTableView({ data, sunrise }: { data: AnyRow[]; sunrise?: string }) {
  const { lang, pick, digits } = useLocale();
  const width = useGridWidth(1, 2, 3);
  const sunriseMin = parseHHMM(sunrise);

  if (data.length === 0) {
    return (
      <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
        {pick("यो दिनका लागि प्रविष्टि छैन।", "No entries for this day.")}
      </Text>
    );
  }

  return (
    <>
      <View className="mb-3 gap-1">
        {CHOGHADIYA_TYPE_KEYS.map((key) => (
          <Text
            key={key}
            className="text-sm leading-snug text-muted-foreground"
            style={nepaliTextStyle(13)}
          >
            {choghadiyaLegendMarker(TONE_BY_KEY[key])} {choghadiyaLegendLabel(key, lang)}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap gap-1.5">
        {data.map((it, i) => {
          const nameNe = String(it.name_ne ?? it.name ?? "—");
          const tone = choghadiyaTone(nameNe, it.bad as boolean | undefined);
          let time: string | null = null;
          if (it.start_local_time_short) {
            time = `${digits(String(it.start_local_time_short))}–${digits(String(it.end_local_time_short ?? ""))}`;
          } else if (typeof it.start_g === "number") {
            const a = clockFromGhati(sunriseMin, it.start_g);
            const b = clockFromGhati(sunriseMin, it.end_g as number);
            if (a && b) time = `${digits(a)}–${digits(b)}`;
          }
          return (
            <ToneRow
              key={i}
              width={width}
              label={choghadiyaRowLabel(nameNe, lang, it.bad as boolean | undefined)}
              trailing={time}
              good={tone === "good"}
              bad={tone === "bad"}
            />
          );
        })}
      </View>
    </>
  );
}

function TableView({
  data,
  sunrise,
  elementId,
}: {
  data: unknown;
  sunrise?: string;
  elementId?: string;
}) {
  const { lang, pick, digits } = useLocale();
  const gridWidth = useGridWidth(1, 2, 3);
  const balaWidth = useGridWidth(1, 2, 4);
  const sunriseMin = parseHHMM(sunrise);

  // Object with a `rows` array → moon/star strength table (chandrabala/tarabala).
  if (data && typeof data === "object" && Array.isArray((data as AnyRow).rows)) {
    const obj = data as AnyRow;
    const rows = obj.rows as AnyRow[];
    const anchor =
      lang === "en"
        ? String(obj.moon_label_en ?? obj.label_en ?? "")
        : String(obj.moon_label ?? obj.label_ne ?? "");
    return (
      <View className="gap-2">
        {anchor ? (
          <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
            {pick("चन्द्र राशि", "Moon sign")}:{" "}
            <Text className="font-bold text-foreground">{anchor}</Text>
          </Text>
        ) : null}
        <View className="flex-row flex-wrap gap-1.5">
          {rows.map((r, i) => {
            const good = r.tone === "good" || r.quality === "शुभ";
            const bad = r.tone === "bad" || r.quality === "अशुभ";
            const name = lang === "en" ? String(r.name_en ?? r.name ?? "") : String(r.name ?? "");
            const trailing = `${String(r.tara ?? "")}${r.quality ? ` · ${String(r.quality)}` : ""}`;
            return (
              <ToneRow
                key={i}
                width={balaWidth}
                label={name}
                trailing={trailing.trim() || null}
                good={good}
                bad={bad}
              />
            );
          })}
        </View>
      </View>
    );
  }

  // Array of time segments (choghadiya / hora / lagna / panchaka / pushkara).
  if (Array.isArray(data)) {
    const rows = data as AnyRow[];
    if (elementId === "choghadiya") {
      return <ChoghadiyaTableView data={rows} sunrise={sunrise} />;
    }
    if (rows.length === 0) {
      return (
        <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
          {pick("यो दिनका लागि प्रविष्टि छैन।", "No entries for this day.")}
        </Text>
      );
    }
    return (
      <View className="flex-row flex-wrap gap-1.5">
        {rows.map((it, i) => {
          const label =
            lang === "en"
              ? String(it.name ?? it.planet_en ?? it.lagna ?? it.name_ne ?? "—")
              : String(it.name_ne ?? it.planet_ne ?? it.lagna_ne ?? it.name ?? it.lagna ?? "—");
          let time: string | null = null;
          if (it.start_local_time_short) {
            time = `${digits(String(it.start_local_time_short))}–${digits(String(it.end_local_time_short ?? ""))}`;
          } else if (typeof it.start_g === "number") {
            const a = clockFromGhati(sunriseMin, it.start_g as number);
            const b = clockFromGhati(sunriseMin, it.end_g as number);
            if (a && b) time = `${digits(a)}–${digits(b)}`;
          }
          const bad = it.bad === true || it.good === false;
          const good = it.good === true || it.tone === "good";
          const hasPushkara =
            Array.isArray(it.pushkara_navamsha) && (it.pushkara_navamsha as unknown[]).length > 0;
          return (
            <ToneRow
              key={i}
              width={gridWidth}
              label={label}
              trailing={time}
              good={good}
              bad={bad}
              badge={hasPushkara ? pick("पुष्कर", "Pushkara") : undefined}
            />
          );
        })}
      </View>
    );
  }

  return (
    <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
      {pick("डाटा उपलब्ध छैन।", "No data available.")}
    </Text>
  );
}

function NavataraBalamElementView({
  elementId,
  p,
  clock,
}: {
  elementId: "chandrabala" | "tarabala";
  p: PanchangaDay;
  clock?: string;
}) {
  const { lang, pick } = useLocale();
  const isChandra = elementId === "chandrabala";
  const cards = isChandra ? getChandraBalamCards(p) : getTaraBalamCards(p);
  const table = isChandra ? getChandrabalamTable(p) : getTarabalaTable(p);

  const moonLabel = isChandra
    ? formatRashiDisplay(table?.moon_label, table?.moon_label_en, lang)
    : lang === "en"
      ? (table?.moon_label_en ?? table?.moon_label ?? "")
      : (table?.moon_label ?? "");

  const moonRef =
    table?.moon_label && moonLabel
      ? isChandra
        ? pick(`सूर्योदयमा चन्द्र राशि: ${moonLabel}`, `Moon sign at sunrise: ${moonLabel}`)
        : pick(`सूर्योदयमा चन्द्र नक्षत्र: ${moonLabel}`, `Moon nakshatra at sunrise: ${moonLabel}`)
      : undefined;

  const formatName = isChandra
    ? (card: { name: string; nameEn?: string }) =>
        formatRashiDisplay(card.name, card.nameEn, lang) ??
        (lang === "en" ? (card.nameEn ?? card.name) : card.name)
    : (card: { name: string; nameEn?: string }) =>
        lang === "en" ? (card.nameEn ?? card.name) : card.name;

  if (!cards.length) {
    return (
      <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
        {pick("डाटा उपलब्ध छैन।", "No data available.")}
      </Text>
    );
  }

  return (
    <View className="gap-2">
      {moonRef ? (
        <Text className="text-center text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
          {moonRef}
        </Text>
      ) : null}
      <NavataraBalamCardGrid cards={cards} clock={clock} formatName={formatName} lang={lang} />
    </View>
  );
}

function ElementDescription({ elementId }: { elementId: string }) {
  const { lang, pick } = useLocale();
  const colors = useThemeColors();
  const blocks = elementDescriptionBlocks(elementId, lang);
  if (!blocks.length) return null;

  return (
    <Card className="mt-6 gap-4 p-4">
      <Text
        style={{ color: colors.secondary, ...nepaliTextStyle(12) }}
        className="text-xs font-bold uppercase tracking-wider"
      >
        {pick("परिचय", "About")}
      </Text>
      {blocks.map((b) => (
        <View key={b.section} className="gap-1">
          <Text className="text-sm font-bold text-foreground" style={nepaliTextStyle(14)}>
            {pick(ELEMENT_SECTION_LABELS[b.section].ne, ELEMENT_SECTION_LABELS[b.section].en)}
          </Text>
          <Text
            className="text-sm leading-relaxed text-muted-foreground"
            style={nepaliTextStyle(14)}
          >
            {b.body}
          </Text>
        </View>
      ))}
    </Card>
  );
}

/* ── screen ────────────────────────────────────────────────────────────── */

export default function ElementScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { pick } = useLocale();
  const router = useRouter();
  const colors = useThemeColors();
  const { location, setLocation } = usePanchangaLocation();
  const meta = name ? ELEMENT_BY_ID[name] : undefined;
  const isSpan = meta?.kind === "span";
  const isNavataraBal = name === "chandrabala" || name === "tarabala";

  const timezone = resolveTimeZone(undefined, location.params.timezone);
  const todayAd = todayAdStringInTimezone(new Date(), timezone);
  const [date, setDate] = useState(() => new Date(`${todayAd}T12:00:00`));
  const { year, setYear } = useBsYear();
  const { month, setMonth } = useBsMonth();

  const dateAd = useMemo(() => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [date]);

  const spanRange = useMemo(() => ({ era: "bs" as const, year, month }), [year, month]);

  const spanQuery = useQuery({
    queryKey: elementKeys.spans(name ?? "", spanRange, location.params),
    queryFn: () => fetchElementSpans(name!, spanRange, location.params),
    enabled: Boolean(name && meta && isSpan),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  const panchangaQuery = useQuery({
    queryKey: panchangaKeys.day(dateAd, "ad", location.params),
    queryFn: () => fetchPanchanga(dateAd, "ad", location.params),
    enabled: Boolean(name && meta && isNavataraBal),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  const dayQuery = useQuery({
    queryKey: elementKeys.day(name ?? "", dateAd, location.params),
    queryFn: () => fetchElementDay(name!, dateAd, location.params),
    enabled: Boolean(name && meta && !isSpan && !isNavataraBal),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  const elementClock = dateAd === todayAd ? defaultClockForTimezone(timezone) : undefined;

  if (!meta || !name) {
    return (
      <AppShell title={pick("अज्ञात तत्त्व", "Unknown element")}>
        <Pressable onPress={() => router.push("/panchanga/details" as never)}>
          <Text style={{ color: colors.primary }} className="text-sm underline">
            {pick("पञ्चाङ्ग विवरणमा फर्कनुहोस्", "Back to panchanga details")}
          </Text>
        </Pressable>
      </AppShell>
    );
  }

  const renderBody = () => {
    if (isSpan) {
      if (spanQuery.isLoading && !spanQuery.data) return <LoadingState />;
      if (!spanQuery.data) return <ErrorState />;
      return <SpanList spans={spanQuery.data.spans} />;
    }
    if (isNavataraBal) {
      if (panchangaQuery.isLoading && !panchangaQuery.data) return <LoadingState />;
      if (!panchangaQuery.data) return <ErrorState />;
      return (
        <Card className="p-3.5">
          <NavataraBalamElementView
            elementId={name as "chandrabala" | "tarabala"}
            p={panchangaQuery.data}
            clock={elementClock}
          />
        </Card>
      );
    }
    if (dayQuery.isLoading && !dayQuery.data) return <LoadingState />;
    if (!dayQuery.data) return <ErrorState />;
    return (
      <Card className="p-3.5">
        <TableView data={dayQuery.data.data} sunrise={dayQuery.data.sunrise} elementId={name} />
      </Card>
    );
  };

  return (
    <AppShell
      title={pick(meta.titleNe, meta.titleEn)}
      subtitle={pick(meta.blurbNe, meta.blurbEn)}
      headerRight={<Ionicons name="sparkles-outline" size={24} color={colors.secondary} />}
    >
      <LocationSelector location={location} onLocationChange={setLocation} />

      {isSpan ? (
        <View className="mb-4 gap-2">
          <BsYearPicker year={year} onYearChange={setYear} />
          <BsMonthPicker month={month} onMonthChange={setMonth} />
        </View>
      ) : (
        <PanchangaDateNav date={date} onDateChange={setDate} todayAd={todayAd} />
      )}

      {renderBody()}

      <ElementDescription elementId={meta.id} />

      <Pressable
        onPress={() => router.push("/panchanga/details" as never)}
        className="mt-6 flex-row items-center gap-1.5"
      >
        <Ionicons name="grid-outline" size={14} color={colors.primary} />
        <Text style={{ color: colors.primary }} className="text-sm underline">
          {pick("सबै पञ्चाङ्ग तत्त्वहरू", "All panchanga elements")}
        </Text>
      </Pressable>
    </AppShell>
  );
}
