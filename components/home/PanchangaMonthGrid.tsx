import { Pressable, Text, View } from "react-native";
import type { CalendarDay } from "@/lib/api";
import { CalendarMoonPhaseIcon } from "@/components/panchanga/CalendarMoonPhaseIcon";
import { useLocale } from "@/lib/i18n";
import {
  getMonthDayChandraRashi,
  getMonthDayKarana,
  getMonthDayNakshatra,
  getMonthDayYoga,
} from "@/lib/panchanga-month";
import { useThemeColors } from "@/lib/theme-context";
import { nepaliDayNumberStyle, nepaliTextStyle } from "@/lib/nepali-text";
import { useBreakpoint } from "@/lib/responsive";
import { tithiIndexFromCalendarDay } from "@/lib/tithi-wheel-data";
import { getSecondaryCellDate } from "@/lib/local-calendar";
import { cn } from "@/lib/utils";
import { VerticalEdgeLabel } from "@/components/home/VerticalEdgeLabel";
import { VedicPatroLoader } from "@/components/branding/VedicPatroLoader";
import {
  CALENDAR_GRID_GAP,
  calendarColStyle,
  selectionRingStyle,
  useCalendarGridWidth,
} from "./calendar-grid-layout";

const WEEKDAYS_NE = ["आइतवार", "सोमवार", "मंगलवार", "बुधवार", "बिहीवार", "शुक्रवार", "शनिवार"];
const WEEKDAYS_SHORT_NE = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function moonPhaseTitle(phase: PakshaPhase | undefined, isEn: boolean): string | undefined {
  if (phase === "shukla") return isEn ? "Shukla paksha (waxing moon)" : "शुक्ल पक्ष";
  if (phase === "krishna") return isEn ? "Krishna paksha (waning moon)" : "कृष्ण पक्ष";
  return undefined;
}

function formatTithiLabel(day: CalendarDay, isEn: boolean): string {
  return isEn ? (day.tithi ?? day.tithi_ne ?? "—") : (day.tithi_ne ?? day.tithi ?? "—");
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
  /** Phone home: calendar spans full width like vedicpatro.com max-md. */
  edgeToEdge?: boolean;
};

