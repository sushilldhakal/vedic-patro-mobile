import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import type {
  AshtakavargaData,
  BhavaBalaData,
  DashaTreeNode,
  JanmaAvakahadaData,
  KundaliYoga,
  ShadbalaResponse,
  UpagrahaDetailRow,
  VargaChartEntry,
  VargaCharts,
} from "@/lib/api";
import { buildBhavaTable, type BhavaTableRow, RASHI_QUALITIES } from "@/lib/bhava";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import { useLocale } from "@/lib/i18n";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { formatRashiByNumber, rashiNeFromNumber } from "@/lib/rashi-i18n";
import { colorWithAlpha } from "@/lib/theme";
import { useThemeColors } from "@/lib/theme-context";

const SECONDARY = "#0b565a";

export function grahaName(key: string, lang: "ne" | "en"): string {
  const meta = GRAHA_NAME[key as GrahaKey];
  if (key === "lagna") return lang === "en" ? "Ascendant" : "लग्न";
  if (!meta) return key;
  return lang === "en" ? meta.en : meta.ne;
}

function nakshatraLabel(index: number, lang: "ne" | "en"): string {
  const icon = NAKSHATRA_ICONS[index - 1];
  if (!icon) return "—";
  return lang === "en" ? icon.en : icon.ne;
}

/** Card shell with a title bar — the mobile stand-in for the web PanchangaSection. */
export function KundaliSection({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-border bg-card">
      <View className="flex-row items-center gap-2 border-b border-border px-4 py-3">
        {icon ? <Ionicons name={icon} size={16} color={colors.secondary} /> : null}
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-bold text-foreground" style={nepaliTextStyle(14)}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View className="p-3">{children}</View>
    </View>
  );
}

/* ── generic scrollable table ──────────────────────────────────────────── */

export type Column = { key: string; ne: string; en: string; width: number };

