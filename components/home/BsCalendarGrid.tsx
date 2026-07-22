import { Pressable, Text, View } from "react-native";
import type { CalendarDay } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";

const WEEKDAYS_NE = ["आइतवार", "सोमवार", "मंगलवार", "बुधवार", "बिहीवार", "शुक्रवार", "शनिवार"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_SHORT = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"];
const GRID_GAP = 1;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

function fmtAdDay(iso: string): number {
  return new Date(`${iso}T12:00:00`).getDate();
}

type Props = {
  days: CalendarDay[];
  selectedAd?: string;
  todayAd: string;
  publicHolidayDates?: Set<string>;
  onSelectDay?: (day: CalendarDay) => void;
  isEnriching?: boolean;
};

export function BsCalendarGrid({
  days,
  selectedAd,
  todayAd,
  publicHolidayDates = new Set(),
  onSelectDay,
  isEnriching,
}: Props) {
  const theme = useThemeColors();
  const { pick, digits, lang } = useLocale();
  const cells: (CalendarDay | null)[] = [...days];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = chunk(cells, 7);

  return (
    <View
      className="overflow-hidden rounded-xl border border-border shadow-sm"
      style={{ backgroundColor: theme.border, gap: GRID_GAP }}
    >
      <View style={{ flexDirection: "row", gap: GRID_GAP }}>
        {(lang === "en" ? WEEKDAYS_EN : WEEKDAYS_SHORT).map((label, i) => {
          const weekend = i === 0 || i === 6;
          return (
            <View
              key={label}
              style={{ flex: 1, minWidth: 0, backgroundColor: theme.surfaceInset }}
              className="items-center px-1 py-2 md:py-2"
            >
              <Text
                className="text-xs font-bold uppercase tracking-wide md:text-sm"
                style={{ color: weekend && lang !== "en" ? theme.danger : theme.text }}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={{ flexDirection: "row", gap: GRID_GAP }}>
          {row.map((day, colIndex) => {
            const cellIndex = rowIndex * 7 + colIndex;

            if (!day) {
              return (
                <View
                  key={`empty-${cellIndex}`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 96,
                    backgroundColor: theme.surfaceMuted,
                  }}
                />
              );
            }

            const col = colIndex;
            const isOutside = day.outsideMonth === true;
            const isToday = day.date_ad === todayAd;
            const isSelected = day.date_ad === selectedAd && !isToday;
            const isWeekend = col === 0 || col === 6;
            const isPublicHoliday = !isOutside && publicHolidayDates.has(day.date_ad);
            const hasFestival = !isOutside && day.festivals.length > 0 && !isPublicHoliday;
            const mainFest = day.festivals[0];
            const tithi = pick(day.tithi_ne ?? day.tithi, day.tithi ?? day.tithi_ne);
            const dayColor =
              !isOutside && (isWeekend || isPublicHoliday)
                ? theme.danger
                : isOutside
                  ? theme.textMuted
                  : theme.text;

            let bg: string = theme.card;
            if (isOutside) bg = theme.surfaceMuted;
            else if (isToday) bg = theme.surfaceToday;
            else if (isPublicHoliday) bg = theme.surfaceTintDanger;

            return (
              <Pressable
                key={day.date_ad}
                onPress={() => onSelectDay?.(day)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 96,
                  backgroundColor: bg,
                  ...(isSelected
                    ? {
                        shadowColor: theme.primary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        borderWidth: 2,
                        borderColor: theme.primary,
                      }
                    : {}),
                }}
                className="p-1 active:opacity-90 md:min-h-[104px] md:p-2"
              >
                <View className="flex-row items-start justify-between gap-1">
                  {tithi ? (
                    <Text
                      numberOfLines={1}
                      className="min-w-0 flex-1 text-left text-[10px] font-bold md:text-xs"
                      style={{ color: theme.text }}
                    >
                      {tithi}
                    </Text>
                  ) : isEnriching && !isOutside ? (
                    <View className="h-1.5 w-6 rounded-full bg-muted-foreground/25" />
                  ) : (
                    <View className="min-w-0 flex-1" />
                  )}
                  <Text
                    className="font-num-bold shrink-0 text-right text-[10px] font-bold md:text-xs"
                    style={{ color: theme.text }}
                  >
                    {digits(fmtAdDay(day.date_ad))}
                  </Text>
                </View>

                <View className="flex-1 items-center justify-center py-1">
                  {isToday ? (
                    <View className="mb-0.5 rounded-full bg-secondary px-1.5 py-0.5">
                      <Text className="text-[10px] font-bold text-secondary-foreground">
                        {pick("आज", "Today")}
                      </Text>
                    </View>
                  ) : null}
                  <Text
                    className="font-num-bold text-2xl font-bold leading-none md:text-3xl"
                    style={{ color: dayColor, opacity: isOutside ? 0.65 : 1 }}
                  >
                    {digits(day.day)}
                  </Text>
                </View>

                {mainFest && !isOutside ? (
                  <Text
                    numberOfLines={2}
                    className="text-center text-[10px] font-bold leading-tight md:text-xs"
                    style={{ color: isPublicHoliday ? theme.danger : theme.text }}
                  >
                    {mainFest}
                  </Text>
                ) : null}
                {hasFestival && !mainFest ? (
                  <View className="mx-auto mt-0.5 h-1 w-1 rounded-full bg-accent" />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
