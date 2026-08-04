import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import {
  AllElementsLink,
  GrahaBanner,
  GrahaDescription,
} from "@/components/graha/GrahaPageParts";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { Text } from "@/components/ui/Text";
import { fetchGrahaSthiti, grahaDetailKeys, type GrahaSthitiRow } from "@/lib/api";
import {
  grahaSthitiLord,
  grahaSthitiNakshatra,
  grahaSthitiName,
  grahaSthitiRekhamsha,
  grahaSthitiShara,
  grahaSthitiSubLord,
} from "@/lib/graha-sthiti-display";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { colorWithAlpha } from "@/lib/theme";
import { useThemeColors } from "@/lib/theme-context";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";

const COLUMNS = [
  { key: "graha", ne: "ग्रह", en: "Graha", width: 132 },
  { key: "longitude", ne: "रेखांश", en: "Longitude", width: 176 },
  { key: "nakshatra_pada", ne: "नक्षत्र / पद", en: "Nakshatra / Pada", width: 148 },
  { key: "lord_sublord", ne: "स्वामी / उप स्वामी", en: "Lord / Sub-lord", width: 158 },
  { key: "full_degree", ne: "पूर्ण डिग्री", en: "Full degree", width: 104 },
  { key: "latitude", ne: "अक्षांश / शर", en: "Latitude", width: 158 },
  { key: "speed", ne: "गति °/दिन", en: "Speed °/day", width: 104 },
  { key: "right_ascension", ne: "विषुवांश", en: "R.A.", width: 96 },
  { key: "declination", ne: "क्रान्ति", en: "Decl.", width: 96 },
] as const;

function signed(value: number | undefined, digits: (v: number | string) => string): string {
  if (value == null) return "—";
  const s = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${s}${digits(Math.abs(value).toFixed(2))}`;
}

function GrahaRow({ row }: { row: GrahaSthitiRow }) {
  const { lang, digits } = useLocale();
  const colors = useThemeColors();
  const isLagna = row.graha === "lagna";

  return (
    <View
      style={isLagna ? { backgroundColor: colorWithAlpha("#0b565a", 0.06) } : undefined}
      className="flex-row border-t border-border"
    >
      <View style={{ width: COLUMNS[0].width }} className="flex-row items-center gap-1 px-3 py-2">
        <Text className="text-xs text-muted-foreground">{row.symbol}</Text>
        <Text className="text-sm font-bold text-foreground" style={nepaliTextStyle(13)}>
          {grahaSthitiName(row, lang)}
        </Text>
        {row.is_retrograde ? (
          <Text style={{ color: colors.danger }} className="text-xs">
            ↺
          </Text>
        ) : null}
        {row.is_combust ? <Text className="text-xs">🔥</Text> : null}
      </View>
      <Cell width={COLUMNS[1].width} num>
        {digits(grahaSthitiRekhamsha(row, lang))}
      </Cell>
      <Cell width={COLUMNS[2].width}>
        {grahaSthitiNakshatra(row, lang)}
        <Text className="text-muted-foreground"> · {digits(row.pada)}</Text>
      </Cell>
      <Cell width={COLUMNS[3].width}>
        {grahaSthitiLord(row, lang)}
        <Text className="text-muted-foreground"> / {grahaSthitiSubLord(row, lang)}</Text>
      </Cell>
      <Cell width={COLUMNS[4].width} num>
        {digits(row.full_degree.toFixed(2))}
      </Cell>
      <Cell width={COLUMNS[5].width} num>
        {digits(grahaSthitiShara(row, lang))}
      </Cell>
      <Cell width={COLUMNS[6].width} num color={row.is_retrograde ? colors.danger : undefined}>
        {signed(row.speed_deg_day, digits)}
      </Cell>
      <Cell width={COLUMNS[7].width} num>
        {row.right_ascension != null ? digits(row.right_ascension.toFixed(2)) : "—"}
      </Cell>
      <Cell width={COLUMNS[8].width} num>
        {signed(row.declination, digits)}
      </Cell>
    </View>
  );
}

function Cell({
  width,
  num,
  color,
  children,
}: {
  width: number;
  num?: boolean;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <Text
      style={{ width, ...(color ? { color } : {}), ...nepaliTextStyle(13) }}
      className={num ? "px-3 py-2 font-num text-sm text-foreground" : "px-3 py-2 text-sm text-foreground"}
    >
      {children}
    </Text>
  );
}

export default function GrahaSthitiScreen() {
  const { pick } = useLocale();
  const colors = useThemeColors();
  const { location, setLocation } = usePanchangaLocation();
  const tz = resolveTimeZone(undefined, location.params.timezone);
  const todayAd = todayAdStringInTimezone(new Date(), tz);
  const [date, setDate] = useState(() => new Date(`${todayAd}T12:00:00`));

  const dateAd = useMemo(() => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [date]);

  const query = useQuery({
    queryKey: grahaDetailKeys.sthiti(dateAd, "ad", location.params),
    queryFn: () => fetchGrahaSthiti(dateAd, location.params, "ad"),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  return (
    <AppShell
      title={pick("ग्रह स्थिति", "Graha Sthiti")}
      subtitle={pick(
        "नौ ग्रह र लग्नको दैनिक स्पष्ट स्थिति",
        "Daily sphuta of the nine grahas and the ascendant",
      )}
    >
      <GrahaBanner
        icon="planet-outline"
        title={pick("ग्रह स्थिति", "Graha Sthiti")}
        blurb={pick(
          "राशि, नक्षत्र, पद, स्वामी/उप स्वामी, शर, गति, विषुवांश र क्रान्ति सहितको दैनिक स्पष्ट।",
          "The daily sphuta with sign, nakshatra, pada, lord/sub-lord, latitude, speed, R.A. and declination.",
        )}
      />

      <LocationSelector location={location} onLocationChange={setLocation} />
      <PanchangaDateNav date={date} onDateChange={setDate} todayAd={todayAd} />

      {query.isLoading && !query.data ? (
        <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
          {pick("लोड हुँदै…", "Loading…")}
        </Text>
      ) : query.data ? (
        <View className="mt-2 overflow-hidden rounded-xl border border-border">
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={{ backgroundColor: colorWithAlpha("#0b565a", 0.09) }} className="flex-row">
                {COLUMNS.map((col) => (
                  <Text
                    key={col.key}
                    style={{ width: col.width, ...nepaliTextStyle(11) }}
                    className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                  >
                    {pick(col.ne, col.en)}
                  </Text>
                ))}
              </View>
              {query.data.rows.map((row) => (
                <GrahaRow key={row.graha} row={row} />
              ))}
            </View>
          </ScrollView>
        </View>
      ) : (
        <Text style={{ color: colors.destructive, ...nepaliTextStyle(14) }} className="text-sm">
          {pick("ल्याउन सकिएन।", "Could not load.")}
        </Text>
      )}

      <Text className="mt-2 text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
        {pick(
          "↺ = वक्री (retrograde) · 🔥 = अस्त (combust)। स्थिति सूर्योदयको क्षणमा गणना गरिएको।",
          "↺ = retrograde · 🔥 = combust. Positions are computed at local sunrise.",
        )}
      </Text>

      <GrahaDescription pageId="graha-sthiti" />
      <AllElementsLink />
    </AppShell>
  );
}
