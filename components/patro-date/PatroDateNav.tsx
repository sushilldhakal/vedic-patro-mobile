import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { BsMonthYearNav, BsNativeSelect } from "@/components/ui/BsNativeSelect";
import {
  BS_MONTH_NAMES,
  BS_MONTHS_NE,
  getBSMonthLength,
} from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import {
  AD_MONTHS_SHORT,
  BS_MONTHS_SHORT,
  adMonthLabel,
  bsMonthLabel,
} from "@/lib/patro-month-labels";
import { isGregorianBrowseEra, type PatroBrowseEra } from "@/lib/patro-era";
import { browseYearSelectOptions } from "@/lib/patro-browse-years";
import { resolveSamvatsaraForPatroYear, type SamvatsaraPayload } from "@/lib/samvatsara";
import { displayLocationLabel, DEFAULT_PANCHANGA_LOCATION, type PanchangaLocation } from "@/lib/use-panchanga-location";
import { useBreakpoint } from "@/lib/responsive";
import { useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { parseClockParts } from "@/components/panchanga/use-panchanga-mode";
import { PatroBsHeadline } from "./PatroBsHeadline";
import { PatroDateSheet } from "./PatroDateSheet";
import type { PatroDateSheetDraft } from "./PatroDateSheetDatePanel";
import { patroEraShortLabel } from "./patro-era-labels";
import type { PatroDateNavProps } from "./types";
import { usePatroDateSheet } from "./use-patro-date-sheet";
import { stepPatroBrowseYear } from "@/lib/patro-year-browse-step";

function chipMonthLabel(month: number, lang: string, era: PatroBrowseEra): string {
  if (isGregorianBrowseEra(era)) {
    return AD_MONTHS_SHORT[month - 1]!.toUpperCase();
  }
  if (lang === "en") return BS_MONTHS_SHORT[month - 1]!.toUpperCase();
  return BS_MONTHS_NE[month - 1]!;
}

function monthChipSpan(
  year: number,
  month: number,
  era: PatroBrowseEra,
  digits: (n: number) => string,
): string {
  if (isGregorianBrowseEra(era)) {
    const len = new Date(year, month, 0).getDate();
    return `${digits(1)}-${digits(len)}`;
  }
  const length = getBSMonthLength(year, month);
  return `${digits(1)}-${digits(length)}`;
}

function buildMonthOptions(era: PatroBrowseEra, lang: string) {
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return {
      value: m,
      label: isGregorianBrowseEra(era) ? adMonthLabel(m, lang) : bsMonthLabel(m, lang),
    };
  });
}

function StepBtn({
  onPress,
  disabled,
  icon,
  compact,
}: {
  onPress: () => void;
  disabled?: boolean;
  icon: "chevron-back" | "chevron-forward";
  compact?: boolean;
}) {
  const colors = useThemeColors();
  const size = compact ? 25 : 30;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={cn(
        "shrink-0 items-center justify-center rounded-lg border border-border bg-card active:bg-muted",
        disabled && "opacity-40",
      )}
      style={{ width: size, height: size }}
    >
      <Ionicons name={icon} size={compact ? 14 : 16} color={colors.foreground} />
    </Pressable>
  );
}

