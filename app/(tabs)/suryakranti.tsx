import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { BsYearPicker, useBsYear } from "@/components/pickers/BsYearMonthPicker";
import { Text } from "@/components/ui/Text";
import { fetchYearSunTimes, sunTimesKeys, type SunYearDay, type SunYearMonth } from "@/lib/api";
import { BS_MONTH_NAMES, BS_MONTHS_NE } from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import {
  formatAyanaMarkShort,
  formatTimeShort,
  isAyanaNorthMark,
  toNepaliDigits,
} from "@/lib/panchanga-format";
import { useThemeColors } from "@/lib/theme-context";
import { displayLocationLabel, usePanchangaLocation } from "@/lib/use-panchanga-location";

/** Matches the web grid's fixed column widths so month headers line up. */
const DAY_COL = 44;
const MONTH_COL = 82;

const AYANA_NORTH = "#2e7d32";
const AYANA_SOUTH = "#c62828";

type SunCell = {
  day: number;
  sunriseDisplay?: string;
  sunsetDisplay?: string;
  ayanaMark?: "उ" | "द";
  ayanaLabel?: string;
};

function dayCell(d: SunYearDay, isEnglish: boolean): SunCell {
  const sunrise = formatTimeShort(d.sunrise);
  const sunset = formatTimeShort(d.sunset);
  const label = d.ayana_mark
    ? isEnglish
      ? (d.aayan ?? d.aayan_ne ?? (d.ayana_mark === "उ" ? "Uttarayana" : "Dakshinayana"))
      : (d.aayan_ne ?? d.aayan)
    : undefined;
  return {
    day: d.day,
    sunriseDisplay: sunrise ? (isEnglish ? sunrise : toNepaliDigits(sunrise)) : undefined,
    sunsetDisplay: sunset ? (isEnglish ? sunset : toNepaliDigits(sunset)) : undefined,
    ayanaMark: d.ayana_mark,
    ayanaLabel: label,
  };
}

function buildGrid(months: SunYearMonth[] | undefined, isEnglish: boolean): Map<string, SunCell> {
  const grid = new Map<string, SunCell>();
  for (const block of months ?? []) {
    for (const d of block.calendar) {
      grid.set(`${block.month_bs}-${d.day}`, dayCell(d, isEnglish));
    }
  }
  return grid;
}

