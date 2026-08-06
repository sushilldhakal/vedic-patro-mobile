import { useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "@/components/AppShell";
import { AvakahadaWheel } from "@/components/avakahada/AvakahadaWheel";
import { Text } from "@/components/ui/Text";
import {
  AVAKAHADA,
  BHAUMA_DOSHA_SHLOKAS,
  MANGLI_VARGAS,
  type Gana,
} from "@/lib/avakahada-data";
import {
  localizeDeity,
  localizeGana,
  localizeJati,
  localizeLord,
  localizeMukha,
  localizeNadi,
  localizeNakshatra,
  localizeRashis,
  localizeSanjna,
  localizeVarga,
  localizeVarna,
  localizeVashya,
  localizeYoni,
  rowMetaFromCharans,
} from "@/lib/avakahada-locale";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useBreakpoint } from "@/lib/responsive";
import {
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableHeaderLabel,
  TableRow,
  TableScrollShell,
} from "@/components/ui/DataTable";
import { useTheme, useThemeColors } from "@/lib/theme-context";

const GANA_TONE: Record<Gana, { bg: string; fg: string }> = {
  देव: { bg: "rgba(16,185,129,0.15)", fg: "#047857" },
  नर: { bg: "rgba(14,165,233,0.15)", fg: "#0369a1" },
  राक्षस: { bg: "rgba(244,63,94,0.15)", fg: "#be123c" },
};

const GANA_TONE_DARK: Record<Gana, { bg: string; fg: string }> = {
  देव: { bg: "rgba(16,185,129,0.15)", fg: "#6ee7b7" },
  नर: { bg: "rgba(14,165,233,0.15)", fg: "#7dd3fc" },
  राक्षस: { bg: "rgba(244,63,94,0.15)", fg: "#fda4af" },
};

interface Row {
  index: number;
  ne: string;
  en: string;
  label: string;
  aksharas: string[];
  charanRashis: string[];
  aksharaText: string;
  rashiText: string;
  deity: string;
  jati: string;
  sanjna: string;
  mukha: string;
  lord: string;
  varna: string;
  vashya: string;
  yoni: string;
  vairiYoni: string;
  gana: Gana;
  nadi: string;
}

function buildRows(lang: string): Row[] {
  return AVAKAHADA.map((r) => {
    const meta = rowMetaFromCharans(r.charanRashis);
    return {
      index: r.index,
      ne: r.ne,
      en: r.en,
      label: localizeNakshatra(r, lang),
      aksharas: r.aksharas,
      charanRashis: r.charanRashis,
      aksharaText: r.aksharas.join(" "),
      rashiText: localizeRashis(r.rashis, lang),
      deity: localizeDeity(r.deity, lang),
      jati: localizeJati(r.jati, lang),
      sanjna: localizeSanjna(r.sanjna, lang),
      mukha: localizeMukha(r.mukha, lang),
      lord: localizeLord(meta.lord, lang),
      varna: localizeVarna(meta.varna, lang),
      vashya: localizeVashya(meta.vashya, lang),
      yoni: localizeYoni(r.yoni, lang),
      vairiYoni: localizeYoni(r.vairiYoni, lang),
      gana: r.gana,
      nadi: localizeNadi(r.nadi, lang),
    };
  });
}

function matches(row: Row, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    row.ne,
    row.en,
    row.label,
    row.deity,
    row.jati,
    row.sanjna,
    row.mukha,
    row.aksharaText,
    row.rashiText,
    row.lord,
    row.varna,
    row.vashya,
    row.yoni,
    row.vairiYoni,
    row.gana,
    localizeGana(row.gana, "en"),
    row.nadi,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

type SortKey =
  | "index"
  | "deity"
  | "jati"
  | "sanjna"
  | "mukha"
  | "rashiText"
  | "lord"
  | "varna"
  | "vashya"
  | "yoni"
  | "vairiYoni"
  | "gana"
  | "nadi";

const COLUMNS: {
  key: SortKey | "akshara";
  ne: string;
  en: string;
  width: number;
  sortable: boolean;
}[] = [
  { key: "index", ne: "नक्षत्र", en: "Nakshatra", width: 150, sortable: true },
  { key: "deity", ne: "स्वामी", en: "Deity (Swami)", width: 108, sortable: true },
  { key: "jati", ne: "जात", en: "Jati", width: 92, sortable: true },
  { key: "sanjna", ne: "संज्ञा", en: "Sanjna", width: 92, sortable: true },
  { key: "mukha", ne: "मुख", en: "Mukha", width: 92, sortable: true },
  {
    key: "akshara",
    ne: "नामाक्षर (चरण १–४)",
    en: "Name syllable (charan 1–4)",
    width: 168,
    sortable: false,
  },
  { key: "rashiText", ne: "राशि", en: "Rashi", width: 118, sortable: true },
  { key: "lord", ne: "राशि स्वामी", en: "Rashi lord", width: 118, sortable: true },
  { key: "varna", ne: "वर्ण", en: "Varna", width: 100, sortable: true },
  { key: "vashya", ne: "वश्य", en: "Vashya", width: 100, sortable: true },
  { key: "yoni", ne: "योनि", en: "Yoni", width: 96, sortable: true },
  { key: "vairiYoni", ne: "वैरि योनि", en: "Enemy yoni", width: 100, sortable: true },
  { key: "gana", ne: "गण", en: "Gana", width: 84, sortable: true },
  { key: "nadi", ne: "नाडी", en: "Nadi", width: 84, sortable: true },
];

const TABLE_MIN_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0);

