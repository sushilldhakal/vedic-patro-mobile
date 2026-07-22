import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { PanchangaHeroCard } from "./PanchangaHeroCard";
import { PanchangaVivaranPanel } from "./PanchangaVivaranPanel";
import type { CalendarDay, PanchangaDay } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ErrorState, LoadingState } from "@/components/ui/States";

const TABS = ["panchanga", "muhurta", "sait"] as const;
type TabId = (typeof TABS)[number];

type Props = {
  month: number;
  year: number;
  selectedAd: string;
  todayAd: string;
  selectedDay: CalendarDay | null;
  contextDays: CalendarDay[];
  p?: PanchangaDay;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
};

export function PanchangaAsidePanel({
  month,
  year,
  selectedAd,
  todayAd,
  selectedDay,
  contextDays,
  p,
  loading,
  error,
  onRetry,
}: Props) {
  const { pick } = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("panchanga");

  const contextDay =
    selectedDay ??
    contextDays.find((d) => d.date_ad === selectedAd) ??
    contextDays.find((d) => d.day === 1) ??
    contextDays[0] ??
    null;

  const isSelectedToday = selectedAd === todayAd;

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between border-b border-border px-1 pb-3 pt-1">
        <Text className="flex-1 text-lg font-bold text-foreground">
          {isSelectedToday ? pick("आजको पञ्चाङ्ग", "Today's Panchanga") : pick("पञ्चाङ्ग", "Panchanga")}
        </Text>
        <Pressable onPress={() => router.push("/panchanga")}>
          <Text className="text-xs text-secondary">{pick("पूरा विवरण →", "Full detail →")}</Text>
        </Pressable>
      </View>

      <PanchangaHeroCard
        month={month}
        year={year}
        selectedAd={selectedAd}
        todayAd={todayAd}
        p={p}
        contextDay={contextDay}
      />

      <View className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <View className="flex-row border-b border-border bg-surface-muted">
          {TABS.map((id) => (
            <Pressable
              key={id}
              onPress={() => setTab(id)}
              className={cn(
                "min-h-10 flex-1 items-center justify-center border-b-2 px-1 py-2.5",
                tab === id ? "border-primary bg-tab-active" : "border-transparent",
              )}
            >
              <Text
                className={cn(
                  "text-center text-xs font-semibold",
                  tab === id ? "font-bold text-foreground" : "text-muted-foreground",
                )}
              >
                {pick(
                  id === "panchanga" ? "पञ्चाङ्ग" : id === "muhurta" ? "मुहूर्त" : "साइत",
                  id === "panchanga" ? "Panchanga" : id === "muhurta" ? "Muhurta" : "Sait",
                )}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="min-h-[12rem] p-3">
          {error && !p ? (
            <ErrorState
              message={pick("पञ्चाङ्ग लोड गर्न सकिएन।", "Could not load panchanga.")}
              onRetry={onRetry}
            />
          ) : loading && !p ? (
            <LoadingState />
          ) : tab === "panchanga" ? (
            <PanchangaVivaranPanel p={p} selectedDay={contextDay} />
          ) : tab === "muhurta" ? (
            <MuhurtaPanel p={p} />
          ) : (
            <Text className="py-6 text-center text-sm text-muted-foreground">
              {pick("साइत विवरण वेबमा उपलब्ध छ।", "Sait details are available on the web app.")}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function MuhurtaPanel({ p }: { p?: PanchangaDay }) {
  const { pick } = useLocale();
  if (!p?.muhurta) {
    return (
      <Text className="py-6 text-center text-sm text-muted-foreground">
        {pick("मुहूर्त विवरण उपलब्ध छैन।", "Muhurta details unavailable.")}
      </Text>
    );
  }
  const rows = [
    { ne: "राहु काल", en: "Rahu Kaal", block: p.muhurta.rahu_kalam },
    { ne: "अभिजित", en: "Abhijit", block: p.muhurta.abhijit },
    { ne: "यमगण्ड", en: "Yamaganda", block: p.muhurta.yamaganda },
    { ne: "गुलिक", en: "Gulika", block: p.muhurta.gulika },
  ];
  return (
    <View>
      {rows.map((row) =>
        row.block ? (
          <View key={row.en} className="flex-row items-center justify-between border-b border-border/60 py-2.5">
            <Text className="text-sm text-muted-foreground">{pick(row.ne, row.en)}</Text>
            <Text className="font-num text-sm font-semibold text-foreground">
              {row.block.start_time?.slice(0, 5) ?? "—"} – {row.block.end_time?.slice(0, 5) ?? "—"}
            </Text>
          </View>
        ) : null,
      )}
    </View>
  );
}