export function DataTable({
  columns,
  rows,
}: {
  columns: Column[];
  rows: { key: string; cells: React.ReactNode[]; highlight?: boolean }[];
}) {
  const { pick } = useLocale();
  const colors = useThemeColors();

  return (
    <View className="overflow-hidden rounded-xl border border-border">
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View className="flex-row bg-muted">
            {columns.map((c) => (
              <Text
                key={c.key}
                numberOfLines={2}
                style={{ width: c.width, ...nepaliTextStyle(11) }}
                className="px-2.5 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {pick(c.ne, c.en)}
              </Text>
            ))}
          </View>
          {rows.map((r) => (
            <View
              key={r.key}
              style={r.highlight ? { backgroundColor: colorWithAlpha(SECONDARY, 0.07) } : undefined}
              className="flex-row border-t border-border"
            >
              {r.cells.map((cell, i) => (
                <View key={i} style={{ width: columns[i]?.width ?? 90 }} className="px-2.5 py-2">
                  {typeof cell === "string" || typeof cell === "number" ? (
                    <Text
                      className="text-xs text-foreground"
                      style={nepaliTextStyle(12)}
                      numberOfLines={2}
                    >
                      {cell}
                    </Text>
                  ) : (
                    cell
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ── graha positions (D1) ──────────────────────────────────────────────── */

export function GrahaAstroTable({
  d1Rows,
  points,
  combustion,
}: {
  d1Rows: VargaChartEntry[];
  points: VargaCharts["points"];
  combustion: Record<string, boolean | null>;
}) {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();

  const columns: Column[] = [
    { key: "graha", ne: "ग्रह", en: "Graha", width: 118 },
    { key: "rashi", ne: "राशि", en: "Rashi", width: 104 },
    { key: "dms", ne: "अंश", en: "Degree", width: 108 },
    { key: "nak", ne: "नक्षत्र / पद", en: "Nakshatra / Pada", width: 150 },
    { key: "lord", ne: "स्वामी / उप", en: "Lord / Sub", width: 132 },
    { key: "lon", ne: "स्पष्ट", en: "Longitude", width: 96 },
  ];

  const rows = d1Rows.map((e) => {
    const point = points[e.key];
    const combust = combustion[e.key];
    const dms = `${digits(e.dms.deg)}° ${digits(e.dms.min)}′ ${digits(e.dms.sec)}″`;
    return {
      key: e.key,
      highlight: e.key === "lagna",
      cells: [
        <View key="g" className="flex-row items-center gap-1">
          <Text
            className="text-xs font-semibold text-foreground"
            style={nepaliTextStyle(12)}
            numberOfLines={1}
          >
            {grahaName(e.key, lang)}
          </Text>
          {e.retrograde ? (
            <Text style={{ color: colors.danger }} className="text-[10px] font-bold">
              ↺
            </Text>
          ) : null}
          {combust ? <Text className="text-[10px]">🔥</Text> : null}
        </View>,
        formatRashiByNumber(e.vargaRashi, lang),
        <Text key="d" className="font-num text-xs text-foreground">
          {dms}
        </Text>,
        `${nakshatraLabel(e.nakshatraIndex, lang)} · ${digits(e.pada)}`,
        `${grahaName(e.nakshatraLord, lang)} / ${grahaName(e.subLord, lang)}`,
        <Text key="l" className="font-num text-xs text-foreground">
          {point?.longitude != null ? digits(point.longitude.toFixed(2)) : "—"}
        </Text>,
      ],
    };
  });

  return <DataTable columns={columns} rows={rows} />;
}

/* ── bhava (house) table ───────────────────────────────────────────────── */

export function BhavaTable({
  division,
  anchorKey,
  vargaCharts,
}: {
  division: number;
  anchorKey: string;
  vargaCharts: VargaCharts;
}) {
  const { lang, pick, digits } = useLocale();

  const rows = useMemo<BhavaTableRow[]>(() => {
    const entries = vargaCharts.entries[String(division)] ?? [];
    const anchorEntry = entries.find((e) => e.key === anchorKey);
    if (!anchorEntry) return [];

    const planetRashis = entries
      .filter((e) => e.key !== "lagna")
      .map((e) => ({
        key: e.key,
        labelNe: GRAHA_NAME[e.key as GrahaKey]?.ne ?? e.key,
        rashi: e.vargaRashi,
      }));

    return buildBhavaTable(
      anchorEntry.vargaRashi,
      planetRashis,
      vargaCharts.ownedRashis,
      rashiNeFromNumber,
    );
  }, [division, anchorKey, vargaCharts]);

  if (rows.length === 0) return null;

  const columns: Column[] = [
    { key: "house", ne: "भाव", en: "House", width: 68 },
    { key: "rashi", ne: "राशि", en: "Rashi", width: 104 },
    { key: "qual", ne: "स्वभाव", en: "Qualities", width: 132 },
    { key: "owner", ne: "स्वामी", en: "Lord", width: 104 },
    { key: "residents", ne: "स्थित ग्रह", en: "Residents", width: 168 },
    { key: "aspect", ne: "दृष्टि", en: "Aspected by", width: 168 },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows.map((r) => ({
        key: String(r.house),
        highlight: r.house === 1,
        cells: [
          <Text key="h" className="font-num text-xs font-semibold text-foreground">
            {digits(r.house)}
            {r.badge ? <Text className="text-muted-foreground"> {r.badge}</Text> : null}
          </Text>,
          formatRashiByNumber(r.rashi, lang),
          pick(RASHI_QUALITIES[r.rashi - 1]?.ne ?? "", RASHI_QUALITIES[r.rashi - 1]?.en ?? ""),
          r.owner ? grahaName(r.owner, lang) : "—",
          r.residents.length
            ? r.residents.map((p) => grahaName(p.key, lang)).join(", ")
            : "—",
          r.aspectedBy.length ? r.aspectedBy.map((k) => grahaName(k, lang)).join(", ") : "—",
        ],
      }))}
    />
  );
}

/* ── upagraha table ────────────────────────────────────────────────────── */

export function UpagrahaTable({ rows }: { rows: UpagrahaDetailRow[] }) {
  const { lang, digits } = useLocale();
  if (!rows.length) return null;

  const columns: Column[] = [
    { key: "name", ne: "उपग्रह", en: "Upagraha", width: 132 },
    { key: "rashi", ne: "राशि", en: "Rashi", width: 104 },
    { key: "dms", ne: "अंश", en: "Degree", width: 108 },
    { key: "nak", ne: "नक्षत्र / पद", en: "Nakshatra / Pada", width: 150 },
    { key: "lord", ne: "स्वामी", en: "Lord", width: 104 },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows.map((r) => ({
        key: r.key,
        cells: [
          lang === "en" ? (r.name ?? r.key) : (r.name_ne ?? r.name ?? r.key),
          formatRashiByNumber(r.dms.rashiNum, lang),
          <Text key="d" className="font-num text-xs text-foreground">
            {digits(r.dms.deg)}° {digits(r.dms.min)}′ {digits(r.dms.sec)}″
          </Text>,
          `${nakshatraLabel(r.nakshatraIndex, lang)} · ${digits(r.pada)}`,
          grahaName(r.nakshatraLord, lang),
        ],
      }))}
    />
  );
}

/* ── shadbala ──────────────────────────────────────────────────────────── */

const SHADBALA_STATUS: Record<string, { ne: string; en: string; tone: string }> = {
  Exceptional: { ne: "उत्कृष्ट", en: "Exceptional", tone: "#2e7d32" },
  Strong: { ne: "बलियो", en: "Strong", tone: "#2e7d32" },
  Adequate: { ne: "पर्याप्त", en: "Adequate", tone: "#d97706" },
  Borderline: { ne: "सीमान्त", en: "Borderline", tone: "#d97706" },
  Weak: { ne: "कमजोर", en: "Weak", tone: "#c62828" },
};

export function ShadbalaCard({ shadbala }: { shadbala: ShadbalaResponse }) {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Summary
          label={pick("सबैभन्दा बलियो", "Strongest")}
          value={lang === "en" ? shadbala.summary.strongest.name : shadbala.summary.strongest.name_ne}
          sub={`${digits((shadbala.summary.strongest.ratio * 100).toFixed(0))}%`}
          tone="#2e7d32"
        />
        <Summary
          label={pick("सबैभन्दा कमजोर", "Weakest")}
          value={lang === "en" ? shadbala.summary.weakest.name : shadbala.summary.weakest.name_ne}
          sub={`${digits((shadbala.summary.weakest.ratio * 100).toFixed(0))}%`}
          tone="#c62828"
        />
      </View>

      <View className="gap-1.5">
        {shadbala.planets.map((p) => {
          const status = SHADBALA_STATUS[p.status] ?? {
            ne: p.status,
            en: p.status,
            tone: colors.foreground,
          };
          const pct = Math.max(0, Math.min(1, p.ratio));
          return (
            <View key={p.key} className="gap-1">
              <View className="flex-row items-baseline justify-between gap-2">
                <Text className="text-xs font-semibold text-foreground" style={nepaliTextStyle(12)}>
                  {lang === "en" ? p.name : p.name_ne}
                </Text>
                <View className="flex-row items-baseline gap-2">
                  <Text style={{ color: status.tone, ...nepaliTextStyle(11) }} className="text-xs">
                    {pick(status.ne, status.en)}
                  </Text>
                  <Text className="font-num text-xs text-muted-foreground">
                    {digits(p.rupas.toFixed(2))} / {digits(p.required.toFixed(0))}
                  </Text>
                </View>
              </View>
              <View
                style={{ backgroundColor: colors.surfaceInset }}
                className="h-2 overflow-hidden rounded-full"
              >
                <View
                  style={{ width: `${pct * 100}%`, backgroundColor: status.tone }}
                  className="h-full rounded-full"
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Summary({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: string;
}) {
  return (
    <View
      style={{ backgroundColor: colorWithAlpha(tone, 0.1), minWidth: 140 }}
      className="flex-1 rounded-xl px-3 py-2.5"
    >
      <Text className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      <Text style={{ color: tone, ...nepaliTextStyle(15) }} className="text-base font-bold">
        {value}
      </Text>
      <Text className="font-num text-xs text-muted-foreground">{sub}</Text>
    </View>
  );
}

/* ── bhava bala ────────────────────────────────────────────────────────── */

export function BhavaBalaCard({ data }: { data: BhavaBalaData }) {
  const { pick, digits } = useLocale();
  const colors = useThemeColors();
  const max = Math.max(...data.houses.map((h) => h.rupas), 1);

  return (
    <View className="gap-1.5">
      {data.houses.map((h) => {
        const strongest = h.house === data.strongest.house;
        const weakest = h.house === data.weakest.house;
        const tone = strongest ? "#2e7d32" : weakest ? "#c62828" : colors.secondary;
        return (
          <View key={h.house} className="flex-row items-center gap-2">
            <Text className="w-8 font-num text-xs font-semibold text-foreground">
              {digits(h.house)}
            </Text>
            <View
              style={{ backgroundColor: colors.surfaceInset }}
              className="h-2.5 flex-1 overflow-hidden rounded-full"
            >
              <View
                style={{ width: `${(h.rupas / max) * 100}%`, backgroundColor: tone }}
                className="h-full rounded-full"
              />
            </View>
            <Text className="w-16 text-right font-num text-xs text-muted-foreground">
              {digits(h.rupas.toFixed(1))}
            </Text>
          </View>
        );
      })}
      <Text className="mt-1 text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
        {pick(
          `सबैभन्दा बलियो भाव ${digits(data.strongest.house)}, कमजोर ${digits(data.weakest.house)}`,
          `Strongest house ${data.strongest.house}, weakest ${data.weakest.house}`,
        )}
      </Text>
    </View>
  );
}

/* ── ashtakavarga ──────────────────────────────────────────────────────── */

export function AshtakavargaCard({ data }: { data: AshtakavargaData }) {
  const { lang, pick, digits } = useLocale();
  const [mode, setMode] = useState<"raw" | "reduced">("raw");
  const colors = useThemeColors();

  const rows = mode === "raw" ? data.raw : data.reduced;
  if (!rows?.length) return null;

  const planetKeys = Object.keys(rows[0]).filter(
    (k) => k !== "rashi" && k !== "sign" && k !== "total",
  );

  const columns: Column[] = [
    { key: "rashi", ne: "राशि", en: "Rashi", width: 104 },
    ...planetKeys.map((k) => ({ key: k, ne: grahaName(k, "ne"), en: grahaName(k, "en"), width: 66 })),
    { key: "total", ne: "जम्मा", en: "Total", width: 68 },
  ];

  return (
    <View className="gap-3">
      <View className="flex-row gap-1 self-start rounded-lg border border-border p-0.5">
        {(["raw", "reduced"] as const).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={{ backgroundColor: active ? colors.secondary : "transparent" }}
              className="rounded-md px-3 py-1.5 active:opacity-80"
            >
              <Text
                style={{ color: active ? "#ffffff" : colors.mutedForeground, ...nepaliTextStyle(12) }}
                className="text-xs font-semibold"
              >
                {m === "raw" ? pick("प्रस्तार", "Raw") : pick("शोधित", "Reduced")}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <DataTable
        columns={columns}
        rows={rows.map((row, i) => {
          const r = row as unknown as Record<string, number>;
          const rashiNum = Number(r.rashi ?? r.sign ?? i + 1);
          return {
            key: String(i),
            cells: [
              formatRashiByNumber(rashiNum, lang),
              ...planetKeys.map((k) => (
                <Text key={k} className="font-num text-xs text-foreground">
                  {digits(r[k] ?? 0)}
                </Text>
              )),
              <Text key="t" className="font-num text-xs font-bold text-foreground">
                {digits(r.total ?? 0)}
              </Text>,
            ],
          };
        })}
      />
    </View>
  );
}

/* ── yogas ─────────────────────────────────────────────────────────────── */

const YOGA_NATURE: Record<KundaliYoga["nature"], { ne: string; en: string; tone: string }> = {
  auspicious: { ne: "शुभ", en: "Auspicious", tone: "#2e7d32" },
  inauspicious: { ne: "अशुभ", en: "Inauspicious", tone: "#c62828" },
  mixed: { ne: "मिश्रित", en: "Mixed", tone: "#d97706" },
  caution: { ne: "सावधानी", en: "Caution", tone: "#d97706" },
};

export function YogaList({ yogas }: { yogas: KundaliYoga[] }) {
  const { lang, pick } = useLocale();
  const present = yogas.filter((y) => y.present);

  if (!present.length) {
    return (
      <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
        {pick("यस कुण्डलीमा कुनै प्रमुख योग भेटिएन।", "No major yogas found in this chart.")}
      </Text>
    );
  }

  return (
    <View className="gap-2">
      {present.map((y) => {
        const nature = YOGA_NATURE[y.nature];
        return (
          <View
            key={y.key}
            style={{ borderLeftColor: nature.tone, borderLeftWidth: 3 }}
            className="rounded-lg border border-border bg-background p-3"
          >
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-sm font-bold text-foreground" style={nepaliTextStyle(14)}>
                {lang === "en" ? y.nameEn : y.nameNe}
              </Text>
              <View
                style={{ backgroundColor: colorWithAlpha(nature.tone, 0.12) }}
                className="rounded-full px-2 py-0.5"
              >
                <Text
                  style={{ color: nature.tone, ...nepaliTextStyle(10) }}
                  className="text-[10px] font-bold"
                >
                  {pick(nature.ne, nature.en)}
                </Text>
              </View>
            </View>
            <Text
              className="mt-1 text-sm leading-relaxed text-muted-foreground"
              style={nepaliTextStyle(13)}
            >
              {lang === "en" ? y.descEn : y.descNe}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* ── avakahada (janma) ─────────────────────────────────────────────────── */

export function AvakahadaCard({ data }: { data: JanmaAvakahadaData }) {
  const { lang, pick, digits } = useLocale();

  const rows: { label: string; value: string }[] = [
    {
      label: pick("नक्षत्र", "Nakshatra"),
      value: `${lang === "en" ? data.nakshatra.en : data.nakshatra.ne} · ${pick("पद", "pada")} ${digits(data.pada)}`,
    },
    { label: pick("राशि पाया", "Rashi paya"), value: lang === "en" ? data.rashiPaya.en : data.rashiPaya.ne },
    {
      label: pick("नक्षत्र पाया", "Nakshatra paya"),
      value: lang === "en" ? data.nakshatraPaya.en : data.nakshatraPaya.ne,
    },
    { label: pick("तत्त्व", "Tattva"), value: lang === "en" ? data.tattva.en : data.tattva.ne },
    { label: pick("युञ्ज", "Yunja"), value: lang === "en" ? data.yunja.en : data.yunja.ne },
    { label: pick("वश्य", "Vashya"), value: lang === "en" ? data.vashya.en : data.vashya.ne },
    { label: pick("तारा", "Tara"), value: lang === "en" ? data.tara.en : data.tara.ne },
    { label: pick("गण", "Gana"), value: lang === "en" ? data.gana.en : data.gana.ne },
    { label: pick("नामाक्षर", "Akshara"), value: lang === "en" ? data.akshara.en : data.akshara.ne },
    { label: pick("नाडी", "Nadi"), value: lang === "en" ? data.nadi.en : data.nadi.ne },
    { label: pick("आसन", "Asana"), value: lang === "en" ? data.asana.en : data.asana.ne },
    { label: pick("योनि", "Yoni"), value: lang === "en" ? data.yoni.en : data.yoni.ne },
    { label: pick("जाति", "Jati"), value: lang === "en" ? data.jati.en : data.jati.ne },
  ];

  return (
    <View className="flex-row flex-wrap">
      {rows.map((r) => (
        <View key={r.label} style={{ width: "50%" }} className="gap-0.5 pb-3 pr-3">
          <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
            {r.label}
          </Text>
          <Text className="text-sm font-semibold text-foreground" style={nepaliTextStyle(13)}>
            {r.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ── dasha tree ────────────────────────────────────────────────────────── */

function formatDashaDate(iso: string, lang: "ne" | "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(lang === "en" ? "en-US" : "ne-NP", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DashaRow({ node, depth, nowMs }: { node: DashaTreeNode; depth: number; nowMs: number }) {
  const { lang, pick } = useLocale();
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);

  const start = new Date(node.start).getTime();
  const end = new Date(node.end).getTime();
  const current = Number.isFinite(start) && Number.isFinite(end) && start <= nowMs && nowMs < end;
  const children = node.children ?? [];

  return (
    <View>
      <Pressable
        disabled={children.length === 0}
        onPress={() => setOpen((v) => !v)}
        style={{
          paddingLeft: 8 + depth * 14,
          backgroundColor: current ? colorWithAlpha(SECONDARY, 0.1) : undefined,
        }}
        className="flex-row items-center gap-2 border-b border-border py-2 pr-2 active:opacity-80"
      >
        {children.length > 0 ? (
          <Ionicons
            name={open ? "chevron-down" : "chevron-forward"}
            size={13}
            color={colors.mutedForeground}
          />
        ) : (
          <View style={{ width: 13 }} />
        )}
        <Text
          numberOfLines={1}
          style={{
            color: current ? colors.secondary : colors.foreground,
            ...nepaliTextStyle(13),
          }}
          className="min-w-0 flex-1 text-sm font-semibold"
        >
          {lang === "en" ? node.lord : node.lord_ne}
          {current ? (
            <Text className="text-xs font-normal"> · {pick("चलिरहेको", "current")}</Text>
          ) : null}
        </Text>
        <Text className="font-num text-[11px] text-muted-foreground">
          {formatDashaDate(node.start, lang)} – {formatDashaDate(node.end, lang)}
        </Text>
      </Pressable>
      {open
        ? children.map((c, i) => (
            <DashaRow key={`${c.lord}-${c.start}-${i}`} node={c} depth={depth + 1} nowMs={nowMs} />
          ))
        : null}
    </View>
  );
}

export function DashaTree({ tree }: { tree: DashaTreeNode[] }) {
  const [nowMs] = useState(() => Date.now());
  const { pick } = useLocale();

  if (!tree.length) {
    return (
      <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
        {pick("दशा उपलब्ध छैन।", "Dasha is not available.")}
      </Text>
    );
  }

  return (
    <View className="overflow-hidden rounded-xl border border-border">
      {tree.map((n, i) => (
        <DashaRow key={`${n.lord}-${n.start}-${i}`} node={n} depth={0} nowMs={nowMs} />
      ))}
    </View>
  );
}
