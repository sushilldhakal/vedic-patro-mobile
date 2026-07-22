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
import { PatroViewToggle, type HomePatroView } from "./PatroViewToggle";

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
}: Props) {
  const { pick, digits, lang } = useLocale();
  const todayBs = adToBS(new Date(`${todayAd}T12:00:00`));
  const [picker, setPicker] = useState<"month" | "year" | null>(null);

  const monthTitle = pick(BS_MONTHS_NE[month - 1], BS_MONTH_NAMES[month - 1]);
  const samvatsara = resolveSamvatsaraForBsYear(year);
  const samvatsaraLabel = samvatsara ? pick(samvatsara.name_ne, samvatsara.name_en) : undefined;

  const adSubtitle = useMemo(() => {
    const adLocale = lang === "en" ? "en-US" : "ne-NP";
    const start = bsToAD(year, month, 1);
    const end = bsToAD(year, month, getBSMonthLength(year, month));
    const startMonth = start.toLocaleDateString(adLocale, { month: "short" });
    const endMonth = end.toLocaleDateString(adLocale, { month: "short" });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const yearLabel = (y: number) => (lang === "en" ? String(y) : digits(y));
    if (startMonth === endMonth && startYear === endYear) return `${startMonth} ${yearLabel(startYear)}`;
    if (startYear === endYear) return `${startMonth}/${endMonth} ${yearLabel(startYear)}`;
    return `${startMonth} ${yearLabel(startYear)}/${endMonth} ${yearLabel(endYear)}`;
  }, [year, month, lang, digits]);

  const chipDay = todayBs.day;
  const chipMonth = todayBs.month;

  const monthOptions = BS_MONTH_NAMES.map((_, i) => ({
    value: i + 1,
    label: bsMonthLabel(i + 1, lang),
  }));

  return (
    <View className="mb-4 gap-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-start gap-2.5">
          <Pressable
            onPress={onToday}
            accessibilityLabel={pick("आज", "Today")}
            className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm active:opacity-90"
          >
            <View className="bg-secondary px-2 py-1">
              <Text className="text-center text-[11px] font-bold tracking-wide text-secondary-foreground">
                {chipMonthLabel(chipMonth, lang)}
              </Text>
            </View>
            <View className="min-w-[2.75rem] items-center justify-center px-2 py-1">
              <Text className="font-num text-base font-bold text-foreground">{digits(chipDay)}</Text>
            </View>
          </Pressable>

          <View className="min-w-0 flex-1">
            <Text className="flex-wrap text-lg font-bold leading-tight text-foreground">
              {monthTitle}{" "}
              <Text className="font-num font-bold text-secondary">{digits(year)}</Text>
            </Text>
            {samvatsaraLabel ? (
              <Text className="text-sm font-semibold text-foreground/90">{samvatsaraLabel}</Text>
            ) : null}
            <Text className="text-sm text-muted-foreground">{adSubtitle}</Text>
          </View>
        </View>

        <Pressable
          onPress={onToday}
          className="rounded-lg bg-primary px-3 py-2 shadow-sm active:opacity-90"
        >
          <Text className="text-sm font-semibold text-primary-foreground">{pick("आज", "Today")}</Text>
        </Pressable>
      </View>

      <View className="flex-row flex-wrap items-center gap-1.5">
        <NavBtn disabled={prevDisabled} onPress={onPrev} icon="chevron-back" />
        <SelectChip label={bsMonthLabel(month, lang)} onPress={() => setPicker("month")} />
        <SelectChip label={digits(year)} onPress={() => setPicker("year")} />
        <NavBtn disabled={nextDisabled} onPress={onNext} icon="chevron-forward" />
      </View>

      <View className="flex-row items-center justify-end">
        <PatroViewToggle value={patroView} onChange={onPatroViewChange} />
      </View>

      <PickerModal
        visible={picker === "month"}
        title={pick("महिना छान्नुहोस्", "Select month")}
        options={monthOptions.map((o) => ({ value: o.value, label: o.label }))}
        selected={month}
        onClose={() => setPicker(null)}
        onSelect={(v) => {
          onMonthChange(v);
          setPicker(null);
        }}
      />
      <PickerModal
        visible={picker === "year"}
        title={pick("वर्ष छान्नुहोस्", "Select year")}
        options={BS_YEAR_OPTIONS.map((y) => ({ value: y, label: digits(y) }))}
        selected={year}
        onClose={() => setPicker(null)}
        onSelect={(v) => {
          onYearChange(v);
          setPicker(null);
        }}
      />
    </View>
  );
}

function NavBtn({
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
        "h-9 w-9 items-center justify-center rounded-lg border border-border bg-card",
        disabled && "opacity-40",
      )}
    >
      <Ionicons name={icon} size={18} color={colors.foreground} />
    </Pressable>
  );
}

function SelectChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-9 flex-row items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 active:bg-muted"
    >
      <Text className="font-num text-sm font-semibold text-foreground">{label}</Text>
      <Ionicons name="chevron-down" size={14} color={colors.mutedForeground} />
    </Pressable>
  );
}

function PickerModal({
  visible,
  title,
  options,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: { value: number; label: string }[];
  selected: number;
  onClose: () => void;
  onSelect: (value: number) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="max-h-[60%] rounded-t-2xl bg-card pb-6">
        <Text className="border-b border-border px-4 py-3 text-base font-bold text-foreground">
          {title}
        </Text>
        <ScrollView className="px-2 pt-2">
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              className={cn(
                "mb-1 rounded-xl px-4 py-3",
                opt.value === selected ? "bg-primary/10" : "active:bg-muted",
              )}
            >
              <Text
                className={cn(
                  "text-base",
                  opt.value === selected ? "font-bold text-primary" : "text-foreground",
                )}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
