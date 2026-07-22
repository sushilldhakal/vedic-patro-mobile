import { Pressable, Text, View } from "react-native";
import type { CalendarDay } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { colors } from "@/lib/theme";

const WEEKDAYS_NE = ["आइतवार", "सोमवार", "मंगलवार", "बुधवार", "बिहीवार", "शुक्रवार", "शनिवार"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_SHORT = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"];

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
  const { pick, digits, lang } = useLocale();
  const cells: (CalendarDay | null)[] = [...days];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
      <View className="flex-row flex-wrap">
        {(lang === "en" ? WEEKDAYS_EN : WEEKDAYS_SHORT).map((label, i) => {
          const weekend = i === 0 || i === 6;
          return (
            <View
              key={label}
              style={{ width: `${100 / 7}%`, backgroundColor: colors.surfaceInset }}
              className="items-center px-1 py-2 md:py-2"
            >
              <Text
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide md:text-sm",
                  weekend && lang !== "en" && "text-danger",
                )}
              >
                {label}
              </Text>
            </View>
          );
        })}

        {cells.map((day, i) => {
          if (!day) {
            return (
              <View
                key={`empty-${i}`}
                style={{ width: `${100 / 7}%`, minHeight: 80, backgroundColor: colors.surfaceMuted }}
              />
            );
          }

          const col = i % 7;
          const isOutside = day.outsideMonth === true;
          const isToday = day.date_ad === todayAd;
          const isSelected = day.date_ad === selectedAd && !isToday;
          const isWeekend = col === 0 || col === 6;
          const isPublicHoliday = !isOutside && publicHolidayDates.has(day.date_ad);
          const hasFestival = !isOutside && day.festivals.length > 0 && !isPublicHoliday;
          const mainFest = day.festivals[0];
          const tithi = pick(day.tithi_ne ?? day.tithi, day.tithi ?? day.tithi_ne);

          let bg: string = colors.card;
          if (isOutside) bg = colors.surfaceMuted;
          else if (isToday) bg = colors.surfaceToday;
          else if (isPublicHoliday) bg = colors.surfaceTintDanger;

          return (
            <Pressable
              key={day.date_ad}
              onPress={() => onSelectDay?.(day)}
              style={{
                width: `${100 / 7}%`,
                minHeight: 96,
                backgroundColor: bg,
                borderWidth: isSelected ? 2 : 0,
                borderColor: colors.primary,
              }}
              className="p-1 active:opacity-90 md:min-h-[104px] md:p-2"
            >
              <View className="flex-row items-start justify-between gap-1">
                {tithi ? (
                  <Text numberOfLines={1} className="min-w-0 flex-1 text-left text-[10px] font-semibold md:text-xs">
                    {tithi}
                  </Text>
                ) : isEnriching && !isOutside ? (
                  <View className="h-1.5 w-6 rounded-full bg-muted-foreground/25" />
                ) : (
                  <View className="min-w-0 flex-1" />
                )}
                <Text className="font-num shrink-0 text-right text-[10px] font-semibold md:text-xs">
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
                  className={cn(
                    "font-num text-2xl font-semibold leading-none md:text-3xl",
                    !isOutside && (isWeekend || isPublicHoliday) && "text-danger",
                    isOutside && "text-muted-foreground/70",
                  )}
                >
                  {digits(day.day)}
                </Text>
              </View>

              {mainFest && !isOutside ? (
                <Text
                  numberOfLines={2}
                  className={cn(
                    "text-center text-[10px] font-semibold leading-tight md:text-xs",
                    isPublicHoliday ? "text-danger" : "text-foreground",
                  )}
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
    </View>
  );
}
