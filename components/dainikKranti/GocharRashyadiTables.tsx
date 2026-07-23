import { ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"
import type { GocharGraha } from "@/lib/api";
import {
  mergeKundaliRashi,
  RASHYADI_PLANET_ABBREV,
  RASHYADI_PLANET_KEYS,
  RASHYADI_ROW_KEYS,
  RASHYADI_ROW_LABEL,
  rashyadiCellValue,
  type RashyadiRowKey,
  type RashyadiSegment,
} from "@/lib/dainikKranti/rashyadi";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";

type GrahaRow = GocharGraha & { key: string };

type TableProps = {
  segment: RashyadiSegment;
  kundaliGrahas?: GrahaRow[];
  kundaliDateAd?: string | null;
  loading?: boolean;
  className?: string;
  /** When true, omit the paksha version line (shown in GocharRashyadiBlock header row). */
  hideVersionHeader?: boolean;
};

function rowLabelFor(segment: RashyadiSegment, key: RashyadiRowKey): string {
  if (key === "rashi") return segment.monthInitialLabel;
  return RASHYADI_ROW_LABEL[key];
}

export function GocharRashyadiTable({
  segment,
  kundaliGrahas,
  kundaliDateAd,
  loading,
  className,
  hideVersionHeader,
}: TableProps) {
  const { pick, digits } = useLocale();
  const planets =
    kundaliGrahas &&
    kundaliDateAd &&
    segment.anchorDateAd === kundaliDateAd &&
    segment.anchor === "start"
      ? mergeKundaliRashi(segment.planets, kundaliGrahas)
      : segment.planets;

  if (loading) {
    return (
      <View
        className={cn(
          "min-h-[280px] items-center justify-center rounded-xl border border-border p-4",
          className,
        )}
      >
        <Text className="text-sm text-muted-foreground">{pick("लोड हुँदैछ…", "Loading…")}</Text>
      </View>
    );
  }

  return (
    <View className={cn("overflow-hidden rounded-xl border border-border bg-muted/15", className)}>
      <View className="border-b border-border bg-muted/40 px-3 py-2.5">
        {!hideVersionHeader ? (
          <Text className="text-sm font-semibold leading-snug text-secondary" style={nepaliTextStyle(14)}>
            {segment.versionNe}
          </Text>
        ) : null}
        <Text className={cn("text-sm text-foreground", !hideVersionHeader && "mt-0.5")} style={nepaliTextStyle(14)}>
          {segment.labelNe}
          {segment.bsDay != null ? (
            <Text className="text-sm text-muted-foreground">
              {" "}
              ({digits(segment.bsDay)}
              {pick(" गते", "")})
            </Text>
          ) : null}
        </Text>
        {segment.moonRashiNe ? (
          <Text className="mt-1 text-sm text-muted-foreground">
            {pick("च.रा.", "Moon")}:{" "}
            <Text className="text-foreground">{segment.moonRashiNe}</Text>
          </Text>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View className="min-w-full">
          <View className="flex-row border-b border-border bg-muted/30">
            <View className="w-10 px-1 py-2" />
            {RASHYADI_PLANET_KEYS.map((key) => (
              <View key={key} className="min-w-[2.25rem] px-1 py-2">
                <Text className="text-center text-sm font-bold text-foreground">
                  {RASHYADI_PLANET_ABBREV[key]}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row border-b border-border/60">
            <View className="w-10 items-center justify-center px-1 py-2">
              <Text className="text-center text-sm font-semibold">{digits(segment.pakshaDayCount)}</Text>
            </View>
            {RASHYADI_PLANET_KEYS.map((key) => (
              <View key={`${segment.id}-hdr-${key}`} className="min-w-[2.25rem] px-1 py-2" />
            ))}
          </View>

          {RASHYADI_ROW_KEYS.map((rowKey) => (
            <View key={rowKey} className="flex-row border-b border-border/60 last:border-b-0">
              <View className="w-10 items-center justify-center px-1 py-2">
                <Text className="text-center text-xs font-semibold">
                  {rowLabelFor(segment, rowKey)}
                </Text>
              </View>
              {RASHYADI_PLANET_KEYS.map((key) => {
                const row = planets[key];
                return (
                  <View key={`${segment.id}-${key}-${rowKey}`} className="min-w-[2.25rem] px-1 py-2">
                    <Text className="text-center font-num text-sm tabular-nums text-foreground">
                      {row ? rashyadiCellValue(row, rowKey) : "—"}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <Text className="border-t border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
        {pick(
          "अं=अंश · ग=कला · वि=विकला · प्र=तटपरा · त्र=प्रतितत्परा",
          "Deg=degree · Ka=kala · Vi=vikala · Pr=prati-tatpara · Tr=prati-vikala",
        )}
      </Text>
    </View>
  );
}
