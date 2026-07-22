import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
import { useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { BsMonthYearNav, BsNativeSelect } from "@/components/ui/BsNativeSelect";
import { formatClockParts, parseClockParts } from "@/components/panchanga/use-panchanga-mode";

function pickBsDate(onDateChange: (d: Date) => void, year: number, month: number, day: number) {
  const safeDay = Math.min(day, getBSMonthLength(year, month));
  onDateChange(bsToAD(year, month, safeDay));
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
  const { pick, digits, lang } = useLocale();
  const bs = adToBS(date);
  const monthLen = getBSMonthLength(bs.year, bs.month);

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

  const dayOptions = Array.from({ length: monthLen }, (_, i) => ({
    value: i + 1,
    label: digits(i + 1),
  }));

  const monthOptions = BS_MONTH_NAMES.map((_, i) => ({
    value: i + 1,
    label: lang === "en" ? BS_MONTH_NAMES[i] : BS_MONTHS_NE[i],
  }));

  const yearOptions = BS_YEAR_OPTIONS.map((y) => ({ value: y, label: digits(y) }));

  const clockParts = clock ? parseClockParts(clock) : null;
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: digits(String(i).padStart(2, "0")),
  }));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
    value: i,
    label: digits(String(i).padStart(2, "0")),
  }));

  const weekday = date.toLocaleDateString(lang === "en" ? "en-US" : "ne-NP", { weekday: "long" });

  return (
    <View className={cn("gap-2", className)}>
      <View className="flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-1">
          <Text className="text-lg font-bold text-foreground">
            {pick(BS_MONTHS_NE[bs.month - 1], BS_MONTH_NAMES[bs.month - 1])}{" "}
            <Text className="font-num text-secondary">{digits(bs.day)}</Text>
            {" · "}
            <Text className="font-num text-secondary">{digits(bs.year)}</Text>
          </Text>
          <Text className="text-sm text-muted-foreground">{weekday}</Text>
        </View>

        <Pressable
          onPress={() => onDateChange(new Date(`${todayAd}T12:00:00`))}
          accessibilityLabel={pick("आज", "Today")}
          className="shrink-0 rounded-lg border border-border bg-card px-3 py-1.5 active:bg-muted"
        >
          <Text className="text-sm font-semibold text-primary">{pick("आज", "Today")}</Text>
        </Pressable>
      </View>

      <View className="flex-row flex-wrap items-center gap-2">
        <StepBtn disabled={atMinDay} onPress={() => stepDay(-1)} icon="chevron-back" />
        <BsNativeSelect
          value={bs.day}
          options={dayOptions}
          onChange={(nextDay) => pickBsDate(onDateChange, bs.year, bs.month, nextDay)}
          ariaLabel={pick("दिन", "Day")}
          minWidth={52}
        />
        <BsMonthYearNav
          month={bs.month}
          year={bs.year}
          monthOptions={monthOptions}
          yearOptions={yearOptions}
          onMonthChange={(nextMonth) => pickBsDate(onDateChange, bs.year, nextMonth, bs.day)}
          onYearChange={(nextYear) => pickBsDate(onDateChange, nextYear, bs.month, bs.day)}
          monthMinWidth={lang === "en" ? 76 : 88}
          yearMinWidth={72}
        />
        <StepBtn disabled={atMaxDay} onPress={() => stepDay(1)} icon="chevron-forward" />
        {clock != null && onClockChange && clockParts ? (
          <>
            <BsNativeSelect
              value={clockParts.hour}
              options={hourOptions}
              onChange={(hour) =>
                onClockChange(formatClockParts(hour, clockParts.minute))
              }
              ariaLabel={pick("घण्टा", "Hour")}
              minWidth={52}
            />
            <Text className="text-sm font-semibold text-muted-foreground">:</Text>
            <BsNativeSelect
              value={clockParts.minute}
              options={minuteOptions}
              onChange={(minute) =>
                onClockChange(formatClockParts(clockParts.hour, minute))
              }
              ariaLabel={pick("मिनेट", "Minute")}
              minWidth={52}
            />
          </>
        ) : null}
        {toolbar ? <View className="ml-auto shrink-0">{toolbar}</View> : null}
      </View>
    </View>
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
      className={cn(
        "h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border border-border bg-card active:bg-muted",
        disabled && "opacity-40",
      )}
    >
      <Ionicons name={icon} size={16} color={colors.foreground} />
    </Pressable>
  );
}
