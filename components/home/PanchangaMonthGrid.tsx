import { Pressable, Text, View } from "react-native";
import type { CalendarDay } from "@/lib/api";
import { adToBS } from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import {
  getMonthDayChandraRashi,
  getMonthDayNakshatra,
} from "@/lib/panchanga-month";
import { useThemeColors } from "@/lib/theme-context";
import { VedicPatroLoader } from "@/components/branding/VedicPatroLoader";

const WEEKDAYS_NE = ["आइतवार", "सोमवार", "मंगलवार", "बुधवार", "बिहीवार", "शुक्रवार", "शनिवार"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const GRID_GAP = 1;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

type PakshaPhase = "shukla" | "krishna";

function getPakshaPhase(day: CalendarDay): PakshaPhase | undefined {
  if (day.paksha === "shukla" || day.paksha_ne?.includes("शुक्ल")) return "shukla";
  if (day.paksha === "krishna" || day.paksha_ne?.includes("कृष्ण")) return "krishna";
  return undefined;
}

function formatTithiWithPaksha(day: CalendarDay, isEn: boolean): string {
  const tithi = isEn ? (day.tithi ?? day.tithi_ne ?? "—") : (day.tithi_ne ?? day.tithi ?? "—");
  const phase = getPakshaPhase(day);
  const pakshaLabel = (() => {
    if (phase === "shukla") return isEn ? "Shukla" : "शुक्ल";
    if (phase === "krishna") return isEn ? "Krishna" : "कृष्ण";
    if (!isEn && day.paksha_ne) return day.paksha_ne.replace(/\s*पक्ष$/, "");
    return undefined;
  })();
  if (!pakshaLabel) return tithi;
  return `${pakshaLabel} ${tithi}`;
}

function timeShort(v?: string): string {
  if (!v) return "—";
  return v.slice(0, 5);
}

type Props = {
  days: CalendarDay[];
  year: number;
  month: number;
  todayAd: string;
  selectedAd?: string;
  loading?: boolean;
  onPickDay: (day: CalendarDay) => void;
};

export function PanchangaMonthGrid({
  days,
  year,
  month,
  todayAd,
  selectedAd,
  loading,
  onPickDay,
}: Props) {
  const theme = useThemeColors();
  const { pick, digits, lang } = useLocale();
  const isEn = lang === "en";
  const todayBs = adToBS(new Date(`${todayAd}T12:00:00`));
  const monthDays = days.filter((d) => !d.outsideMonth);
  const firstWeekday = monthDays[0] ? new Date(`${monthDays[0].date_ad}T12:00:00`).getDay() : 0;

  const cells: (CalendarDay | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...monthDays,
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = chunk(cells, 7);

  return (
    <View
      className="relative overflow-hidden rounded-xl border border-border shadow-sm"
      style={{ backgroundColor: theme.border, gap: GRID_GAP }}
    >
      {loading ? (
        <View className="absolute inset-0 z-10 items-center justify-center bg-background/75">
          <VedicPatroLoader size={88} />
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: GRID_GAP }}>
        {WEEKDAYS_NE.map((ne, i) => {
          const weekend = i === 0 || i === 6;
          return (
            <View
              key={ne}
              style={{ flex: 1, minWidth: 0, backgroundColor: theme.background }}
              className="items-center px-1 py-2"
            >
              <Text
                className="text-xs font-bold md:text-sm"
                style={{ color: weekend ? theme.danger : theme.text }}
              >
                {pick(ne, WEEKDAYS_EN[i])}
              </Text>
            </View>
          );
        })}
      </View>

      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={{ flexDirection: "row", gap: GRID_GAP }}>
          {row.map((day, colIndex) => {
            if (!day) {
              return (
                <View
                  key={`empty-${rowIndex}-${colIndex}`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 130,
                    backgroundColor: theme.surfaceMuted,
                  }}
                />
              );
            }

            const ad = new Date(`${day.date_ad}T12:00:00`);
            const phase = getPakshaPhase(day);
            const isToday =
              day.day === todayBs.day && month === todayBs.month && year === todayBs.year;
            const isSel = day.date_ad === selectedAd;
            const isKrishna = phase === "krishna";
            const chandraRashi = getMonthDayChandraRashi(day, lang) ?? "—";
            const nakshatra = getMonthDayNakshatra(day, lang) ?? "—";

            let bg: string = theme.card;
            if (isKrishna) bg = theme.background;
            if (isToday) bg = theme.surfaceToday;

            return (
              <Pressable
                key={day.date_ad}
                onPress={() => onPickDay(day)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 130,
                  backgroundColor: bg,
                  ...(isSel ? { borderWidth: 2, borderColor: theme.primary } : {}),
                }}
                className="gap-0.5 p-1 active:opacity-90"
              >
                <Text
                  numberOfLines={2}
                  className="text-center text-[10px] font-bold leading-snug"
                  style={{ color: theme.text }}
                >
                  {formatTithiWithPaksha(day, isEn)}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-center text-[10px] font-bold"
                  style={{ color: theme.secondary }}
                >
                  {nakshatra}
                </Text>

                <View className="flex-1 flex-col items-center justify-center gap-0.5 py-0.5">
                  <Text
                    className="font-num-bold text-[10px] font-bold"
                    style={{ color: theme.textMuted }}
                  >
                    {digits(timeShort(day.sunrise))}
                  </Text>
                  <View className="flex-row items-baseline gap-1">
                    <Text
                      className="font-num-bold text-lg font-bold leading-none"
                      style={{ color: theme.text }}
                    >
                      {digits(day.day)}
                    </Text>
                    <Text
                      className="font-num-bold text-[10px] font-bold"
                      style={{ color: theme.textMuted }}
                    >
                      {ad.getDate()}
                    </Text>
                  </View>
                  <Text
                    className="font-num-bold text-[10px] font-bold"
                    style={{ color: theme.textMuted }}
                  >
                    {digits(timeShort(day.sunset))}
                  </Text>
                </View>

                <View className="flex-row flex-wrap justify-center gap-x-1">
                  <Text
                    numberOfLines={1}
                    className="max-w-[32%] text-center text-[9px] font-bold"
                    style={{ color: theme.secondary }}
                  >
                    {chandraRashi}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="max-w-[32%] text-center text-[9px] font-bold"
                    style={{ color: theme.text }}
                  >
                    {pick(day.yoga_ne ?? day.yoga ?? "—", day.yoga ?? day.yoga_ne ?? "—")}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="max-w-[32%] text-center text-[9px] font-bold"
                    style={{ color: theme.text }}
                  >
                    {pick(day.karana_ne ?? day.karana ?? "—", day.karana ?? day.karana_ne ?? "—")}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
