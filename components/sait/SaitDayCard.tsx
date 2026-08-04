import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import type { SaitDetailDay } from "@/lib/api";
import { BS_MONTH_NAMES } from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { formatRashiDisplay } from "@/lib/rashi-i18n";
import { colorWithAlpha } from "@/lib/theme";
import { useThemeColors } from "@/lib/theme-context";

/**
 * One qualifying muhūrta day: the representative clean window plus the
 * panchāṅga that made the day survive the rules.
 */
export function SaitDayCard({ d, width }: { d: SaitDetailDay; width: string }) {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();

  const overnight = d.window_end < d.window_start;
  const monthLabel = pick(d.bs_month_name_ne, BS_MONTH_NAMES[d.bs_month - 1] ?? d.bs_month_name_ne);
  const paksha = pick(
    d.paksha_ne ?? "",
    d.paksha === "shukla" ? "Shukla" : d.paksha === "krishna" ? "Krishna" : (d.paksha_ne ?? ""),
  );

  const rows: { label: string; value: string }[] = [
    { label: pick("तिथि", "Tithi"), value: `${paksha} ${pick(d.tithi_ne, d.tithi_en)}`.trim() },
    { label: pick("नक्षत्र", "Nakshatra"), value: pick(d.nakshatra_ne, d.nakshatra_en) },
    { label: pick("योग", "Yoga"), value: pick(d.yoga_ne ?? "—", d.yoga_en ?? "—") },
    { label: pick("करण", "Karana"), value: pick(d.karana_ne ?? "—", d.karana_en ?? "—") },
    {
      label: pick("लग्न", "Lagna"),
      value:
        formatRashiDisplay(d.lagna_ne, d.lagna_en, lang) ??
        pick(d.lagna_ne ?? "—", d.lagna_en ?? "—"),
    },
    {
      label: pick("चान्द्र मास", "Lunar month"),
      value: pick(d.lunar_month_ne ?? "—", d.lunar_month_en ?? "—"),
    },
  ];

  return (
    <View
      style={{ width: width as never, borderColor: colors.border }}
      className="rounded-xl border bg-card p-4"
    >
      <View className="flex-row items-stretch gap-3 pb-3">
        <View
          style={{ backgroundColor: colors.surfaceInset, minWidth: 68 }}
          className="items-center justify-center rounded-lg px-2 py-2.5"
        >
          <Text
            style={{ color: colors.secondary, ...nepaliTextStyle(10) }}
            className="text-[10px] font-semibold uppercase tracking-wider"
          >
            {monthLabel}
          </Text>
          <Text className="font-num text-3xl font-bold text-foreground">{digits(d.bs_day)}</Text>
        </View>

        <View className="min-w-0 flex-1 justify-center gap-1.5">
          <View className="flex-row flex-wrap items-baseline gap-x-2">
            <Text className="text-base font-bold text-foreground" style={nepaliTextStyle(16)}>
              {pick(d.weekday_ne, d.weekday_en)}
            </Text>
            <Text className="font-num text-xs text-muted-foreground">{d.gregorian}</Text>
          </View>

          <View
            style={{ backgroundColor: colorWithAlpha("#0b565a", 0.12) }}
            className="flex-row items-center gap-1.5 self-start rounded-md px-2 py-1"
          >
            <Ionicons name="time-outline" size={13} color={colors.secondary} />
            <Text style={{ color: colors.secondary }} className="font-num text-xs font-semibold">
              {digits(d.window_start)} – {digits(d.window_end)}
              {overnight ? pick(" (भोलि)", " (next day)") : ""}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row flex-wrap border-t border-border pt-3">
        {rows.map((r) => (
          <View key={r.label} style={{ width: "50%" }} className="gap-0.5 pb-2 pr-3">
            <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
              {r.label}
            </Text>
            <Text
              numberOfLines={1}
              className="text-sm font-semibold text-foreground"
              style={nepaliTextStyle(13)}
            >
              {r.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default SaitDayCard;