export function PanchangaMonthGrid({
  days,
  todayAd,
  selectedAd,
  loading,
  onPickDay,
  edgeToEdge = false,
}: Props) {
  const theme = useThemeColors();
  const { pick, digits, lang } = useLocale();
  const { isTablet, isCompact, isCalendarWide } = useBreakpoint();
  const { onLayout, colWidth } = useCalendarGridWidth();
  const col = (extra?: object) => calendarColStyle(colWidth, extra);
  const metaSize = isCalendarWide ? 12 : isTablet ? 12 : 11;
  const bottomSize = isCalendarWide ? 12 : isTablet ? 11 : 10;
  const weekdaySize = isCalendarWide ? 14 : isTablet ? 14 : 12;
  const dayNumSize = isCalendarWide ? 18 : isTablet ? 24 : 20;
  const wideDayNumSize = 18;
  const dayNumStyle =
    lang === "en"
      ? { fontSize: dayNumSize, lineHeight: dayNumSize + 4 }
      : nepaliDayNumberStyle(dayNumSize);
  const wideDayNumStyle =
    lang === "en"
      ? { fontSize: wideDayNumSize, lineHeight: wideDayNumSize + 4 }
      : nepaliDayNumberStyle(wideDayNumSize);
  const metaTextStyle = lang === "en" ? undefined : nepaliTextStyle(metaSize);
  const bottomTextStyle = lang === "en" ? undefined : nepaliTextStyle(bottomSize);
  const weekdayTextStyle = lang === "en" ? undefined : nepaliTextStyle(weekdaySize);
  const metaNumStyle = (size: number) =>
    lang === "en" ? { fontSize: size, lineHeight: size + 2 } : nepaliDayNumberStyle(size);
  const isEn = lang === "en";

  const rows = chunk(days, 7);
  const moonSize = isCalendarWide ? 16 : isCompact ? 14 : 16;
  const cellMinH = isCalendarWide ? 118 : 96;

  return (
    <View
      onLayout={onLayout}
      className={cn(
        "relative border border-border",
        isCalendarWide ? "overflow-visible" : "overflow-hidden",
        edgeToEdge ? "rounded-none border-x-0 shadow-none" : "rounded-xl shadow-sm",
      )}
      style={{ backgroundColor: theme.border, gap: CALENDAR_GRID_GAP }}
    >
      {loading ? (
        <View className="absolute inset-0 z-10 items-center justify-center bg-background/75">
          <VedicPatroLoader size={88} />
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: CALENDAR_GRID_GAP }}>
        {(isCalendarWide ? WEEKDAYS_NE : WEEKDAYS_SHORT_NE).map((ne, i) => {
          const weekend = i === 0 || i === 6;
          return (
            <View
              key={`${ne}-${i}`}
              style={col({ backgroundColor: theme.background })}
              className={cn(
                "justify-center py-2",
                isCalendarWide ? "items-center px-0.5" : "px-1",
              )}
            >
              <Text
                numberOfLines={1}
                className={cn("w-full font-bold", isCalendarWide ? "text-center" : "text-left")}
                style={[
                  { color: weekend ? theme.danger : theme.text, fontSize: weekdaySize },
                  weekdayTextStyle,
                ]}
              >
                {pick(ne, WEEKDAYS_EN[i])}
              </Text>
            </View>
          );
        })}
      </View>

      {rows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={{ flexDirection: "row", gap: CALENDAR_GRID_GAP, overflow: isCalendarWide ? "visible" : "hidden" }}
        >
          {row.map((day, colIndex) => {
            const cellIndex = rowIndex * 7 + colIndex;
            const isOutside = day.outsideMonth === true;
            const ad = new Date(`${day.date_ad}T12:00:00`);
            const phase = getPakshaPhase(day);
            const isToday = day.date_ad === todayAd;
            const isSel = day.date_ad === selectedAd && !isToday;
            const chandraRashi = getMonthDayChandraRashi(day, lang) ?? "—";
            const nakshatra = getMonthDayNakshatra(day, lang) ?? "—";
            const yogaLabel = getMonthDayYoga(day, lang);
            const karanaLabel = getMonthDayKarana(day, lang);
            const secondary = getSecondaryCellDate(day, "bs", lang, cellIndex === 0);
            const secondaryLabel = secondary.monthLabel
              ? `${secondary.monthLabel} ${digits(secondary.day)}`
              : digits(secondary.day);
            const sunRise = digits(timeShort(day.sunrise));
            const sunSet = digits(timeShort(day.sunset));
            const hasSunTimes = Boolean(day.sunrise || day.sunset);
            const muted = isOutside ? 0.65 : 1;
            const tithiIdx = tithiIndexFromCalendarDay(day);
            const moonTitle = moonPhaseTitle(phase, isEn);

            let bg: string = theme.card;
            if (isOutside) bg = theme.surfaceMuted;
            if (isToday) bg = theme.surfaceToday;

            return (
              <Pressable
                key={day.date_ad}
                onPress={() => onPickDay(day)}
                style={col({
                  minHeight: cellMinH,
                  backgroundColor: bg,
                  overflow: isCalendarWide ? "visible" : "hidden",
                })}
                className={cn(
                  "relative flex-col justify-between gap-0.5 active:opacity-90",
                  isCalendarWide ? "items-center p-1" : "items-start p-1",
                  isCalendarWide && hasSunTimes && "px-3.5",
                )}
              >
                {isSel ? <View style={selectionRingStyle(theme.primary)} /> : null}

                {tithiIdx != null ? (
                  <View
                    style={{
                      position: "absolute",
                      top: isCalendarWide ? 4 : 2,
                      right: isCalendarWide ? 4 : 2,
                      zIndex: 2,
                      pointerEvents: "none",
                    }}
                  >
                    <CalendarMoonPhaseIcon tithiIndex={tithiIdx} size={moonSize} title={moonTitle} />
                  </View>
                ) : null}

                {isCalendarWide && hasSunTimes ? (
                  <>
                    {day.sunrise ? (
                      <VerticalEdgeLabel
                        text={sunRise}
                        side="left"
                        color={theme.textMuted}
                        className="font-normal"
                      />
                    ) : null}
                    {day.sunset ? (
                      <VerticalEdgeLabel
                        text={sunSet}
                        side="right"
                        color={theme.textMuted}
                        className="font-normal"
                      />
                    ) : null}
                  </>
                ) : null}

                {isCalendarWide ? (
                  <View className="min-w-0 w-full flex-1 items-center">
                    <Text
                      numberOfLines={2}
                      className="w-full text-center font-bold"
                      style={[
                        { color: theme.text, fontSize: metaSize, opacity: muted },
                        metaTextStyle,
                      ]}
                    >
                      {formatTithiLabel(day, isEn)}
                    </Text>
                    <Text
                      numberOfLines={2}
                      className="w-full text-center font-bold"
                      style={[
                        { color: theme.secondary, fontSize: metaSize, opacity: muted },
                        metaTextStyle,
                      ]}
                    >
                      {nakshatra}
                    </Text>
                    <View className="flex-row flex-wrap items-baseline justify-center gap-x-1 py-0.5">
                      <Text
                        className={lang === "en" ? "font-num-bold font-bold" : "font-bold"}
                        style={[{ color: theme.text, opacity: muted }, wideDayNumStyle]}
                      >
                        {digits(day.day)}
                      </Text>
                      <Text
                        className={lang === "en" ? "font-num font-semibold" : "font-semibold"}
                        style={[
                          { color: theme.textMuted, opacity: muted },
                          metaNumStyle(secondary.monthLabel ? 10 : metaSize),
                        ]}
                      >
                        {secondaryLabel}
                      </Text>
                    </View>
                    <View className="w-full flex-row gap-0.5">
                      <Text
                        numberOfLines={2}
                        className="min-w-0 flex-1 text-center font-bold"
                        style={[
                          { color: theme.secondary, fontSize: bottomSize, opacity: muted },
                          bottomTextStyle,
                        ]}
                      >
                        {chandraRashi}
                      </Text>
                      <Text
                        numberOfLines={2}
                        className="min-w-0 flex-1 text-center font-bold"
                        style={[
                          { color: theme.text, fontSize: bottomSize, opacity: muted },
                          bottomTextStyle,
                        ]}
                      >
                        {karanaLabel}
                      </Text>
                    </View>
                    <Text
                      numberOfLines={2}
                      className="w-full text-center font-bold"
                      style={[
                        { color: theme.text, fontSize: bottomSize, opacity: muted },
                        bottomTextStyle,
                      ]}
                    >
                      {yogaLabel}
                    </Text>
                  </View>
                ) : (
                  <>
                <View className="min-w-0 w-full items-start">
                  <View className="flex-row items-baseline gap-1">
                    <Text
                      className={lang === "en" ? "font-num-bold font-bold" : "font-bold"}
                      style={[{ color: theme.text, opacity: muted }, dayNumStyle]}
                    >
                      {digits(day.day)}
                    </Text>
                    <Text
                      className={lang === "en" ? "font-num-bold font-bold" : "font-bold"}
                      style={[
                        { color: theme.textMuted, opacity: muted },
                        metaNumStyle(metaSize),
                      ]}
                    >
                      {digits(ad.getDate())}
                    </Text>
                  </View>

                  <Text
                    numberOfLines={2}
                    className="w-full text-left font-bold"
                    style={[
                      { color: theme.text, fontSize: metaSize, opacity: muted },
                      metaTextStyle,
                    ]}
                  >
                    {formatTithiLabel(day, isEn)}
                  </Text>
                  <Text
                    numberOfLines={2}
                    className="w-full text-left font-bold"
                    style={[
                      { color: theme.secondary, fontSize: metaSize, opacity: muted },
                      metaTextStyle,
                    ]}
                  >
                    {nakshatra}
                  </Text>
                  <View className="w-full flex-row flex-wrap items-baseline gap-x-1">
                    {chandraRashi !== "—" ? (
                      <Text
                        className="shrink text-left font-bold"
                        style={[
                          { color: theme.secondary, fontSize: bottomSize, opacity: muted },
                          bottomTextStyle,
                        ]}
                      >
                        {chandraRashi}
                      </Text>
                    ) : null}
                    {chandraRashi !== "—" && yogaLabel !== "—" ? (
                      <Text
                        className="font-bold"
                        style={[
                          { color: theme.textMuted, fontSize: bottomSize, opacity: muted },
                          bottomTextStyle,
                        ]}
                      >
                        ·
                      </Text>
                    ) : null}
                    {yogaLabel !== "—" ? (
                      <Text
                        className="min-w-0 shrink text-left font-bold"
                        style={[
                          { color: theme.text, fontSize: bottomSize, opacity: muted },
                          bottomTextStyle,
                        ]}
                      >
                        {yogaLabel}
                      </Text>
                    ) : chandraRashi === "—" || !chandraRashi ? (
                      <Text
                        className="text-left font-bold"
                        style={[
                          { color: theme.text, fontSize: bottomSize, opacity: muted },
                          bottomTextStyle,
                        ]}
                      >
                        —
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    numberOfLines={2}
                    className="w-full text-left font-bold"
                    style={[
                      { color: theme.text, fontSize: bottomSize, opacity: muted },
                      bottomTextStyle,
                    ]}
                  >
                    {karanaLabel}
                  </Text>
                </View>

                <View className="mt-auto w-full flex-row items-center gap-2 pt-0.5">
                  <Text
                    className={lang === "en" ? "font-num-bold font-bold" : "font-bold"}
                    style={[
                      { color: theme.textMuted, opacity: muted },
                      metaNumStyle(metaSize),
                    ]}
                  >
                    {sunRise}
                  </Text>
                  <Text
                    className={lang === "en" ? "font-num-bold font-bold" : "font-bold"}
                    style={[
                      { color: theme.textMuted, opacity: muted },
                      metaNumStyle(metaSize),
                    ]}
                  >
                    {sunSet}
                  </Text>
                </View>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
