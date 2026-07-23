import { useMemo } from "react";
import { Pressable, View } from "react-native"
import { Text } from "@/components/ui/Text"
import { Ionicons } from "@expo/vector-icons";
import {
  BS_MONTH_NAMES,
  BS_MONTHS_NE,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  bsMonthLabel,
  bsToAD,
  getBSMonthLength,
} from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { resolveSamvatsaraForBsYear } from "@/lib/samvatsara";
import { cn } from "@/lib/utils";
import { useThemeColors } from "@/lib/theme-context";
import { BsMonthYearNav } from "@/components/ui/BsNativeSelect";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { type PanchangaLocation } from "@/lib/use-panchanga-location";
import { patroSegBtn } from "@/lib/patro-classes";
import { nepaliTextStyle } from "@/lib/nepali-text";

export type PakshaFilter = "all" | "krishna" | "shukla";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

type Props = {
  year: number;
  month: number;
  todayAd: string;
  paksha: PakshaFilter;
  onPakshaChange: (paksha: PakshaFilter) => void;
  onToday: () => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  location: PanchangaLocation;
  onLocationChange: (location: PanchangaLocation) => void;
};

function chipMonthLabel(month: number, lang: string): string {
  if (lang === "en") return BS_MONTH_NAMES[month - 1].slice(0, 3).toUpperCase();
  return BS_MONTHS_NE[month - 1];
}

export function DainikKrantiHeader({
  year,
  month,
  todayAd,
  paksha,
  onPakshaChange,
  onToday,
  onMonthChange,
  onYearChange,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  location,
  onLocationChange,
}: Props) {
  const colors = useThemeColors();
  const { pick, digits, lang } = useLocale();
  const todayBs = adToBS(new Date(`${todayAd}T12:00:00`));

  const monthTitle = pick(BS_MONTHS_NE[month - 1], BS_MONTH_NAMES[month - 1]);
  const samvatsara = resolveSamvatsaraForBsYear(year);
  const samvatsaraLabel = samvatsara ? pick(samvatsara.name_ne, samvatsara.name_en) : undefined;

  const adRange = useMemo(() => {
    const start = bsToAD(year, month, 1);
    const end = bsToAD(year, month, getBSMonthLength(year, month));
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const yl = (y: number) => (lang === "en" ? String(y) : digits(y));
    if (startMonth === endMonth && startYear === endYear) return `${startMonth} ${yl(startYear)}`;
    if (startYear === endYear) return `${startMonth}/${endMonth} ${yl(startYear)}`;
    return `${startMonth} ${yl(startYear)}/${endMonth} ${yl(endYear)}`;
  }, [year, month, lang, digits]);

  const monthOptions = useMemo(
    () =>
      BS_MONTH_NAMES.map((_, i) => ({
        value: i + 1,
        label: bsMonthLabel(i + 1, lang),
      })),
    [lang],
  );

  const yearSelectOptions = useMemo(
    () => BS_YEAR_OPTIONS.map((y) => ({ value: y, label: digits(y) })),
    [digits],
  );

  const pakshaOptions: { value: PakshaFilter; label: string }[] = [
    { value: "all", label: pick("सबै", "All") },
    { value: "krishna", label: pick("कृष्ण", "Krishna") },
    { value: "shukla", label: pick("शुक्ल", "Shukla") },
  ];

  return (
    <View className="mb-4">
      <View className="flex-row items-start gap-2.5">
        <Pressable
          onPress={onToday}
          accessibilityLabel={pick("आज", "Today")}
          className="shrink-0 overflow-hidden rounded-[10px] border border-border bg-card shadow-sm active:opacity-90"
        >
          <View className="bg-secondary px-2 py-1">
            <Text
              className="text-center text-[11px] font-bold tracking-wide text-secondary-foreground"
              style={nepaliTextStyle(11)}
            >
              {chipMonthLabel(todayBs.month, lang)}
            </Text>
          </View>
          <View className="min-w-[2.75rem] items-center justify-center px-2 py-1">
            <Text className="font-num text-base font-bold text-foreground">{digits(todayBs.day)}</Text>
          </View>
        </Pressable>

        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <Text className="text-lg font-bold leading-tight text-foreground md:text-xl" style={nepaliTextStyle(18)}>
              {monthTitle}{" "}
              <Text className="font-num font-bold text-secondary">{digits(year)}</Text>
            </Text>
            {samvatsaraLabel ? (
              <Text className="text-lg font-semibold leading-tight text-foreground/90 md:text-xl" style={nepaliTextStyle(18)}>
                {samvatsaraLabel}
              </Text>
            ) : null}
            <Text className="text-base font-medium leading-snug text-muted-foreground md:text-lg">
              {adRange}
            </Text>
          </View>

          <View className="mt-1 flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1 flex-row items-center gap-1">
              <StepBtn disabled={prevDisabled} onPress={onPrev} icon="chevron-back" />
              <BsMonthYearNav
                month={month}
                year={year}
                monthOptions={monthOptions}
                yearOptions={yearSelectOptions}
                onMonthChange={onMonthChange}
                onYearChange={onYearChange}
                monthMinWidth={lang === "en" ? 76 : 88}
                yearMinWidth={72}
              />
              <StepBtn disabled={nextDisabled} onPress={onNext} icon="chevron-forward" />
            </View>

            <View className="shrink-0 items-end gap-2">
              <View
                className="flex-row gap-0.5 overflow-visible rounded-lg border border-border bg-card p-1"
                accessibilityRole="radiogroup"
                accessibilityLabel={pick("पक्ष छान्नुहोस्", "Select paksha")}
              >
                {pakshaOptions.map(({ value, label }) => (
                  <Pressable
                    key={value}
                    onPress={() => onPakshaChange(value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: paksha === value }}
                    className={patroSegBtn(paksha === value)}
                  >
                    <Text
                      className={cn(
                        "text-xs font-semibold",
                        paksha === value ? "text-secondary-foreground" : "text-muted-foreground",
                      )}
                      style={nepaliTextStyle(12)}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <LocationSelector location={location} onLocationChange={onLocationChange} />
            </View>
          </View>
        </View>
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
