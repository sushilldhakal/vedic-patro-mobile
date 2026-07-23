import { useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BS_MONTH_NAMES,
  BS_MONTHS_NE,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  bsToAD,
  getBSMonthLength,
} from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { resolveSamvatsaraForBsYear } from "@/lib/samvatsara";
import { useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { BsDateTimePicker } from "@/components/panchanga/BsDateTimePicker";
import { parseClockParts } from "@/components/panchanga/use-panchanga-mode";

function pickBsDate(onDateChange: (d: Date) => void, year: number, month: number, day: number) {
  const safeDay = Math.min(day, getBSMonthLength(year, month));
  onDateChange(bsToAD(year, month, safeDay));
}

function chipMonthLabel(month: number, lang: string): string {
  if (lang === "en") return BS_MONTH_NAMES[month - 1].slice(0, 3).toUpperCase();
  return BS_MONTHS_NE[month - 1];
}

type Props = {
  date: Date;
  onDateChange: (d: Date) => void;
  todayAd: string;
  clock?: string;
  onClockChange?: (clock: string) => void;
  toolbar?: ReactNode;
  className?: string;
};

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

export function PanchangaDateNav({
  date,
  onDateChange,
  todayAd,
  clock,
  onClockChange,
  toolbar,
  className,
}: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { pick, digits, lang } = useLocale();
  const bs = adToBS(date);
  const todayBs = adToBS(new Date(`${todayAd}T12:00:00`));
  const [pickerOpen, setPickerOpen] = useState(false);

  const stepDay = (delta: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    onDateChange(next);
  };

  const atMinDay = bs.year === BS_SUPPORTED_START_YEAR && bs.month === 1 && bs.day === 1;
  const atMaxDay =
    bs.year === BS_SUPPORTED_END_YEAR &&
    bs.month === 12 &&
    bs.day === getBSMonthLength(bs.year, bs.month);

  const monthTitle = pick(BS_MONTHS_NE[bs.month - 1], BS_MONTH_NAMES[bs.month - 1]);
  const samvatsara = resolveSamvatsaraForBsYear(bs.year);
  const samvatsaraLabel = samvatsara ? pick(samvatsara.name_ne, samvatsara.name_en) : undefined;
  const adDayLabel = bsToAD(bs.year, bs.month, bs.day).toLocaleDateString(
    lang === "en" ? "en-US" : "ne-NP",
    { day: "numeric", month: "short", year: "numeric" },
  );

  const showTime = Boolean(clock && onClockChange);
  const clockSummary = showTime && clock
    ? (() => {
        const { hour, minute } = parseClockParts(clock);
        return `${digits(String(hour).padStart(2, "0"))}:${digits(String(minute).padStart(2, "0"))}`;
      })()
    : null;

  const pickerLabelCompact = clockSummary
    ? `${digits(bs.day)} · ${clockSummary}`
    : `${digits(bs.day)}`;

  return (
    <>
      <View className={cn("mb-4 flex-row items-start gap-2.5", className)}>
        <Pressable
          onPress={() => onDateChange(new Date(`${todayAd}T12:00:00`))}
          accessibilityLabel={pick("आज", "Today")}
          className="shrink-0 overflow-hidden rounded-[10px] border border-border bg-card shadow-sm active:opacity-90"
        >
          <View className="bg-secondary px-2 py-1">
            <Text className="text-center text-[11px] font-bold tracking-wide text-secondary-foreground">
              {chipMonthLabel(todayBs.month, lang)}
            </Text>
          </View>
          <View className="min-w-[2.75rem] items-center justify-center px-2 py-1">
            <Text className="font-num text-base font-bold text-foreground">{digits(todayBs.day)}</Text>
          </View>
        </Pressable>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <Text className="text-lg font-bold leading-tight text-foreground md:text-xl">
                {monthTitle}{" "}
                <Text className="font-num font-bold text-secondary">{digits(bs.year)}</Text>
              </Text>
              {samvatsaraLabel ? (
                <Text className="text-lg font-semibold leading-tight text-foreground/90 md:text-xl">
                  {samvatsaraLabel}
                </Text>
              ) : null}
              <Text className="text-base font-medium leading-snug text-muted-foreground md:text-lg">
                {adDayLabel}
              </Text>
            </View>
            {toolbar ? <View className="shrink-0">{toolbar}</View> : null}
          </View>

          <View className="-mt-1 flex-row items-center gap-1">
            <StepBtn disabled={atMinDay} onPress={() => stepDay(-1)} icon="chevron-back" />
            <Pressable
              onPress={() => setPickerOpen(true)}
              accessibilityLabel={
                showTime
                  ? pick("मिति र समय बदल्नुहोस्", "Change date and time")
                  : pick("मिति बदल्नुहोस्", "Change date")
              }
              className="h-[30px] max-w-[min(100%,10.5rem)] shrink flex-row items-center gap-1 rounded-lg border border-border bg-card px-2 active:bg-muted"
            >
              <Ionicons name="calendar-outline" size={14} color={colors.secondary} />
              <Text numberOfLines={1} className="font-num text-sm font-semibold text-foreground">
                {pickerLabelCompact}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.mutedForeground} />
            </Pressable>
            <StepBtn disabled={atMaxDay} onPress={() => stepDay(1)} icon="chevron-forward" />
          </View>
        </View>
      </View>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Pressable onPress={() => setPickerOpen(false)} hitSlop={8} style={{ minWidth: 72 }}>
              <Text style={{ fontSize: 16, color: colors.mutedForeground }}>
                {pick("रद्द", "Cancel")}
              </Text>
            </Pressable>
            <Text
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 16,
                fontWeight: "600",
                color: colors.foreground,
              }}
              numberOfLines={1}
            >
              {showTime ? pick("मिति र समय", "Date & time") : pick("मिति", "Date")}
            </Text>
            <View style={{ minWidth: 72 }} />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {pickerOpen ? (
              <BsDateTimePicker
                key={`${bs.year}-${bs.month}-${bs.day}-${clock ?? ""}`}
                year={bs.year}
                month={bs.month}
                day={bs.day}
                yearOptions={BS_YEAR_OPTIONS}
                todayAd={todayAd}
                onSelectDate={(y, m, d) => pickBsDate(onDateChange, y, m, d)}
                monthAriaLabel={pick("महिना", "Month")}
                yearAriaLabel={pick("वर्ष", "Year")}
                clock={clock}
                onClockChange={onClockChange}
                hourAriaLabel={pick("घण्टा", "Hour")}
                minuteAriaLabel={pick("मिनेट", "Minute")}
                showTime={showTime}
                onDone={() => setPickerOpen(false)}
              />
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function StepBtn({
  onPress,
  disabled,
  icon,
}: {
  onPress: () => void;
  disabled?: boolean;
  icon: "chevron-back" | "chevron-forward";
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      className={cn(
        "h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border border-border bg-card active:bg-muted",
        disabled && "opacity-40",
      )}
    >
      <Ionicons name={icon} size={16} color={colors.foreground} />
    </Pressable>
  );
}
