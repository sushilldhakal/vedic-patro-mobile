import { Pressable, Text, View } from "react-native";
import type { CalendarDay } from "@/lib/api";
import { adToBS } from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { colors } from "@/lib/theme";
import { VedicPatroLoader } from "@/components/branding/VedicPatroLoader";

const WEEKDAYS_NE = ["आइतवार", "सोमवार", "मंगलवार", "बुधवार", "बिहीवार", "शुक्रवार", "शनिवार"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  const { pick, digits, lang } = useLocale();
  const isEn = lang === "en";
  const todayBs = adToBS(new Date(`${todayAd}T12:00:00`));
  const monthDays = days.filter((d) => !d.outsideMonth);
  const firstWeekday = monthDays[0] ? new Date(`${monthDays[0].date_ad}T12:00:00`).getDay() : 0;
  const blanks = Array.from({ length: firstWeekday }, (_, i) => i);

  return (
    <View className="relative overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
      {loading ? (
        <View className="absolute inset-0 z-10 items-center justify-center bg-background/75">
          <VedicPatroLoader size={88} />
        </View>
      ) : null}

      <View className="flex-row flex-wrap border-b border-border">
        {WEEKDAYS_NE.map((ne, i) => {
          const weekend = i === 0 || i === 6;
          return (
            <View
              key={ne}
              style={{ width: `${100 / 7}%`, backgroundColor: colors.background }}
              className="items-center px-1 py-2"
            >
              <Text
                className={cn(
                  "text-xs font-semibold md:text-sm",
                  weekend && "text-danger",
                )}
              >
                {pick(ne, WEEKDAYS_EN[i])}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="flex-row flex-wrap">
        {blanks.map((b) => (
          <View
            key={`b-${b}`}
            style={{ width: `${100 / 7}%`, minHeight: 130, backgroundColor: colors.surfaceMuted }}
          />
        ))}

        {monthDays.map((day) => {
          const ad = new Date(`${day.date_ad}T12:00:00`);
          const phase = getPakshaPhase(day);
          const isToday =
            day.day === todayBs.day && month === todayBs.month && year === todayBs.year;
          const isSel = day.date_ad === selectedAd;
          const isKrishna = phase === "krishna";

          let bg: string = colors.card;
          if (isKrishna) bg = colors.background;
          if (isToday) bg = colors.surfaceToday;

          return (
            <Pressable
              key={day.date_ad}
              onPress={() => onPickDay(day)}
              style={{
                width: `${100 / 7}%`,
                minHeight: 130,
                backgroundColor: bg,
                borderWidth: isSel ? 2 : 0,
                borderColor: colors.primary,
              }}
              className="gap-0.5 p-1 active:opacity-90"
            >
              <Text numberOfLines={2} className="text-center text-[10px] font-semibold leading-snug text-foreground">
                {formatTithiWithPaksha(day, isEn)}
              </Text>
              <Text numberOfLines={1} className="text-center text-[10px] font-semibold text-secondary">
                {pick(day.nakshatra_ne ?? day.nakshatra ?? "—", day.nakshatra ?? day.nakshatra_ne ?? "—")}
              </Text>

              <View className="flex-1 flex-col items-center justify-center gap-0.5 py-0.5">
                <Text className="font-num text-[10px] text-muted-foreground">
                  {digits(timeShort(day.sunrise))}
                </Text>
                <View className="flex-row items-baseline gap-1">
                  <Text className="font-num text-lg font-bold leading-none text-foreground">
                    {digits(day.day)}
                  </Text>
                  <Text className="font-num text-[10px] text-muted-foreground">{ad.getDate()}</Text>
                </View>
                <Text className="font-num text-[10px] text-muted-foreground">
                  {digits(timeShort(day.sunset))}
                </Text>
              </View>

              <View className="flex-row flex-wrap justify-center gap-x-1">
                <Text numberOfLines={1} className="max-w-[32%] text-center text-[9px] font-bold text-secondary">
                  {pick(day.yoga_ne ?? day.yoga ?? "—", day.yoga ?? day.yoga_ne ?? "—")}
                </Text>
                <Text numberOfLines={1} className="max-w-[32%] text-center text-[9px] font-bold text-foreground">
                  {pick(day.karana_ne ?? day.karana ?? "—", day.karana ?? day.karana_ne ?? "—")}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
