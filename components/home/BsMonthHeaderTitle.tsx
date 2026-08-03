import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BS_MONTH_NAMES,
  BS_MONTHS_NE,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  bsMonthLabel,
  getBSMonthLength,
} from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { BS_MONTHS_SHORT } from "@/lib/patro-month-labels";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { resolveSamvatsaraForBsYear } from "@/lib/samvatsara";
import { cn } from "@/lib/utils";
import { useThemeColors } from "@/lib/theme-context";
import { useBreakpoint } from "@/lib/responsive";
import { BsMonthYearNav } from "@/components/ui/BsNativeSelect";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { type MonthBrowseEra } from "@/lib/api";
import { type PanchangaLocation } from "@/lib/use-panchanga-location";
import { type HomePatroView } from "./PatroViewToggle";
import { PatroMonthDateSheet } from "./PatroMonthDateSheet";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

type Props = {
  year: number;
  month: number;
  onToday: () => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  patroView: HomePatroView;
  onPatroViewChange: (view: HomePatroView) => void;
  location: PanchangaLocation;
  onLocationChange: (location: PanchangaLocation) => void;
  crossEraSubtitle?: string;
  browseEra?: MonthBrowseEra;
  onBrowseEraChange?: (era: MonthBrowseEra) => void;
};

function chipMonthLabel(month: number, lang: string): string {
  if (lang === "en") return BS_MONTHS_SHORT[month - 1].toUpperCase();
  return BS_MONTHS_NE[month - 1];
}

function monthChipSpan(year: number, month: number, digits: (n: number) => string): string {
  const length = getBSMonthLength(year, month);
  return `${digits(1)}-${digits(length)}`;
}

export function BsMonthHeaderTitle({
  year,
  month,
  onToday,
  onMonthChange,
  onYearChange,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  patroView,
  onPatroViewChange,
  location,
  onLocationChange,
  crossEraSubtitle,
  browseEra = "bs",
  onBrowseEraChange,
}: Props) {
  const colors = useThemeColors();
  const { pick, digits, lang } = useLocale();
  const { isCompact } = useBreakpoint();
  const [dateSheetOpen, setDateSheetOpen] = useState(false);

  const samvatsara = resolveSamvatsaraForBsYear(year);
  const samvatsaraLabel = samvatsara ? pick(samvatsara.name_ne, samvatsara.name_en) : undefined;

  const monthTitleShort =
    lang === "en" ? BS_MONTHS_SHORT[month - 1].toUpperCase() : pick(BS_MONTHS_NE[month - 1], BS_MONTH_NAMES[month - 1]);

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

  const nextView: HomePatroView = patroView === "calendar" ? "panchanga" : "calendar";
  const nextViewLabel = nextView === "panchanga" ? pick("पञ्चाङ्ग", "Panchanga") : pick("वि.सं.", "B.S.");

  const eraShort = browseEra === "bbs" ? pick("बि.सं.", "B.B.S.") : pick("वि.सं.", "B.S.");
  const mobileTitle = (
    <View className="min-w-0 flex-row flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <Text className="font-num text-sm font-semibold text-secondary" style={nepaliTextStyle(14)}>
        {digits(year)} {eraShort}
      </Text>
      {samvatsaraLabel ? (
        <Text
          className="text-sm font-semibold text-secondary"
          style={lang === "en" ? undefined : nepaliTextStyle(14)}
        >
          {samvatsaraLabel}
        </Text>
      ) : null}
      {crossEraSubtitle ? (
        <Text className="text-xs font-semibold text-muted-foreground">{crossEraSubtitle}</Text>
      ) : null}
    </View>
  );

  const desktopTitle = (
    <View className="min-w-0 flex-row flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <Text className="text-lg font-bold leading-tight text-foreground md:text-xl" style={nepaliTextStyle(18)}>
        {pick(BS_MONTHS_NE[month - 1], BS_MONTH_NAMES[month - 1])}{" "}
        <Text className="font-num font-bold text-secondary">{digits(year)}</Text>
      </Text>
      {samvatsaraLabel ? (
        <Text className="text-lg font-semibold leading-tight text-foreground/90" style={nepaliTextStyle(18)}>
          {samvatsaraLabel}
        </Text>
      ) : null}
      {crossEraSubtitle ? (
        <Text className="text-base font-medium leading-snug text-muted-foreground">{crossEraSubtitle}</Text>
      ) : null}
    </View>
  );

  const viewToggle = (
    <Pressable
      onPress={() => onPatroViewChange(nextView)}
      accessibilityLabel={pick("पात्रो प्रकार बदल्नुहोस्", "Switch patro type")}
      className="h-[30px] shrink-0 flex-row items-center gap-1 rounded-lg border border-border bg-card px-2 active:bg-muted"
    >
      <Ionicons name="swap-horizontal" size={14} color={colors.foreground} />
      <Text className="text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
        {nextViewLabel}
      </Text>
    </Pressable>
  );

  const dateChipButton = (
    <Pressable
      onPress={() => setDateSheetOpen(true)}
      className="h-[30px] min-w-0 flex-1 flex-row items-center justify-center gap-1 rounded-lg border border-border bg-card px-2 active:bg-muted"
    >
      <Text numberOfLines={1} className="font-num text-sm font-semibold text-foreground">
        {monthTitleShort}
      </Text>
      <Ionicons name="chevron-down" size={12} color={colors.mutedForeground} />
    </Pressable>
  );

  return (
    <View className="mb-4">
      <View className="flex-row items-start gap-1.5 sm:gap-3">
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
              {chipMonthLabel(month, lang)}
            </Text>
          </View>
          <View className="min-w-[2.75rem] items-center justify-center px-2 py-1">
            <Text className="font-num text-xs font-bold text-foreground">{monthChipSpan(year, month, digits)}</Text>
          </View>
        </Pressable>

        <View className="min-w-0 flex-1">
          {isCompact ? (
            <View className="gap-0.5">
              <View className="flex-row items-center justify-between gap-2">
                <View className="min-w-0 flex-1 self-center">{mobileTitle}</View>
                {viewToggle}
              </View>
              <View className="-mt-0.5 flex-row items-center justify-between gap-2">
                <View className="min-w-0 flex-1 flex-row items-center gap-1">
                  <StepBtn disabled={prevDisabled} onPress={onPrev} icon="chevron-back" />
                  {dateChipButton}
                  <StepBtn disabled={nextDisabled} onPress={onNext} icon="chevron-forward" />
                </View>
                <LocationSelector location={location} onLocationChange={onLocationChange} />
              </View>
            </View>
          ) : (
            <>
              <View className="flex-row items-start justify-between gap-2">
                <View className="min-w-0 flex-1">{desktopTitle}</View>
                {viewToggle}
              </View>
              <View className="-mt-1 flex-row items-center justify-between gap-2">
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
                <LocationSelector location={location} onLocationChange={onLocationChange} />
              </View>
            </>
          )}
        </View>
      </View>

      <PatroMonthDateSheet
        open={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        month={month}
        year={year}
        browseEra={browseEra}
        monthOptions={monthOptions}
        yearOptions={yearSelectOptions}
        location={location}
        onLocationChange={onLocationChange}
        onCommit={(m, y, era) => {
          onMonthChange(m);
          onYearChange(y);
          onBrowseEraChange?.(era);
        }}
      />
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
