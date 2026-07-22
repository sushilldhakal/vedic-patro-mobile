import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
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
import { colors } from "@/lib/theme";
import { type HomePatroView } from "./PatroViewToggle";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

type Props = {
  year: number;
  month: number;
  todayAd: string;
  onToday: () => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  patroView: HomePatroView;
  onPatroViewChange: (view: HomePatroView) => void;
  locationLabel?: string;
};

function chipMonthLabel(month: number, lang: string): string {
  if (lang === "en") return BS_MONTH_NAMES[month - 1].slice(0, 3).toUpperCase();
  return BS_MONTHS_NE[month - 1];
}

export function BsMonthHeaderTitle({
  year,
  month,
  todayAd,
  onToday,
  onMonthChange,
  onYearChange,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  patroView,
  onPatroViewChange,
  locationLabel,
}: Props) {
  const { pick, digits, lang } = useLocale();
  const todayBs = adToBS(new Date(`${todayAd}T12:00:00`));
  const [pickerOpen, setPickerOpen] = useState(false);

  const monthTitle = pick(BS_MONTHS_NE[month - 1], BS_MONTH_NAMES[month - 1]);
  const samvatsara = resolveSamvatsaraForBsYear(year);
  const samvatsaraLabel = samvatsara ? pick(samvatsara.name_ne, samvatsara.name_en) : undefined;

  const adRange = useMemo(() => {
    const adLocale = lang === "en" ? "en-US" : "ne-NP";
    const start = bsToAD(year, month, 1);
    const end = bsToAD(year, month, getBSMonthLength(year, month));
    const startMonth = start.toLocaleDateString(adLocale, { month: "short" });
    const endMonth = end.toLocaleDateString(adLocale, { month: "short" });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const yl = (y: number) => (lang === "en" ? String(y) : digits(y));
    if (startMonth === endMonth && startYear === endYear) return `${startMonth} ${yl(startYear)}`;
    if (startYear === endYear) return `${startMonth}/${endMonth} ${yl(startYear)}`;
    return `${startMonth} ${yl(startYear)}/${endMonth} ${yl(endYear)}`;
  }, [year, month, lang, digits]);

  const nextView: HomePatroView = patroView === "calendar" ? "panchanga" : "calendar";
  const nextViewLabel = nextView === "panchanga" ? pick("पञ्चाङ्ग", "Panchanga") : pick("वि.सं.", "B.S.");

  const cityLabel = locationLabel ?? pick("काठमाडौं", "Kathmandu");

  return (
    <View className="mb-4 flex-row items-start gap-2.5">
      {/* Today chip — tap to jump to today */}
      <Pressable
        onPress={onToday}
        accessibilityLabel={pick("आज", "Today")}
        className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm active:opacity-90"
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

      <View className="min-w-0 flex-1 gap-1">
        {/* Row 1 — inline title + view toggle */}
        <View className="flex-row items-start justify-between gap-2">
          <Text className="min-w-0 flex-1 text-sm font-bold leading-tight text-foreground">
            {monthTitle}{" "}
            <Text className="font-num font-bold text-secondary">{digits(year)}</Text>
            {samvatsaraLabel ? (
              <Text className="font-semibold text-foreground/90">{"  " + samvatsaraLabel}</Text>
            ) : null}
            <Text className="font-normal text-muted-foreground">{"  " + adRange}</Text>
          </Text>

          <Pressable
            onPress={() => onPatroViewChange(nextView)}
            accessibilityLabel={pick("पात्रो प्रकार बदल्नुहोस्", "Switch patro type")}
            className="h-[30px] shrink-0 flex-row items-center gap-1 rounded-lg border border-border bg-card px-2 active:bg-muted"
          >
            <Ionicons name="swap-horizontal" size={14} color={colors.foreground} />
            <Text className="text-sm font-semibold text-foreground">{nextViewLabel}</Text>
          </Pressable>
        </View>

        {/* Row 2 — prev / date picker / next  +  location */}
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-1">
            <StepBtn disabled={prevDisabled} onPress={onPrev} icon="chevron-back" />
            <Pressable
              onPress={() => setPickerOpen(true)}
              className="h-[30px] min-w-0 flex-row items-center gap-1 rounded-lg border border-border bg-card px-2.5 active:bg-muted"
            >
              <Text className="font-num text-sm font-semibold text-foreground">
                {bsMonthLabel(month, lang)}
              </Text>
              <Ionicons name="chevron-down" size={13} color={colors.mutedForeground} />
            </Pressable>
            <StepBtn disabled={nextDisabled} onPress={onNext} icon="chevron-forward" />
          </View>

          <View className="h-[30px] max-w-[7.5rem] shrink flex-row items-center gap-1 rounded-lg border border-border bg-card px-2">
            <Ionicons name="location-outline" size={13} color={colors.secondary} />
            <Text numberOfLines={1} className="text-sm font-medium text-foreground">
              {cityLabel}
            </Text>
          </View>
        </View>
      </View>

      <DateSheet
        visible={pickerOpen}
        year={year}
        month={month}
        onClose={() => setPickerOpen(false)}
        onMonthChange={onMonthChange}
        onYearChange={onYearChange}
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
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={cn(
        "h-[30px] w-[30px] items-center justify-center rounded-lg border border-border bg-card active:bg-muted",
        disabled && "opacity-40",
      )}
    >
      <Ionicons name={icon} size={16} color={colors.foreground} />
    </Pressable>
  );
}

/** Bottom-sheet date picker — month + year, mirroring the web mobile date drawer. */
function DateSheet({
  visible,
  year,
  month,
  onClose,
  onMonthChange,
  onYearChange,
}: {
  visible: boolean;
  year: number;
  month: number;
  onClose: () => void;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
}) {
  const { pick, digits, lang } = useLocale();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onPress={onClose}
      />
      <View
        className="max-h-[70%] rounded-t-2xl border-t border-border pb-8"
        style={{ backgroundColor: colors.card }}
      >
        <View className="items-center pt-2.5">
          <View className="h-1 w-10 rounded-full" style={{ backgroundColor: colors.border }} />
        </View>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-base font-bold text-foreground">{pick("मिति", "Date")}</Text>
          <Pressable
            onPress={onClose}
            className="h-9 flex-row items-center rounded-lg bg-primary px-4 active:opacity-90"
          >
            <Text className="text-sm font-semibold text-primary-foreground">{pick("भयो", "Done")}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="px-4 pb-2">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {pick("महिना", "Month")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {BS_MONTH_NAMES.map((_, i) => {
              const m = i + 1;
              const active = m === month;
              return (
                <Pressable
                  key={m}
                  onPress={() => onMonthChange(m)}
                  className={cn(
                    "rounded-lg border px-3 py-2",
                    active ? "border-primary bg-primary/10" : "border-border bg-card active:bg-muted",
                  )}
                >
                  <Text
                    className={cn("text-sm", active ? "font-bold text-primary" : "text-foreground")}
                  >
                    {bsMonthLabel(m, lang)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {pick("वर्ष", "Year")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {BS_YEAR_OPTIONS.map((y) => {
              const active = y === year;
              return (
                <Pressable
                  key={y}
                  onPress={() => onYearChange(y)}
                  className={cn(
                    "rounded-lg border px-3 py-2",
                    active ? "border-primary bg-primary/10" : "border-border bg-card active:bg-muted",
                  )}
                >
                  <Text
                    className={cn(
                      "font-num text-sm",
                      active ? "font-bold text-primary" : "text-foreground",
                    )}
                  >
                    {digits(y)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
