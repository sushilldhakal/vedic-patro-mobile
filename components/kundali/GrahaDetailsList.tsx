import { useMemo } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { DataTable, type Column } from "@/components/ui/DataTable";
import type { VargaChartEntry, VargaCharts } from "@/lib/api";
import { rashiToHouse } from "@/lib/bhava";
import {
  DIGNITY_LABELS,
  GRAHA_NAME,
  RELATION_LABELS,
  type GrahaKey,
} from "@/lib/graha-details";
import { useLocale } from "@/lib/i18n";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { formatRashiByNumber } from "@/lib/rashi-i18n";
import { colorWithAlpha } from "@/lib/theme";
import { useThemeColors } from "@/lib/theme-context";

type Row = VargaChartEntry & {
  bhava: number;
  ownerBhava?: number;
  rulesBhavas: number[];
};

function grahaLabel(key: string, lang: "ne" | "en"): string {
  if (key === "lagna") return lang === "en" ? "Ascendant" : "लग्न";
  const meta = GRAHA_NAME[key as GrahaKey];
  if (!meta) return key;
  return lang === "en" ? meta.en : meta.ne;
}

export function GrahaDetailsList({
  division,
  anchorKey,
  vargaCharts,
}: {
  division: number;
  anchorKey: string;
  vargaCharts: VargaCharts;
}) {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();

  const rows = useMemo<Row[]>(() => {
    const entries = vargaCharts.entries[String(division)] ?? [];
    const anchorEntry = entries.find((e) => e.key === anchorKey);
    if (!anchorEntry) return [];
    const anchorRashi = anchorEntry.vargaRashi;
    const byKey = new Map(entries.map((e) => [e.key, e]));

    return entries.map((entry) => {
      const owner = byKey.get(entry.ownerKey);
      const rules = vargaCharts.ownedRashis[entry.key] ?? [];
      return {
        ...entry,
        bhava: rashiToHouse(entry.vargaRashi, anchorRashi),
        ownerBhava: owner ? rashiToHouse(owner.vargaRashi, anchorRashi) : undefined,
        rulesBhavas:
          entry.key !== "lagna"
            ? rules.map((rashi) => rashiToHouse(rashi, anchorRashi)).sort((a, b) => a - b)
            : [],
      };
    });
  }, [division, anchorKey, vargaCharts]);

  if (rows.length === 0) return null;

  const columns: Column[] = [
    { key: "graha", ne: "ग्रह", en: "Graha", width: 84 },
    { key: "rashi_lon", ne: "राशि / स्पष्ट", en: "Rashi / Long.", width: 128 },
    { key: "bhava", ne: "भाव", en: "Bhava", width: 44 },
    { key: "nak", ne: "नक्षत्र (पद)", en: "Nak (pada)", width: 108 },
    { key: "lord_sub", ne: "नक्षत्रेश / उप", en: "Lord / Sub", width: 108 },
    { key: "owner", ne: "स्वामी", en: "Owner", width: 88 },
    { key: "rel", ne: "सम्बन्ध", en: "Relation", width: 72 },
    { key: "dignity", ne: "स्थिति", en: "Dignity", width: 72 },
    { key: "rules", ne: "स्वामित्व", en: "Rules", width: 68 },
  ];

  return (
    <DataTable
      compact
      columns={columns}
      rows={rows.map((row) => {
        const nakName =
          lang === "en"
            ? NAKSHATRA_ICONS[row.nakshatraIndex]?.en ?? "—"
            : NAKSHATRA_ICONS[row.nakshatraIndex]?.ne ?? "—";
        const dmsLine = (
          <Text key="dms" className="font-num text-[11px] text-foreground" numberOfLines={2} style={nepaliTextStyle(11)}>
            <Text className="font-semibold">{digits(String(row.dms.deg).padStart(2, "0"))}°</Text>
            <Text> {formatRashiByNumber(row.dms.rashiNum, lang)} </Text>
            <Text>
              {digits(String(row.dms.min).padStart(2, "0"))}′{digits(String(row.dms.sec).padStart(2, "0"))}″
            </Text>
          </Text>
        );
        const ownerCell =
          row.ownerBhava != null
            ? `${grahaLabel(row.ownerKey, lang)}${
                lang === "en"
                  ? ` (${digits(row.ownerBhava)})`
                  : ` (${digits(row.ownerBhava)})`
              }`
            : grahaLabel(row.ownerKey, lang);

        return {
          key: row.key,
          highlight: Boolean(row.retrograde),
          cells: [
            <View key="g" className="flex-row flex-wrap items-center gap-0.5">
              <Text className="text-[11px] font-semibold text-foreground" style={nepaliTextStyle(11)}>
                {grahaLabel(row.key, lang)}
              </Text>
              {row.retrograde ? (
                <View
                  style={{ backgroundColor: colorWithAlpha(colors.secondary, 0.15) }}
                  className="flex-row items-center gap-0.5 rounded-full px-1 py-px"
                >
                  <Ionicons name="refresh" size={10} color={colors.secondary} />
                  <Text style={{ color: colors.secondary }} className="text-[10px] font-bold">
                    {pick("व", "R")}
                  </Text>
                </View>
              ) : null}
            </View>,
            dmsLine,
            <Text key="b" className="text-center font-num text-[11px] font-semibold text-foreground" style={nepaliTextStyle(11)}>
              {digits(row.bhava)}
            </Text>,
            `${nakName} (${digits(row.pada)})`,
            `${grahaLabel(row.nakshatraLord, lang)}/${grahaLabel(row.subLord, lang)}`,
            ownerCell,
            row.relation
              ? pick(RELATION_LABELS[row.relation].ne, RELATION_LABELS[row.relation].en)
              : "—",
            row.dignity
              ? pick(DIGNITY_LABELS[row.dignity].ne, DIGNITY_LABELS[row.dignity].en)
              : "—",
            row.rulesBhavas.length > 0
              ? pick(
                  `${row.rulesBhavas.map((h) => digits(h)).join(",")}`,
                  row.rulesBhavas.map((h) => digits(h)).join(","),
                )
              : "—",
          ],
        };
      })}
    />
  );
}
