import { View } from "react-native"
import { Text } from "@/components/ui/Text"
import Svg, { G, Line, Polygon, Rect, Text as SvgText } from "react-native-svg";
import type { GocharGraha } from "@/lib/api";
import {
  buildPlanetsByRashi,
  formatGocharBsLabel,
  RASHI_NE,
} from "@/lib/dainikKranti/gochar-display";
import {
  GOCHAR_RASHI_TO_HOUSE,
  NI_HOUSE_POLYGONS,
  polygonCentroid,
} from "@/lib/kundali/north-indian-layout";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";
import { nepaliSvgTextCenter } from "@/lib/nepali-text";

type GrahaRow = GocharGraha & { key: string };

type Props = {
  grahas: GrahaRow[];
  papanshaLine?: string;
  gapanshaLine?: string;
  dateBs?: string | null;
  dateAd?: string | null;
  loading?: boolean;
  className?: string;
  /** When true, omit title (shown in GocharRashyadiBlock header row). */
  hideTitle?: boolean;
};

export function GocharKundaliChart({
  grahas,
  papanshaLine = "",
  gapanshaLine = "",
  dateBs,
  dateAd,
  loading,
  className,
  hideTitle,
}: Props) {
  const { pick } = useLocale();
  const colors = useThemeColors();
  const planetsByRashi = buildPlanetsByRashi(grahas);
  const dateLabel = formatGocharBsLabel(dateBs, dateAd);

  return (
    <View className={cn("rounded-xl border border-border p-4", className)}>
      {!hideTitle ? (
        <View className="mb-2 flex-row items-center gap-1.5">
          <Text className="text-sm font-semibold text-foreground">
            ✦ {pick("गोचर कुण्डली", "Transit Chart")}
          </Text>
        </View>
      ) : null}

      <View className={cn("gap-2", hideTitle ? undefined : "mb-3")}>
        <View className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5">
          <Text className="font-num text-base leading-relaxed text-foreground">
            {papanshaLine || pick("पापाशाः—", "Papashah —")}
          </Text>
        </View>
        {gapanshaLine ? (
          <View className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5">
            <Text className="font-num text-base leading-relaxed text-foreground">{gapanshaLine}</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <Text className="py-8 text-center text-sm text-muted-foreground">
          {pick("लोड हुँदैछ…", "Loading…")}
        </Text>
      ) : grahas.length === 0 ? (
        <Text className="py-8 text-center text-sm text-muted-foreground">
          {pick("विवरण उपलब्ध छैन।", "No details available.")}
        </Text>
      ) : (
        <View className="w-full items-center">
          <Svg width="100%" height={280} viewBox="0 0 300 300" accessibilityLabel={pick("गोचर कुण्डली", "Transit chart")}>
            <Rect x={0} y={0} width={300} height={300} rx={2} fill={colors.card} />
            {RASHI_NE.map((rashiNe, idx) => {
              const rashiNo = idx + 1;
              const house = GOCHAR_RASHI_TO_HOUSE[rashiNo]!;
              const points = NI_HOUSE_POLYGONS[house]!;
              const [cx, cy] = polygonCentroid(points);
              const planets = planetsByRashi[rashiNo] ?? [];
              const planetLine = planets.join(" ");
              return (
                <G key={rashiNe}>
                  {planetLine ? (
                    <SvgText
                      x={cx}
                      y={cy - 6}
                      fill={colors.foreground}
                      fontSize={12}
                      fontWeight="600"
                      textAnchor="middle"
                      {...nepaliSvgTextCenter}
                    >
                      {planetLine}
                    </SvgText>
                  ) : null}
                  <SvgText
                    x={cx}
                    y={cy + (planetLine ? 14 : 4)}
                    fill={colors.mutedForeground}
                    fontSize={11}
                    textAnchor="middle"
                    {...nepaliSvgTextCenter}
                  >
                    {rashiNe}
                  </SvgText>
                </G>
              );
            })}
            <G fill="none" stroke={colors.border} strokeWidth={1.75}>
              <Rect x={0} y={0} width={300} height={300} rx={2} />
              <Line x1={0} y1={0} x2={300} y2={300} />
              <Line x1={300} y1={0} x2={0} y2={300} />
              <Polygon points="150,0 300,150 150,300 0,150" />
            </G>
          </Svg>
        </View>
      )}

      {dateLabel ? (
        <Text className="mt-2 text-center text-sm text-muted-foreground">
          {pick(`${dateLabel} को स्थिति`, `Position on ${dateLabel}`)}
        </Text>
      ) : null}
    </View>
  );
}
