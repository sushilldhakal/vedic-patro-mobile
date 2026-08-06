import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Text } from "@/components/ui/Text";
import {
  dashaExpandKeys,
  fetchDashaChildren,
  type DashaSystem,
  type DashaTreeNode,
} from "@/lib/api";
import { formatDashaMoment } from "@/lib/bs-calendar";
import {
  DASHA_LORD_EN,
  DASHA_LORD_NE,
  breakdownDashaDuration,
  formatDashaDuration,
  formatDashaDurationParts,
  type DashaLord,
  type DashaSpan,
} from "@/lib/dasha";
import { useLocale } from "@/lib/i18n";
import { kundaliLabel } from "@/lib/kundali/kundali-i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { colorWithAlpha } from "@/lib/theme";
import { useThemeColors } from "@/lib/theme-context";

const LEVEL_LABELS: { ne: string; en: string }[] = [
  { ne: "महादशा", en: "Maha Dasha" },
  { ne: "अन्तर्दशा", en: "Antar Dasha" },
  { ne: "प्रत्यन्तर्दशा", en: "Pratyantar Dasha" },
  { ne: "सूक्ष्म दशा", en: "Sukshma Dasha" },
  { ne: "प्राण दशा", en: "Prana Dasha" },
];

const MAX_LEVEL = LEVEL_LABELS.length - 1;

const LORD_BORDER: Record<DashaLord, string> = {
  sun: "#f59e0b",
  moon: "#94a3b8",
  mars: "#ef4444",
  mercury: "#10b981",
  jupiter: "#ca8a04",
  venus: "#ec4899",
  saturn: "#8b5cf6",
  rahu: "#737373",
  ketu: "#ea580c",
};

const YOGINI_BORDER: Record<string, string> = {
  mangala: "#f43f5e",
  pingala: "#f97316",
  dhanya: "#f59e0b",
  bhramari: "#ca8a04",
  bhadrika: "#84cc16",
  ulka: "#06b6d4",
  siddha: "#0ea5e9",
  sankata: "#8b5cf6",
};

const DURATION_COLS = [
  { ne: "अवधि (BS)", en: "Duration (BS)" },
  { ne: "वर्ष", en: "Years" },
  { ne: "मास", en: "Months" },
  { ne: "दिन", en: "Days" },
  { ne: "योग", en: "Yoga" },
] as const;

function lordBorderColor(lord: string, system: DashaSystem): string {
  if (system === "yogini") return YOGINI_BORDER[lord] ?? "#737373";
  return LORD_BORDER[(lord as DashaLord) in LORD_BORDER ? (lord as DashaLord) : "ketu"];
}

function lordDotColor(lord: string, system: DashaSystem): string {
  return lordBorderColor(lord, system);
}

type SpanWithChildren = DashaSpan & { childNodes?: DashaTreeNode[]; lordNe: string };

function toSpan(node: DashaTreeNode): SpanWithChildren {
  return {
    lord: (node.lord as DashaLord) ?? "ketu",
    lordNe: node.lord_ne,
    start: new Date(node.start),
    end: new Date(node.end),
    childNodes: node.children,
  };
}

function displayLordName(span: SpanWithChildren, lang: "ne" | "en", system: DashaSystem): string {
  if (system === "yogini") return span.lordNe;
  const lord = span.lord as DashaLord;
  return lang === "en" ? DASHA_LORD_EN[lord] ?? span.lordNe : DASHA_LORD_NE[lord] ?? span.lordNe;
}

function MomentLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row flex-wrap gap-x-2">
      <Text
        className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        style={nepaliTextStyle(11)}
      >
        {label}
      </Text>
      <Text className="min-w-0 flex-1 text-sm text-foreground/90" style={nepaliTextStyle(13)}>
        {value}
      </Text>
    </View>
  );
}