export default function SuryakrantiScreen() {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();
  const { location, setLocation } = usePanchangaLocation();
  const { year, setYear } = useBsYear();
  const isEnglish = lang === "en";
  const locationLabel = displayLocationLabel(location);

  const query = useQuery({
    queryKey: sunTimesKeys.year(year, "bs", location.params),
    queryFn: () => fetchYearSunTimes(year, "bs", location.params),
    staleTime: 1000 * 60 * 60,
  });

  const months = query.data?.months;
  const grid = useMemo(() => buildGrid(months, isEnglish), [months, isEnglish]);

  const byBsMonth = useMemo(() => {
    const map = new Map<number, SunYearMonth>();
    for (const m of months ?? []) map.set(m.month_bs, m);
    return map;
  }, [months]);

  const monthLabels = Array.from({ length: 12 }, (_, idx) => {
    const m = byBsMonth.get(idx + 1);
    if (m) return isEnglish ? m.month_name : m.month_name_ne;
    return isEnglish ? BS_MONTH_NAMES[idx] : BS_MONTHS_NE[idx];
  });
  const getMonthLength = (month: number) => byBsMonth.get(month)?.month_length ?? 30;
  const maxDay = Math.max(30, ...(months ?? []).map((m) => m.month_length));

  return (
    <AppShell
      title={pick("सूर्यक्रान्ति", "Sunrise & Sunset")}
      subtitle={pick(
        `वि.सं. ${digits(year)} को वर्षभरको सूर्योदय र सूर्यास्त`,
        `Sunrise and sunset through BS ${year}`,
      )}
      headerRight={<Ionicons name="sunny-outline" size={26} color={colors.secondary} />}
    >
      <LocationSelector location={location} onLocationChange={setLocation} />
      <BsYearPicker year={year} onYearChange={setYear} />

      <View className="overflow-hidden rounded-xl border border-border bg-card">
        <View className="flex-row flex-wrap gap-3 border-b border-border px-4 pb-2.5 pt-3.5">
          <View className="flex-row items-center gap-1">
            <Ionicons name="arrow-up" size={13} color={colors.primary} />
            <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
              {pick("सूर्योदय", "Sunrise")}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="arrow-down" size={13} color={colors.destructive} />
            <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
              {pick("सूर्यास्त", "Sunset")}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text style={{ color: AYANA_NORTH }} className="text-xs font-bold">
              {pick("उ", "N")}
            </Text>
            <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
              {pick("उत्तरायण", "Uttarayana")}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text style={{ color: AYANA_SOUTH }} className="text-xs font-bold">
              {pick("द", "S")}
            </Text>
            <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
              {pick("दक्षिणायन", "Dakshinayana")}
            </Text>
          </View>
        </View>

        {query.isLoading && !query.data ? (
          <Text className="px-4 py-8 text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
            {pick("लोड हुँदै…", "Loading…")}
          </Text>
        ) : query.isError ? (
          <Text
            style={{ color: colors.destructive, ...nepaliTextStyle(14) }}
            className="px-4 py-8 text-sm"
          >
            {pick("ल्याउन सकिएन।", "Could not load.")}
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View className="flex-row border-b border-border">
                <Text
                  style={{ width: DAY_COL, ...nepaliTextStyle(11) }}
                  className="border-r border-border bg-card px-2 py-2 text-center text-xs font-bold text-foreground"
                >
                  {pick("दिन", "Day")}
                </Text>
                {monthLabels.map((name, idx) => (
                  <Text
                    key={`sun-month-${idx + 1}`}
                    numberOfLines={1}
                    style={{ width: MONTH_COL, ...nepaliTextStyle(11) }}
                    className="border-r border-border bg-card px-1 py-2 text-center text-xs font-bold text-foreground"
                  >
                    {name || " "}
                  </Text>
                ))}
              </View>

              {Array.from({ length: maxDay }, (_, rowIdx) => {
                const day = rowIdx + 1;
                return (
                  <View key={day} className="flex-row border-b border-border">
                    <Text
                      style={{ width: DAY_COL }}
                      className="border-r border-border bg-card px-2 py-2 text-center font-num text-xs font-bold text-foreground"
                    >
                      {digits(day)}
                    </Text>
                    {Array.from({ length: 12 }, (_, colIdx) => {
                      const month = colIdx + 1;
                      if (day > getMonthLength(month)) {
                        return (
                          <View
                            key={month}
                            style={{ width: MONTH_COL, backgroundColor: colors.surfaceMuted, opacity: 0.45 }}
                            className="border-r border-border"
                          />
                        );
                      }
                      const cell = grid.get(`${month}-${day}`);
                      return (
                        <View
                          key={month}
                          style={{ width: MONTH_COL }}
                          className="border-r border-border px-1 py-1.5"
                        >
                          <Text
                            numberOfLines={1}
                            style={{ color: colors.primary }}
                            className="text-center font-num text-[11px]"
                          >
                            {cell?.sunriseDisplay ?? "—"}
                            {cell?.ayanaMark ? (
                              <Text
                                style={{
                                  color: isAyanaNorthMark(cell.ayanaMark)
                                    ? AYANA_NORTH
                                    : AYANA_SOUTH,
                                }}
                                className="text-[10px] font-bold"
                              >
                                {" "}
                                {formatAyanaMarkShort(cell.ayanaMark, lang)}
                              </Text>
                            ) : null}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{ color: colors.destructive }}
                            className="text-center font-num text-[11px]"
                          >
                            {cell?.sunsetDisplay ?? "—"}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      <View
        style={{ borderColor: colors.border }}
        className="mt-4 gap-3 rounded-2xl border bg-card p-4"
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="calendar-outline" size={15} color={colors.secondary} />
          <Text className="text-base font-bold text-foreground" style={nepaliTextStyle(16)}>
            {pick("अयन", "Ayana")}
          </Text>
        </View>
        <Text className="text-sm leading-relaxed text-muted-foreground" style={nepaliTextStyle(14)}>
          <Text style={{ color: AYANA_NORTH }} className="font-semibold">
            {pick("उत्तरायण", "Uttarayana")}
          </Text>
          {pick(
            " भनेको सूर्य उत्तरतर्फ सर्ने अवधि हो — दिन लामो हुँदै जान्छ। ",
            " is the northward course of the Sun — days grow longer. ",
          )}
          <Text style={{ color: AYANA_SOUTH }} className="font-semibold">
            {pick("दक्षिणायन", "Dakshinayana")}
          </Text>
          {pick(
            " मा सूर्य दक्षिणतर्फ सर्छ र दिन छोटो हुँदै जान्छ। तालिकामा यी सङ्क्रान्ति दिनहरू उ/द चिन्हले जनाइएका छन्।",
            " turns the Sun southward and days shorten. Those turning days are marked N/S in the grid.",
          )}
        </Text>
        {locationLabel ? (
          <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
            {pick("स्थान", "Location")}: {locationLabel}
          </Text>
        ) : null}
      </View>
    </AppShell>
  );
}