function LocationChip({
  location,
  onPress,
}: {
  location: PanchangaLocation;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const { pick } = useLocale();
  const safeLocation = location ?? DEFAULT_PANCHANGA_LOCATION;
  const label = displayLocationLabel(safeLocation);
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={pick("स्थान बदल्नुहोस्", "Change location")}
      className="h-[30px] max-w-[7.5rem] shrink flex-row items-center gap-1 rounded-lg border border-border bg-card px-2 active:bg-muted"
    >
      <Ionicons name="location-outline" size={13} color={colors.secondary} />
      <Text numberOfLines={1} className="text-sm font-medium text-foreground">
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Single Patro date + location chrome (3 modes × phone/tablet).
 * Phone: chips + steppers → bottom sheet (Date | Location tabs).
 * Tablet: inline pickers matching web md+ layout.
 */
export function PatroDateNav(props: PatroDateNavProps) {
  const {
    mode,
    era,
    onEraChange,
    year,
    onYearChange,
    location,
    onLocationChange,
    onToday,
    onPrev,
    onNext,
    prevDisabled,
    nextDisabled,
    crossEraSubtitle,
    toolbar,
    mobileToolbar,
    vikramEra,
    samvatsara: samvatsaraPayload,
    className,
  } = props;

  const colors = useThemeColors();
  const { pick, digits, lang } = useLocale();
  const { isCompact, isPhone } = useBreakpoint();
  const sheet = usePatroDateSheet();

  const safeLocation = location ?? DEFAULT_PANCHANGA_LOCATION;

  const month = mode === "year" ? 1 : props.month;
  const day = mode === "year-month-time" ? props.day : 1;
  const clock = mode === "year-month-time" ? props.clock ?? "" : "";
  const showTime = mode === "year-month-time" && Boolean(props.onClockChange);
  const todayAd = mode === "year-month-time" ? props.todayAd : undefined;

  const monthOptions = useMemo(() => buildMonthOptions(era, lang), [era, lang]);
  const yearSelectOptions = useMemo(
    () => browseYearSelectOptions(era, year, digits),
    [era, year, digits],
  );

  const eraShort = patroEraShortLabel(era, pick);
  const headlineEra = vikramEra ?? era;
  const samvatsaraInfo = !isGregorianBrowseEra(era)
    ? resolveSamvatsaraForPatroYear(
        headlineEra,
        year,
        samvatsaraPayload as SamvatsaraPayload | undefined,
      )
    : undefined;
  const samvatsaraLabel = samvatsaraInfo
    ? pick(samvatsaraInfo.name_ne, samvatsaraInfo.name_en)
    : undefined;

  const monthTitle =
    mode === "year"
      ? null
      : isGregorianBrowseEra(era)
        ? adMonthLabel(month, lang)
        : lang === "en"
          ? BS_MONTH_NAMES[month - 1]!
          : pick(BS_MONTHS_NE[month - 1]!, BS_MONTH_NAMES[month - 1]!);

  const monthTitleShort =
    mode === "year"
      ? null
      : lang === "en" || isGregorianBrowseEra(era)
        ? (isGregorianBrowseEra(era)
            ? AD_MONTHS_SHORT[month - 1]!
            : BS_MONTHS_SHORT[month - 1]!
          ).toUpperCase()
        : monthTitle;

  const clockSummary =
    showTime && clock
      ? (() => {
          const { hour, minute } = parseClockParts(clock);
          return `${digits(String(hour).padStart(2, "0"))}:${digits(String(minute).padStart(2, "0"))}`;
        })()
      : null;

  const dateChipLabel = (() => {
    if (mode === "year") return `${digits(year)} ${eraShort}`;
    if (mode === "year-month") {
      return isCompact ? `${digits(year)}` : (monthTitleShort ?? "");
    }
    if (mode === "year-month-time") {
      const dayPart = `${digits(day)} ${monthTitle ?? ""}`.trim();
      return clockSummary ? `${dayPart} · ${clockSummary}` : dayPart;
    }
    return clockSummary ? `${digits(day)} · ${clockSummary}` : `${digits(day)}`;
  })();

  const dateChipLabelCompact =
    mode === "year-month-time"
      ? `${digits(day)}${clockSummary ? ` · ${clockSummary}` : ""}`
      : dateChipLabel;

  const handleCommit = (draft: PatroDateSheetDraft) => {
    if (draft.era !== era) onEraChange(draft.era);
    if (draft.year !== year) onYearChange(draft.year);
    if (mode === "year-month" && draft.month !== month) {
      props.onMonthChange(draft.month);
    }
    if (mode === "year-month-time") {
      if (draft.month !== month) props.onMonthChange(draft.month);
      if (draft.day !== day) props.onDayChange(draft.day);
      if (showTime && draft.clock !== clock) props.onClockChange?.(draft.clock);
      props.onSelectDate?.(draft.year, draft.month, draft.day);
    }
  };

  const stepYearInline = (dir: "prev" | "next") => {
    onYearChange(stepPatroBrowseYear(era, year, dir));
  };

  const todayChip = (
    <Pressable
      onPress={onToday}
      accessibilityLabel={pick("आज", "Today")}
      className={cn(
        "shrink-0 overflow-hidden rounded-[8px] border border-border bg-card shadow-sm active:opacity-90 sm:rounded-[10px]",
        mode === "year"
          ? isPhone
            ? "w-10"
            : "w-[3.25rem]"
          : "min-w-[3.25rem] w-[3.25rem] sm:w-[3.75rem]",
      )}
    >
      {mode === "year" ? (
        <>
          <View className="bg-secondary px-0.5 py-1.5 sm:px-1">
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
              className="text-center text-[11px] font-bold leading-none tracking-wide text-secondary-foreground sm:text-sm"
              style={nepaliTextStyle(isPhone ? 11 : 14)}
            >
              {eraShort}
            </Text>
          </View>
          <View className="min-h-[2rem] items-center justify-center bg-card px-1 py-1">
            <Text className="font-num text-xs font-bold leading-none text-foreground sm:text-sm">
              {digits(year)}
            </Text>
          </View>
        </>
      ) : (
        <>
          <View className="bg-secondary px-1 py-1">
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
              className="text-center text-[10px] font-bold leading-tight tracking-wide text-secondary-foreground sm:text-[11px]"
              style={nepaliTextStyle(10)}
            >
              {chipMonthLabel(month, lang, era)}
            </Text>
          </View>
          <View className="min-h-[2rem] min-w-full items-center justify-center bg-card px-1 py-1.5">
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              className="font-num text-[11px] font-bold leading-snug text-foreground sm:text-sm"
            >
              {mode === "year-month-time" ? digits(day) : monthChipSpan(year, month, era, digits)}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );

  /** Year + era + samvatsara + AD range — one baseline row (web `BsHeadline`). */
  const headlineMeta = (compact: boolean) => (
    <PatroBsHeadline
      compact={compact}
      bs={`${digits(year)} ${patroEraShortLabel(headlineEra, pick)}`}
      samvatsara={samvatsaraLabel}
      gregorian={crossEraSubtitle}
    />
  );

  const headlineCompact = headlineMeta(true);
  const headlineTablet = headlineMeta(false);

  const dateChip = (
    <Pressable
      onPress={sheet.openDate}
      className="h-[30px] min-w-0 max-w-[11rem] shrink flex-row items-center justify-center gap-1 rounded-lg border border-border bg-card px-2 active:bg-muted"
    >
      {mode === "year-month-time" ? (
        <Ionicons name="calendar-outline" size={14} color={colors.secondary} />
      ) : null}
      <Text numberOfLines={1} className="min-w-0 shrink font-num text-sm font-semibold text-foreground">
        {isCompact && mode === "year-month-time" ? dateChipLabelCompact : dateChipLabel}
      </Text>
      <Ionicons name="chevron-down" size={12} color={colors.mutedForeground} />
    </Pressable>
  );

  const navRowPhone = (
    <View className="-mt-1 flex-row items-center justify-between gap-2">
      <View className="min-w-0 flex-1 flex-row items-center gap-1">
        {onPrev ? <StepBtn disabled={prevDisabled} onPress={onPrev} icon="chevron-back" compact={isPhone} /> : null}
        {dateChip}
        {onNext ? <StepBtn disabled={nextDisabled} onPress={onNext} icon="chevron-forward" compact={isPhone} /> : null}
      </View>
      <LocationChip location={safeLocation} onPress={sheet.openLocation} />
    </View>
  );

  const navRowTablet = (
    <View className="-mt-1 flex-row items-center justify-between gap-2">
      <View className="min-w-0 flex-1 flex-row items-center gap-1">
        {onPrev ? <StepBtn disabled={prevDisabled} onPress={onPrev} icon="chevron-back" /> : null}
        {mode === "year" ? (
          <View className="flex-row items-center gap-1">
            <StepBtn disabled={false} onPress={() => stepYearInline("prev")} icon="chevron-back" />
            <BsNativeSelect
              value={year}
              options={yearSelectOptions}
              onChange={onYearChange}
              ariaLabel={pick("वर्ष", "Year")}
              minWidth={72}
            />
            <StepBtn disabled={false} onPress={() => stepYearInline("next")} icon="chevron-forward" />
          </View>
        ) : mode === "year-month" ? (
          <BsMonthYearNav
            month={month}
            year={year}
            monthOptions={monthOptions}
            yearOptions={yearSelectOptions}
            onMonthChange={props.onMonthChange}
            onYearChange={onYearChange}
            monthMinWidth={lang === "en" ? 76 : 88}
            yearMinWidth={72}
          />
        ) : (
          dateChip
        )}
        {onNext ? <StepBtn disabled={nextDisabled} onPress={onNext} icon="chevron-forward" /> : null}
      </View>
      <LocationChip location={safeLocation} onPress={sheet.openLocation} />
    </View>
  );

  return (
    <View className={cn("mb-4", className)}>
      <View className="flex-row items-start gap-1.5 sm:gap-3">
        {onToday ? <View className="self-center">{todayChip}</View> : null}
        <View className="min-w-0 flex-1">
          {isCompact ? (
            <View className="gap-0.5">
              <View className="flex-row items-center justify-between gap-2">
                <View className="min-w-0 flex-1 self-center">{headlineCompact}</View>
                {mobileToolbar ?? toolbar ? (
                  <View className="h-[30px] shrink-0 flex-row items-center justify-end gap-1.5">
                    {mobileToolbar}
                    {!mobileToolbar ? toolbar : null}
                  </View>
                ) : null}
              </View>
              {navRowPhone}
            </View>
          ) : (
            <>
              <View className="flex-row items-start justify-between gap-2">
                <View className="min-w-0 flex-1">{headlineTablet}</View>
                {toolbar ? (
                  <View className="shrink-0 flex-row items-center gap-1.5">{toolbar}</View>
                ) : null}
              </View>
              {navRowTablet}
            </>
          )}
        </View>
      </View>

      <PatroDateSheet
        sheet={sheet}
        mode={mode}
        era={era}
        year={year}
        month={month}
        day={day}
        clock={clock}
        monthOptions={monthOptions}
        todayAd={todayAd}
        showTime={showTime}
        location={safeLocation}
        onLocationChange={onLocationChange}
        onCommit={handleCommit}
      />
    </View>
  );
}

export { usePatroDateSheet } from "./use-patro-date-sheet";
export type { PatroDateNavMode, PatroDateNavProps } from "./types";