function SpanProgress({
  start,
  end,
  now,
  running,
  secondary,
}: {
  start: Date;
  end: Date;
  now: number;
  running: boolean;
  secondary: string;
}) {
  if (!running) return null;
  const total = end.getTime() - start.getTime();
  const pct = total > 0 ? Math.min(100, Math.max(0, ((now - start.getTime()) / total) * 100)) : 0;
  return (
    <View className="mt-2 h-1 overflow-hidden rounded-full bg-muted/60">
      <View
        style={{ width: `${pct}%`, backgroundColor: secondary }}
        className="h-full rounded-full"
      />
    </View>
  );
}

function DashaDurationGrid({
  start,
  end,
  lang,
  digits,
}: {
  start: Date;
  end: Date;
  lang: "ne" | "en";
  digits: (v: string | number) => string;
}) {
  const ms = end.getTime() - start.getTime();
  const parts = breakdownDashaDuration(ms);
  const avadhi = formatDashaDurationParts(parts, lang);
  const values = [avadhi, parts.years, parts.months, parts.days, parts.yogas] as const;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator className="mt-2 pl-[22px]">
      <View className="min-w-[280px] overflow-hidden rounded-md border border-border/50">
        <View className="flex-row border-b border-border/50 bg-muted/30">
          {DURATION_COLS.map((col) => (
            <View key={col.ne} className="min-w-[56px] flex-1 border-r border-border/50 px-1.5 py-1 last:border-r-0">
              <Text
                numberOfLines={2}
                className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                style={nepaliTextStyle(10)}
              >
                {lang === "en" ? col.en : col.ne}
              </Text>
            </View>
          ))}
        </View>
        <View className="flex-row">
          {values.map((value, i) => (
            <View key={DURATION_COLS[i]!.ne} className="min-w-[56px] flex-1 border-r border-border/50 px-1.5 py-1 last:border-r-0">
              <Text className="font-num text-sm text-foreground/90">{digits(value)}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function TimelineDot({
  running,
  level,
  lord,
  system,
  colors,
}: {
  running: boolean;
  level: number;
  lord: string;
  system: DashaSystem;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const size = level === 0 ? 14 : level === 1 ? 10 : 8;
  const left = level === 0 ? -7 : level === 1 ? -5 : -4;
  return (
    <View
      style={{
        position: "absolute",
        top: 18,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: colors.background,
        backgroundColor: running ? colors.secondary : lordDotColor(lord, system),
        ...(running
          ? { shadowColor: colors.secondary, shadowOpacity: 0.35, shadowRadius: 2 }
          : {}),
      }}
    />
  );
}

function DashaNode({
  span,
  level,
  now,
  timeZone,
  isLast,
  system,
  maxLevel,
}: {
  span: SpanWithChildren;
  level: number;
  now: number;
  timeZone?: string;
  isLast?: boolean;
  system: DashaSystem;
  maxLevel: number;
}) {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);

  const running = span.start.getTime() <= now && now < span.end.getTime();
  const expandable = level < maxLevel;

  const needsFetch = open && expandable && !span.childNodes;
  const startIso = span.start.toISOString();
  const endIso = span.end.toISOString();
  const childQ = useQuery({
    queryKey: dashaExpandKeys.span(span.lord, startIso, endIso, system),
    queryFn: () => fetchDashaChildren(span.lord, startIso, endIso, system),
    enabled: needsFetch,
    staleTime: Infinity,
  });

  const children = useMemo<SpanWithChildren[] | null>(() => {
    if (!open || !expandable) return null;
    const nodes = span.childNodes ?? childQ.data?.children;
    return nodes ? nodes.map(toSpan) : null;
  }, [open, expandable, span.childNodes, childQ.data]);

  const duration = formatDashaDuration(span.end.getTime() - span.start.getTime(), lang);
  const levelLabel = pick(LEVEL_LABELS[level]!.ne, LEVEL_LABELS[level]!.en);
  const border = lordBorderColor(span.lord, system);

  return (
    <View className={level === 0 ? "pb-4" : "pb-2"} style={level > 0 ? { marginLeft: 4 } : undefined}>
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: isLast && !open ? 18 : 0,
          left: level === 0 ? -1 : 0,
          width: 2,
          backgroundColor: colorWithAlpha(colors.border, level === 0 ? 0.8 : 0.5),
        }}
      />
      <TimelineDot running={running} level={level} lord={span.lord} system={system} colors={colors} />

      <View
        className="ml-5 overflow-hidden rounded-xl border"
        style={{
          borderColor: running ? colorWithAlpha(colors.secondary, 0.4) : colorWithAlpha(border, 0.35),
          backgroundColor: colorWithAlpha(border, 0.08),
          ...(running ? { borderWidth: 1 } : {}),
        }}
      >
        <Pressable
          disabled={!expandable}
          onPress={() => expandable && setOpen((v) => !v)}
          className="px-3 py-2.5 active:opacity-90"
        >
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            {expandable ? (
              <Ionicons
                name={open ? "chevron-down" : "chevron-forward"}
                size={14}
                color={colors.mutedForeground}
              />
            ) : (
              <View style={{ width: 14 }} />
            )}
            <Text className="text-sm font-bold text-foreground" style={nepaliTextStyle(14)}>
              {displayLordName(span, lang, system)}
            </Text>
            <Text className="text-sm text-foreground" style={nepaliTextStyle(13)}>
              {levelLabel} · {digits(duration)}
            </Text>
            {running ? (
              <View
                style={{ backgroundColor: colorWithAlpha(colors.secondary, 0.15) }}
                className="rounded-full px-2 py-0.5"
              >
                <Text style={{ color: colors.secondary }} className="text-xs font-bold">
                  {kundaliLabel("dasha_running", lang)}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="mt-2 gap-0.5 pl-[22px]">
            <MomentLine
              label={kundaliLabel("dasha_begin", lang)}
              value={formatDashaMoment(span.start, lang, timeZone, digits)}
            />
            <MomentLine
              label={kundaliLabel("dasha_end", lang)}
              value={formatDashaMoment(span.end, lang, timeZone, digits)}
            />
          </View>

          <DashaDurationGrid start={span.start} end={span.end} lang={lang} digits={digits} />
          <SpanProgress
            start={span.start}
            end={span.end}
            now={now}
            running={running}
            secondary={colors.secondary}
          />
        </Pressable>

        {needsFetch && childQ.isLoading ? (
          <View className="border-t border-border/50 py-3">
            <ActivityIndicator color={colors.secondary} />
          </View>
        ) : null}

        {children ? (
          <View className="border-t border-border/50 bg-card/40 px-2 pb-2 pt-1">
            {children.map((child, i) => (
              <DashaNode
                key={`${child.lord}-${child.start.getTime()}-${i}`}
                span={child}
                level={level + 1}
                now={now}
                timeZone={timeZone}
                isLast={i === children.length - 1}
                system={system}
                maxLevel={maxLevel}
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export type DashaTreeProps = {
  tree: DashaTreeNode[];
  timeZone?: string;
  system?: DashaSystem;
  maxLevel?: number;
  cycleYears?: number;
};

export function DashaTree({
  tree,
  timeZone,
  system = "vimshottari",
  maxLevel = MAX_LEVEL,
  cycleYears,
}: DashaTreeProps) {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();
  const [now] = useState(() => Date.now());
  const mahadashas = useMemo(() => tree.map(toSpan), [tree]);

  const running = mahadashas.find((m) => m.start.getTime() <= now && now < m.end.getTime());

  const timelineStart = mahadashas[0]?.start;
  const timelineEnd = mahadashas[mahadashas.length - 1]?.end;
  const yoginiCycle =
    running && cycleYears
      ? Math.floor(
          (running.start.getTime() - (timelineStart?.getTime() ?? running.start.getTime())) /
            (cycleYears * 365.2425 * 86400000),
        ) + 1
      : null;

  return (
    <View className="gap-5">
      {timelineStart && timelineEnd ? (
        <View className="gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
          <View className="flex-row flex-wrap items-center gap-x-1">
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" style={nepaliTextStyle(11)}>
              {kundaliLabel("dasha_from", lang)}
            </Text>
            <Text className="text-sm text-foreground/90" style={nepaliTextStyle(13)}>
              {formatDashaMoment(timelineStart, lang, timeZone, digits)}
            </Text>
          </View>
          <View className="flex-row flex-wrap items-center gap-x-1">
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" style={nepaliTextStyle(11)}>
              {kundaliLabel("dasha_to", lang)}
            </Text>
            <Text className="text-sm text-foreground/90" style={nepaliTextStyle(13)}>
              {formatDashaMoment(timelineEnd, lang, timeZone, digits)}
            </Text>
          </View>
        </View>
      ) : null}

      {running ? (
        <View
          className="overflow-hidden rounded-xl border px-4 py-3"
          style={{
            borderColor: colorWithAlpha(colors.secondary, 0.3),
            backgroundColor: colorWithAlpha(colors.secondary, 0.06),
          }}
        >
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: colors.secondary,
            }}
          />
          <View className="flex-row flex-wrap items-center justify-between gap-2 pl-2">
            <Text className="text-sm font-bold text-foreground" style={nepaliTextStyle(14)}>
              {displayLordName(running, lang, system)}
              <Text className="font-normal"> · </Text>
              {kundaliLabel("dasha_maha", lang)}
            </Text>
            <View className="flex-row flex-wrap items-center gap-2">
              {yoginiCycle ? (
                <View className="rounded-full border border-border/60 bg-card px-2 py-0.5">
                  <Text className="text-xs font-semibold text-foreground" style={nepaliTextStyle(12)}>
                    {pick(`चक्र: ${digits(yoginiCycle)}`, `Cycle: ${digits(yoginiCycle)}`)}
                  </Text>
                </View>
              ) : null}
              <View
                style={{ backgroundColor: colorWithAlpha(colors.secondary, 0.15) }}
                className="rounded-full px-2 py-0.5"
              >
                <Text style={{ color: colors.secondary }} className="text-xs font-bold">
                  {kundaliLabel("dasha_running_now", lang)}
                </Text>
              </View>
            </View>
          </View>
          <View className="mt-1.5 gap-0.5 pl-2">
            <MomentLine
              label={kundaliLabel("dasha_begin", lang)}
              value={formatDashaMoment(running.start, lang, timeZone, digits)}
            />
            <MomentLine
              label={kundaliLabel("dasha_end", lang)}
              value={formatDashaMoment(running.end, lang, timeZone, digits)}
            />
          </View>
          <DashaDurationGrid start={running.start} end={running.end} lang={lang} digits={digits} />
          <View className="mt-2 flex-row flex-wrap gap-x-5 gap-y-1 pl-2">
            <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
              {kundaliLabel("dasha_total", lang)} —{" "}
              <Text className="font-semibold text-foreground">
                {digits(formatDashaDuration(running.end.getTime() - running.start.getTime(), lang))}
              </Text>
            </Text>
            <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
              {kundaliLabel("dasha_left", lang)} —{" "}
              <Text className="font-semibold text-foreground">
                {digits(formatDashaDuration(running.end.getTime() - now, lang))}
              </Text>
            </Text>
          </View>
          <View className="pl-2">
            <SpanProgress
              start={running.start}
              end={running.end}
              now={now}
              running
              secondary={colors.secondary}
            />
          </View>
        </View>
      ) : null}

      <View className="pl-3">
        {mahadashas.map((span, i) => (
          <DashaNode
            key={`${span.lord}-${span.start.getTime()}-${i}`}
            span={span}
            level={0}
            now={now}
            timeZone={timeZone}
            isLast={i === mahadashas.length - 1}
            system={system}
            maxLevel={maxLevel}
          />
        ))}
      </View>
    </View>
  );
}
