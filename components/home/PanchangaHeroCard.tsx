import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocale } from "@/lib/i18n";
import {
  BS_MONTH_NAMES,
  BS_MONTHS_NE,
  adToBS,
  bsMonthLabel,
  formatDigits,
} from "@/lib/bs-calendar";
import type { CalendarDay, PanchangaDay } from "@/lib/api";
import { MONTH_HERO_COLORS } from "@/lib/theme";
import { useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

type Props = {
  month: number;
  year: number;
  selectedAd: string;
  todayAd: string;
  p?: PanchangaDay;
  contextDay?: CalendarDay | null;
};

function fmtAdFull(iso: string, lang: "ne" | "en"): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(lang === "en" ? "en-US" : "ne-NP", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PanchangaHeroCard({ month, year, selectedAd, todayAd, p, contextDay }: Props) {
  const colors = useThemeColors();
  const { pick, digits, lang } = useLocale();
  const isToday = selectedAd === todayAd;

  const weekdayNe = pick(
    p?.weekday ?? contextDay?.weekday_ne ?? contextDay?.weekday ?? "",
    contextDay?.weekday_en ?? p?.weekday ?? contextDay?.weekday ?? "",
  );

  const tithi = pick(
    p?.tithi?.name_ne ?? p?.tithi?.name ?? contextDay?.tithi_ne ?? contextDay?.tithi ?? "",
    p?.tithi?.name ?? p?.tithi?.name_ne ?? contextDay?.tithi ?? contextDay?.tithi_ne ?? "",
  );

  const paksha = pick(p?.paksha?.label_ne ?? "", p?.paksha?.label_en ?? "");

  const topFest = pick(
    p?.festivals?.[0]?.name_ne ?? p?.festivals?.[0]?.name ?? contextDay?.festivals[0] ?? "",
    p?.festivals?.[0]?.name ?? p?.festivals?.[0]?.name_ne ?? contextDay?.festivals[0] ?? "",
  );
  const topFestPublic = p?.festivals?.[0]?.is_public_holiday ?? false;

  const displayHeroDate = (() => {
    if (p?.bs_date && typeof p.bs_date === "object") {
      const monthName = pick(BS_MONTHS_NE[p.bs_date.month - 1], BS_MONTH_NAMES[p.bs_date.month - 1]);
      return `${monthName} ${digits(p.bs_date.day)}`;
    }
    if (contextDay) {
      return `${bsMonthLabel(month, lang)} ${digits(contextDay.day)}`;
    }
    const fallback = adToBS(new Date(`${selectedAd}T12:00:00`));
    return `${bsMonthLabel(fallback.month, lang)} ${digits(fallback.day)}`;
  })();

  const bsYearLabel =
    p?.bs_date && typeof p.bs_date === "object"
      ? digits(p.bs_date.year)
      : digits(year);

  const samvatsara = pick(p?.samvatsara?.name_ne ?? "", p?.samvatsara?.name_en ?? "");

  const base = MONTH_HERO_COLORS[month] ?? colors.secondary;

  return (
    <View className="overflow-hidden rounded-xl shadow-lg">
      <LinearGradient colors={[base, "#061f21"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <LinearGradient
          colors={colors.heroOverlay as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 22 }}
        >
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-semibold tracking-widest text-white/70">
                {(isToday ? pick("आज", "TODAY") : (weekdayNe ?? "")).toUpperCase()}
              </Text>
              <Text className="mt-2 text-4xl font-bold leading-tight text-white md:text-3xl">
                {displayHeroDate}
              </Text>
              <Text className="mt-0.5 text-sm text-white/90">
                {weekdayNe}
                {`, ${pick("वि.सं.", "BS")} ${bsYearLabel}`}
              {samvatsara ? (
                <Text className="text-white/75">{` · ${samvatsara}`}</Text>
              ) : null}
              </Text>
              <Text className="mt-1.5 text-xs text-white/70">{fmtAdFull(selectedAd, lang)}</Text>
            </View>

            {(paksha || tithi || topFest) ? (
              <View className="mt-0.5 max-w-[42%] shrink-0 items-end gap-1.5">
                {paksha ? <HeroPill label={paksha} /> : null}
                {tithi ? <HeroPill label={tithi} /> : null}
                {topFest ? <HeroPill label={topFest} kind={topFestPublic ? "public" : "festival"} /> : null}
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
}

function HeroPill({ label, kind }: { label: string; kind?: "public" | "festival" }) {
  const bg =
    kind === "public"
      ? "rgba(255,90,90,0.16)"
      : kind === "festival"
        ? "rgba(0,170,180,0.18)"
        : "rgba(255,255,255,0.10)";
  const border =
    kind === "public"
      ? "rgba(255,120,120,0.35)"
      : kind === "festival"
        ? "rgba(0,200,210,0.35)"
        : "rgba(255,255,255,0.20)";
  const text =
    kind === "public" ? "#ffb4b4" : kind === "festival" ? "#8fe3e8" : "#ffffff";

  return (
    <View
      style={{ backgroundColor: bg, borderColor: border }}
      className="rounded-full border px-2.5 py-1.5"
    >
      <Text style={{ color: text }} className="text-sm font-semibold" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
