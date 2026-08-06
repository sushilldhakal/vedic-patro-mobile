import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/Text";
import { GrahaPlanetIcon } from "@/components/graha/GrahaPlanetIcon";
import type { ShadbalaResponse, VimshottariResponse } from "@/lib/api";
import type { GrahaKey } from "@/lib/graha-details";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useBreakpoint } from "@/lib/responsive";
import { NAVAGRAHA_SHANTI, getGrahaShanti } from "@/lib/shanti/navagraha-shanti";
import {
  TableHeader,
  TableHeaderCell,
  TableHeaderLabel,
  TableRow,
  TableScrollShell,
} from "@/components/ui/DataTable";
import { colorWithAlpha } from "@/lib/theme";
import { useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

const SHADBALA_STATUS_NE: Record<string, string> = {
  Exceptional: "उत्कृष्ट",
  Strong: "बलियो",
  Adequate: "पर्याप्त",
  Borderline: "सीमान्त",
  Weak: "कमजोर",
};

/** Graha name (English / Vedic) → NAVAGRAHA_SHANTI key. */
const LORD_KEY: Record<string, string> = {
  sun: "sun", surya: "sun",
  moon: "moon", chandra: "moon",
  mars: "mars", mangal: "mars", mangala: "mars", kuja: "mars",
  mercury: "mercury", budha: "mercury", budh: "mercury",
  jupiter: "jupiter", guru: "jupiter", brihaspati: "jupiter",
  venus: "venus", shukra: "venus", sukra: "venus",
  saturn: "saturn", shani: "saturn", sani: "saturn",
  rahu: "rahu",
  ketu: "ketu",
};

function lordToKey(name?: string): string | undefined {
  if (!name) return undefined;
  return LORD_KEY[name.toLowerCase().replace(/[^a-z]/g, "")];
}

function InfoTile({
  icon,
  label,
  value,
  width,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  width: string;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={{ width: width as never }}
      className="flex-row items-start gap-2.5 rounded-lg border border-border bg-card p-3"
    >
      <Ionicons name={icon} size={16} color={colors.secondary} style={{ marginTop: 2 }} />
      <View className="min-w-0 flex-1">
        <Text
          className="text-xs uppercase tracking-wide text-muted-foreground"
          style={nepaliTextStyle(11)}
        >
          {label}
        </Text>
        <Text className="text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function RecommendationCard({
  heading,
  grahaKey,
  detail,
  onSelect,
  width,
}: {
  heading: string;
  grahaKey?: string;
  detail?: string;
  onSelect: (key: string) => void;
  width: string;
}) {
  const { pick } = useLocale();
  const colors = useThemeColors();
  const graha = grahaKey ? getGrahaShanti(grahaKey) : undefined;

  return (
    <View
      style={{ width: width as never }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <Text
        className="text-xs uppercase tracking-wide text-muted-foreground"
        style={nepaliTextStyle(11)}
      >
        {heading}
      </Text>
      {graha ? (
        <>
          <View className="mt-1 flex-row flex-wrap items-center gap-2">
            <GrahaPlanetIcon graha={graha.key as GrahaKey} size={28} />
            <Text
              className="text-lg font-bold text-foreground"
              style={nepaliTextStyle(18)}
            >
              {pick(graha.nameNe, graha.nameEn)}
            </Text>
          </View>
          {detail ? (
            <Text className="mt-0.5 text-xs text-muted-foreground" style={nepaliTextStyle(12)}>
              {detail}
            </Text>
          ) : null}
          <Pressable
            onPress={() => onSelect(graha.key)}
            style={{ backgroundColor: colorWithAlpha("#0b565a", 0.1) }}
            className="mt-3 flex-row items-center gap-1.5 self-start rounded-lg border border-secondary px-3 py-1.5 active:opacity-80"
          >
            <Ionicons name="arrow-down-circle-outline" size={14} color={colors.secondary} />
            <Text className="text-sm text-secondary" style={nepaliTextStyle(13)}>
              {pick(`${graha.nameNe} शान्ति हेर्नुहोस्`, `View ${graha.nameEn} shanti`)}
            </Text>
          </Pressable>
        </>
      ) : (
        <Text className="mt-1 text-sm text-muted-foreground">—</Text>
      )}
    </View>
  );
}

/**
 * Navagraha Shanti recommendations + reference, driven by an already-computed
 * Vimshottari dasha and Shadbala for a chart. Used standalone (shanti-vidhi
 * screen) and embeddable in a kundali. No data fetching of its own.
 */
export function ShantiVidhiPanel({
  vimshottari,
  shadbala,
  isError = false,
}: {
  vimshottari?: VimshottariResponse;
  shadbala?: ShadbalaResponse;
  isError?: boolean;
}) {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();
  const { width } = useBreakpoint();
  const [selectedKey, setSelectedKey] = useState("saturn");
  const [nowMs] = useState(() => Date.now());
  const graha = useMemo(
    () => getGrahaShanti(selectedKey) ?? NAVAGRAHA_SHANTI[0],
    [selectedKey],
  );

  // current Mahadasha lord = the sequence period containing "now"
  const currentDasha = useMemo(() => {
    const seq = vimshottari?.sequence ?? [];
    const period = seq.find((p) => {
      const s = new Date(p.start).getTime();
      const e = new Date(p.end).getTime();
      return Number.isFinite(s) && Number.isFinite(e) && s <= nowMs && nowMs < e;
    });
    const key = lordToKey(period?.lord ?? vimshottari?.mahadasha_lord);
    return { key, period };
  }, [vimshottari, nowMs]);

  const weakest = shadbala?.summary.weakest;
  const weakestKey = lordToKey(weakest?.key) ?? weakest?.key;

  // Web uses sm:grid-cols-2 for the recommendation/tile grids and
  // grid-cols-3 / sm:grid-cols-5 / lg:grid-cols-9 for the graha selector.
  const cardWidth = width >= 640 ? "49%" : "100%";
  const tileWidth = width >= 1024 ? "24%" : width >= 640 ? "49%" : "100%";
  const selectorCols = width >= 1024 ? 9 : width >= 640 ? 5 : 3;
  const selectorWidth = `${(100 / selectorCols - 1.5).toFixed(2)}%`;

  const daanItems = lang === "en" ? graha.daanEn ?? graha.daan : graha.daan;

  return (
    <View className="gap-4">
      {isError ? (
        <View
          style={{ backgroundColor: colorWithAlpha("#c62828", 0.1) }}
          className="rounded-lg border border-destructive/30 p-3"
        >
          <Text className="text-sm text-destructive" style={nepaliTextStyle(14)}>
            {pick(
              "गणना ल्याउन सकिएन। मिति/समय/स्थान जाँचेर पुनः प्रयास गर्नुहोस्।",
              "Could not load the calculation. Check date/time/place and try again.",
            )}
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-3">
          <RecommendationCard
            width={cardWidth}
            heading={pick("वर्तमान महादशा (विंशोत्तरी)", "Current Mahadasha (Vimshottari)")}
            grahaKey={currentDasha.key}
            detail={
              currentDasha.period
                ? pick(
                    `${currentDasha.period.lord_ne} महादशा चलिरहेको — यसको शान्ति उपयुक्त।`,
                    `${currentDasha.period.lord} Mahadasha is running — its shanti is suitable.`,
                  )
                : vimshottari?.mahadasha_lord_ne
                  ? pick(
                      `${vimshottari.mahadasha_lord_ne} महादशा (जन्मकालीन)।`,
                      `${vimshottari.mahadasha_lord ?? vimshottari.mahadasha_lord_ne} Mahadasha (at birth).`,
                    )
                  : undefined
            }
            onSelect={setSelectedKey}
          />
          <RecommendationCard
            width={cardWidth}
            heading={pick("सबैभन्दा बलहीन ग्रह (षड्बल)", "Weakest planet (Shadbala)")}
            grahaKey={weakestKey}
            detail={
              weakest
                ? pick(
                    `${weakest.name_ne}: बल ${digits((weakest.ratio * 100).toFixed(0))}% (${SHADBALA_STATUS_NE[weakest.status] ?? weakest.status}) — बल बढाउन शान्ति गर्नुहोस्।`,
                    `${weakest.name ?? weakest.name_ne}: strength ${(weakest.ratio * 100).toFixed(0)}% (${weakest.status}) — do shanti to strengthen it.`,
                  )
                : undefined
            }
            onSelect={setSelectedKey}
          />
        </View>
      )}

      <Text className="text-sm leading-relaxed text-muted-foreground" style={nepaliTextStyle(14)}>
        {pick(
          "गणना जन्म समयको ग्रहस्थिति (विंशोत्तरी महादशा) र ग्रह बल (षड्बल) मा आधारित छ। यो सामान्य मार्गदर्शन हो — विधिवत् उपायका लागि योग्य ज्योतिषीसँग परामर्श गर्नुहोस्।",
          "The calculation is based on the birth-time planetary positions (Vimshottari mahadasha) and planetary strength (Shadbala). This is general guidance — consult a qualified astrologer for formal remedies.",
        )}
      </Text>

      {/* graha selector */}
      <View className="flex-row flex-wrap gap-2">
        {NAVAGRAHA_SHANTI.map((g) => {
          const active = g.key === selectedKey;
          return (
            <Pressable
              key={g.key}
              onPress={() => setSelectedKey(g.key)}
              style={{
                width: selectorWidth as never,
                backgroundColor: active ? colorWithAlpha("#0b565a", 0.1) : colors.card,
                borderColor: active ? colors.secondary : colors.border,
              }}
              className="items-center gap-1 rounded-xl border p-3 active:opacity-80"
            >
              <GrahaPlanetIcon graha={g.key as GrahaKey} size={28} />
              <Text
                numberOfLines={1}
                className={cn(
                  "text-xs font-semibold",
                  active ? "text-secondary" : "text-foreground",
                )}
                style={nepaliTextStyle(12)}
              >
                {pick(g.nameNe, g.nameEn)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* selected graha detail */}
      <View className="overflow-hidden rounded-2xl border border-border">
        <LinearGradient
          colors={[`${graha.colorHex}1f`, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View className="flex-row flex-wrap items-center gap-3 border-b border-border p-5">
            <View
              style={{ backgroundColor: graha.colorHex }}
              className="h-10 w-1.5 self-stretch rounded-full"
            />
            <GrahaPlanetIcon graha={graha.key as GrahaKey} size={40} />
            <View className="min-w-0 flex-1">
              <Text className="text-lg font-bold text-foreground" style={nepaliTextStyle(18)}>
                {pick(`${graha.nameNe} शान्ति`, `${graha.nameEn} Shanti`)}
              </Text>
              <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(12)}>
                {pick(graha.nameEn, graha.nameNe)}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <View className="flex-row items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
                <Text className="text-xs text-foreground" style={nepaliTextStyle(11)}>
                  {pick(graha.vaaraNe, graha.vaaraEn)}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
                <View
                  style={{ backgroundColor: graha.colorHex }}
                  className="h-2.5 w-2.5 rounded-full"
                />
                <Text className="text-xs text-foreground" style={nepaliTextStyle(11)}>
                  {pick(graha.colorNe, graha.colorEn)}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View className="gap-5 p-5">
          {/* mantra + japa */}
          <View className="rounded-xl border border-border bg-muted/30 p-4">
            <Text
              className="mb-1 text-xs uppercase tracking-wide text-muted-foreground"
              style={nepaliTextStyle(11)}
            >
              {pick("बीज मन्त्र", "Beeja Mantra")}
            </Text>
            <Text
              className="text-lg font-semibold leading-relaxed text-foreground"
              style={nepaliTextStyle(18)}
            >
              {graha.beejMantra}
            </Text>
            <Text className="mt-1.5 text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
              {pick(
                `जप संख्या: ${digits(graha.japa)} पटक`,
                `Japa count: ${digits(graha.japa)} times`,
              )}
            </Text>
          </View>

          {/* tiles */}
          <View className="flex-row flex-wrap gap-3">
            <InfoTile
              width={tileWidth}
              icon="leaf-outline"
              label={pick("समिधा (हवन काठ)", "Samidha (homa wood)")}
              value={pick(graha.samidhaNe, graha.samidhaEn)}
            />
            <InfoTile
              width={tileWidth}
              icon="diamond-outline"
              label={pick("रत्न", "Gem")}
              value={pick(graha.gemNe, graha.gemEn)}
            />
            <InfoTile
              width={tileWidth}
              icon="sparkles-outline"
              label={pick("धातु", "Metal")}
              value={pick(graha.metalNe, graha.metalEn)}
            />
            <InfoTile
              width={tileWidth}
              icon="flame-outline"
              label={pick("अधिदेवता", "Deity")}
              value={pick(graha.adhidevataNe, graha.adhidevataEn)}
            />
          </View>

          {/* daan */}
          <View>
            <View className="mb-2 flex-row items-center gap-1.5">
              <Ionicons name="gift-outline" size={16} color={colors.secondary} />
              <Text className="text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
                {pick("दान सामग्री", "Donation items")}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {daanItems.map((item, idx) => (
                <View
                  key={`${item}-${idx}`}
                  className="rounded-full border border-border bg-card px-3 py-1"
                >
                  <Text className="text-sm text-foreground" style={nepaliTextStyle(13)}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="rounded-lg border border-border bg-card p-3">
            <Text className="text-sm leading-relaxed text-muted-foreground" style={nepaliTextStyle(14)}>
              <Text className="font-semibold text-foreground">{pick("उपयोग:", "Use:")}</Text>{" "}
              {pick(graha.remedyNe, graha.remedyEn)}
            </Text>
          </View>
        </View>
      </View>

      {/* full reference table */}
      <View>
        <Text className="mb-3 text-base font-bold text-foreground" style={nepaliTextStyle(16)}>
          {pick("नवग्रह शान्ति तालिका", "Navagraha Shanti table")}
        </Text>
        <TableScrollShell>
          <TableHeader>
            {SHANTI_COLUMNS.map((col) => (
              <TableHeaderCell key={col.key} width={col.width} compact>
                <TableHeaderLabel compact>{pick(col.ne, col.en)}</TableHeaderLabel>
              </TableHeaderCell>
            ))}
          </TableHeader>
          {NAVAGRAHA_SHANTI.map((g, rowIndex) => {
            const active = g.key === selectedKey;
            return (
              <TableRow
                key={g.key}
                rowIndex={rowIndex}
                highlight={active}
                onPress={() => setSelectedKey(g.key)}
              >
                    <Cell width={SHANTI_COLUMNS[0].width} bold>
                      <View className="flex-row items-center gap-1.5">
                        <GrahaPlanetIcon graha={g.key as GrahaKey} size={22} />
                        <Text className="text-xs font-semibold text-foreground" style={nepaliTextStyle(12)}>
                          {pick(g.nameNe, g.nameEn)}
                        </Text>
                      </View>
                    </Cell>
                    <Cell width={SHANTI_COLUMNS[1].width}>{pick(g.vaaraNe, g.vaaraEn)}</Cell>
                    <Cell width={SHANTI_COLUMNS[2].width}>{g.beejMantra}</Cell>
                    <Cell width={SHANTI_COLUMNS[3].width}>{digits(g.japa)}</Cell>
                    <Cell width={SHANTI_COLUMNS[4].width}>{pick(g.samidhaNe, g.samidhaEn)}</Cell>
                    <Cell width={SHANTI_COLUMNS[5].width}>{pick(g.gemNe, g.gemEn)}</Cell>
                    <Cell width={SHANTI_COLUMNS[6].width}>{pick(g.metalNe, g.metalEn)}</Cell>
                    <Cell width={SHANTI_COLUMNS[7].width}>
                      {pick(g.daan.join(", "), g.daanEn.join(", "))}
                    </Cell>
              </TableRow>
            );
          })}
        </TableScrollShell>
        <Text className="mt-2 text-sm leading-relaxed text-muted-foreground" style={nepaliTextStyle(14)}>
          {pick(
            "सूचना: माथिका विवरण शास्त्रीय नवग्रह शान्ति परम्परामा आधारित छन्। रत्नधारण वा विधिवत् हवन गर्नुअघि योग्य ज्योतिषी/पुरोहितसँग परामर्श गर्नुहोस्।",
            "Note: the details above are based on the classical Navagraha Shanti tradition. Consult a qualified astrologer/priest before wearing gems or performing a formal homa.",
          )}
        </Text>
      </View>
    </View>
  );
}

const SHANTI_COLUMNS = [
  { key: "graha", ne: "ग्रह", en: "Planet", width: 92 },
  { key: "vaara", ne: "बार", en: "Day", width: 92 },
  { key: "mantra", ne: "बीज मन्त्र", en: "Beeja mantra", width: 168 },
  { key: "japa", ne: "जप", en: "Japa", width: 68 },
  { key: "samidha", ne: "समिधा", en: "Samidha", width: 110 },
  { key: "gem", ne: "रत्न", en: "Gem", width: 110 },
  { key: "metal", ne: "धातु", en: "Metal", width: 96 },
  { key: "daan", ne: "दान", en: "Daan", width: 220 },
] as const;

function Cell({
  width,
  bold,
  children,
}: {
  width: number;
  bold?: boolean;
  children: React.ReactNode;
}) {
  if (typeof children === "string" || typeof children === "number") {
    return (
      <Text
        style={{ width, ...nepaliTextStyle(12) }}
        className={cn(
          "px-2.5 py-2 text-xs",
          bold ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        {children}
      </Text>
    );
  }
  return (
    <View style={{ width }} className="justify-center px-2.5 py-2">
      {children}
    </View>
  );
}

export default ShantiVidhiPanel;