export default function AvakahadaScreen() {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const { width, isTablet } = useBreakpoint();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "index",
    dir: "asc",
  });

  const ganaTone = isDark ? GANA_TONE_DARK : GANA_TONE;

  const data = useMemo(() => buildRows(lang), [lang]);

  const rows = useMemo(() => {
    const filtered = data.filter((r) => matches(r, query));
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [data, query, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );

  return (
    <AppShell
      title={pick("अवकहडा चक्र", "Avakahada Chakra")}
      subtitle={pick(
        "२७ नक्षत्र, १०८ चरण — स्वामी, जात, संज्ञा, मुखा, नामाक्षर, राशि, वर्ण, वश्य, योनि, गण र नाडीको परम्परागत तालिका।",
        "27 nakshatras, 108 charans — deity, jati, sanjna, mukha, name syllables, rashi, varna, vashya, yoni, gana and nadi.",
      )}
      headerRight={<Ionicons name="grid-outline" size={26} color={colors.secondary} />}
    >
      <View className="mb-4 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <Text className="text-sm leading-relaxed text-muted-foreground" style={nepaliTextStyle(14)}>
          {pick(
            "अभिजित् — उत्तराषाढाको चौथो पाउ र श्रवणको सुरुको १५ भागमध्ये १ भाग मिलेर बन्ने अन्तरकालीन (२८औँ) नक्षत्र हो; नामाक्षर: जु, जे, जो, ख।",
            "Abhijit — the intercalary 28th nakshatra formed by the last quarter of Uttara Ashadha and the first 15th of Shravana; name syllables: Ju, Je, Jo, Kha.",
          )}
        </Text>
      </View>

      <View
        className="mb-4 flex-row items-center gap-2 rounded-lg border border-border bg-card px-3"
        style={{ maxWidth: isTablet ? 384 : undefined }}
      >
        <Ionicons name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={pick(
            "नक्षत्र, नामाक्षर, राशि, योनि… खोज्नुहोस्",
            "Search nakshatra, syllable, rashi, yoni…",
          )}
          placeholderTextColor={colors.mutedForeground}
          style={{ flex: 1, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      <TableScrollShell stretch={false}>
        <View style={{ minWidth: TABLE_MIN_WIDTH }}>
          <TableHeader>
            {COLUMNS.map((col) => {
              const active = col.sortable && sort.key === col.key;
              return (
                <TableHeaderCell
                  key={col.key}
                  width={col.width}
                  disabled={!col.sortable}
                  onPress={col.sortable ? () => toggleSort(col.key as SortKey) : undefined}
                >
                  <TableHeaderLabel uppercase={false} numberOfLines={2} className="text-foreground">
                    {pick(col.ne, col.en)}
                  </TableHeaderLabel>
                  {col.sortable ? (
                    <Ionicons
                      name={
                        active ? (sort.dir === "asc" ? "chevron-up" : "chevron-down") : "swap-vertical"
                      }
                      size={11}
                      color={active ? colors.foreground : colors.mutedForeground}
                    />
                  ) : null}
                </TableHeaderCell>
              );
            })}
          </TableHeader>

          {rows.length === 0 ? (
            <View className="px-4 py-8">
              <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
                {pick("कुनै नतिजा भेटिएन।", "No results found.")}
              </Text>
            </View>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow key={row.index} rowIndex={rowIndex}>
                <TableCell width={COLUMNS[0].width}>
                  <Text className="text-sm font-semibold text-foreground" style={nepaliTextStyle(13)}>
                    {digits(row.index)}. {row.label}
                  </Text>
                </TableCell>
                <TableCell width={COLUMNS[1].width}>{row.deity}</TableCell>
                <TableCell width={COLUMNS[2].width}>{row.jati}</TableCell>
                <TableCell width={COLUMNS[3].width}>{row.sanjna}</TableCell>
                <TableCell width={COLUMNS[4].width}>{row.mukha}</TableCell>
                <TableCell width={COLUMNS[5].width}>
                  <View className="flex-row flex-wrap gap-1">
                    {row.aksharas.map((a, i) => (
                      <View
                        key={`${row.index}-${i}`}
                        className="min-w-[28px] items-center rounded-md border border-border bg-card px-1.5 py-0.5"
                      >
                        <Text className="text-sm text-foreground" style={nepaliTextStyle(13)}>
                          {a}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TableCell>
                <TableCell width={COLUMNS[6].width}>{row.rashiText}</TableCell>
                <TableCell width={COLUMNS[7].width}>{row.lord}</TableCell>
                <TableCell width={COLUMNS[8].width}>{row.varna}</TableCell>
                <TableCell width={COLUMNS[9].width}>{row.vashya}</TableCell>
                <TableCell width={COLUMNS[10].width}>{row.yoni}</TableCell>
                <TableCell width={COLUMNS[11].width}>{row.vairiYoni}</TableCell>
                <TableCell width={COLUMNS[12].width}>
                  <View
                    style={{ backgroundColor: ganaTone[row.gana].bg }}
                    className="self-start rounded-full px-2 py-0.5"
                  >
                    <Text
                      style={{ color: ganaTone[row.gana].fg, ...nepaliTextStyle(12) }}
                      className="text-sm font-semibold"
                    >
                      {localizeGana(row.gana, lang)}
                    </Text>
                  </View>
                </TableCell>
                <TableCell width={COLUMNS[13].width}>{row.nadi}</TableCell>
              </TableRow>
            ))
          )}
        </View>
      </TableScrollShell>

      <AvakahadaWheel highlighted={query.trim() ? rows : undefined} />

      <View className="mt-5 gap-4">
        <Text className="text-xl font-bold text-foreground" style={nepaliTextStyle(20)}>
          {pick("भौमदोष (मङ्गली) विचार", "Bhoomadosha (Mangal) considerations")}
        </Text>
        <View className={width >= 640 ? "flex-row gap-3" : "gap-3"}>
          <View className="flex-1 rounded-xl border border-border p-4">
            <Text className="mb-2 text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
              {pick("नामाक्षर वर्ग र शत्रु वर्ग", "Name-syllable groups and enemy groups")}
            </Text>
            <View className="gap-1.5">
              {MANGLI_VARGAS.map((v) => (
                <View key={v.varga} className="flex-row items-center gap-2">
                  <Text className="text-sm text-foreground" style={nepaliTextStyle(14)}>
                    {localizeVarga(v.varga, lang)}
                  </Text>
                  <Text className="text-xs text-muted-foreground">⚔</Text>
                  <Text className="text-sm text-foreground" style={nepaliTextStyle(14)}>
                    {localizeVarga(v.shatru, lang)}
                  </Text>
                </View>
              ))}
            </View>
            <Text className="mt-3 text-xs text-muted-foreground" style={nepaliTextStyle(12)}>
              {pick(
                "वर र वधूको नामाक्षर वर्ग परस्पर शत्रु परेमा भौमदोष (मङ्गली) मानिन्छ।",
                "Bhoomadosha (Mangal) is considered when bride and groom name-syllable groups are mutual enemies.",
              )}
            </Text>
          </View>
          <View className="flex-1 rounded-xl border border-border p-4">
            <Text className="mb-2 text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
              {pick("श्लोक", "Shloka")}
            </Text>
            <View className="gap-3">
              {BHAUMA_DOSHA_SHLOKAS.map((s, i) => (
                <Text
                  key={i}
                  className="text-sm leading-relaxed text-muted-foreground"
                  style={nepaliTextStyle(14)}
                >
                  {s}
                </Text>
              ))}
            </View>
          </View>
        </View>
        <Text className="text-xs leading-relaxed text-muted-foreground" style={nepaliTextStyle(12)}>
          {pick(
            "टिप्पणी: मङ्गल लग्न, ४, ७, ८ वा १२ भावमा परेमा भौमदोष लाग्छ; शनि दृष्टि, गुरु/शुक्र/चन्द्रको स्थिति, केन्द्रगत राहु आदिले दोष परिहार हुन सक्छ (माथिका श्लोक हेर्नुहोस्)।",
            "Note: Mangal in lagna, 4th, 7th, 8th or 12th causes bhoomadosha; Saturn's aspect, Jupiter/Venus/Moon placement, kendragata Rahu etc. can cancel it (see shloka above).",
          )}
        </Text>
      </View>
    </AppShell>
  );
}
