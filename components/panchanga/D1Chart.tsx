import { useMemo } from "react";
import { View } from "react-native";
import Svg, { G, Line, Polygon, Rect, Text as SvgText } from "react-native-svg";
import type { BhavaHouse } from "@/lib/bhava";
import {
  NI_HOUSE_POLYGONS,
  planetGridLayout,
  pointsToSvg,
  polygonCentroid,
} from "@/lib/kundali/north-indian-layout";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";

const PLANET_ABBR_NE: Record<string, string> = {
  sun: "सू",
  moon: "चं",
  mars: "मं",
  mercury: "बु",
  jupiter: "गु",
  venus: "शु",
  saturn: "श",
  rahu: "रा",
  ketu: "के",
};

const PLANET_ABBR_EN: Record<string, string> = {
  sun: "Su",
  moon: "Mo",
  mars: "Ma",
  mercury: "Me",
  jupiter: "Ju",
  venus: "Ve",
  saturn: "Sa",
  rahu: "Ra",
  ketu: "Ke",
};

const RASHI_EN = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
];

type Props = {
  houses: BhavaHouse[];
};

export function D1Chart({ houses }: Props) {
  const { pick, digits } = useLocale();
  const colors = useThemeColors();
  const byHouse = useMemo(() => new Map(houses.map((h) => [h.house, h])), [houses]);

  return (
    <View className="w-full items-center">
      <Svg width="100%" height={280} viewBox="0 0 300 300" accessibilityLabel={pick("उत्तर भारतीय D1 चक्र", "North Indian D1 chart")}>
        <Rect x={0} y={0} width={300} height={300} rx={4} fill={colors.card} stroke={colors.border} strokeWidth={1.5} />
        <Line x1={0} y1={0} x2={300} y2={300} stroke={colors.border} strokeWidth={1.25} opacity={0.8} />
        <Line x1={300} y1={0} x2={0} y2={300} stroke={colors.border} strokeWidth={1.25} opacity={0.8} />
        <Polygon points="150,0 300,150 150,300 0,150" fill="none" stroke={colors.border} strokeWidth={1.25} opacity={0.8} />

        {Object.entries(NI_HOUSE_POLYGONS).map(([houseStr, points]) => {
          const houseNum = Number(houseStr);
          const house = byHouse.get(houseNum);
          const [cx, cy] = polygonCentroid(points);
          const planetLines = house?.planets ?? [];
          const hasPlanets = planetLines.length > 0;
          const layout = planetGridLayout(points, planetLines.length);

          return (
            <G key={houseNum}>
              {house?.isLagna ? (
                <Polygon points={pointsToSvg(points)} fill={colors.secondary} opacity={0.15} />
              ) : null}
              {house ? (
                <SvgText
                  x={cx}
                  y={cy - (hasPlanets ? 12 : 0)}
                  fill={house.isLagna ? colors.secondary : colors.mutedForeground}
                  fontSize={11}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {`${digits(house.rashi)} ${pick(house.rashiNe, RASHI_EN[house.rashi - 1] ?? house.rashiNe)}`}
                </SvgText>
              ) : null}
              {planetLines.map((planet, i) => {
                const row = Math.floor(i / layout.columns);
                const rowStart = row * layout.columns;
                const itemsInRow = Math.min(layout.columns, planetLines.length - rowStart);
                const col = i - rowStart;
                const x = cx + (col - (itemsInRow - 1) / 2) * layout.colGap;
                const y = cy + row * layout.rowGap;
                return (
                  <SvgText
                    key={planet.key}
                    x={x}
                    y={y}
                    fill={colors.foreground}
                    fontSize={layout.fontSize}
                    textAnchor="middle"
                  >
                    {pick(
                      PLANET_ABBR_NE[planet.key] ?? planet.labelNe.slice(0, 2),
                      PLANET_ABBR_EN[planet.key] ?? planet.labelNe.slice(0, 2),
                    )}
                  </SvgText>
                );
              })}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
