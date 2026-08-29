import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/Text";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { LEARN_DIAGRAMS, type DiagramId } from "@/lib/learn/learn-diagrams";

export function LearnSection({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { lang } = useLocale();
  return (
    <View className="mb-8 gap-3">
      <View className="gap-1 border-b border-border pb-2">
        <Text className="font-num text-xs font-bold uppercase tracking-wider text-secondary">
          {kicker}
        </Text>
        <Text className="text-lg font-bold text-foreground" style={nepaliTextStyle(18)}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-sm text-muted-foreground" style={lang === "en" ? undefined : nepaliTextStyle(14)}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function LearnLede({ children }: { children: ReactNode }) {
  const { lang } = useLocale();
  return (
    <Text className="text-base leading-relaxed text-foreground" style={nepaliTextStyle(16)}>
      {children}
    </Text>
  );
}

export function LearnNote({ children }: { children: ReactNode }) {
  return (
    <View className="rounded-xl border border-border bg-muted/30 px-3 py-3">
      <Text className="text-sm leading-relaxed text-muted-foreground" style={nepaliTextStyle(14)}>
        {children}
      </Text>
    </View>
  );
}

export function LearnKeys({ items }: { items: { title: ReactNode; body: ReactNode; key?: string }[] }) {
  return (
    <View className="gap-2">
      {items.map((item, i) => (
        <View key={item.key ?? i} className="rounded-lg border border-border bg-card px-3 py-2.5">
          <Text className="text-sm font-bold text-foreground" style={nepaliTextStyle(14)}>
            {item.title}
          </Text>
          <Text className="mt-1 text-sm leading-snug text-muted-foreground" style={nepaliTextStyle(13)}>
            {item.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function LearnFormulaRow({
  items,
}: {
  items: { value: ReactNode; unit?: ReactNode; label: ReactNode; desc: ReactNode; key?: string }[];
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item, i) => (
        <View key={item.key ?? i} className="min-w-[44%] flex-1 rounded-xl border border-border bg-card p-3">
          <View className="flex-row items-baseline gap-1">
            <Text className="font-num text-xl font-bold text-secondary">{item.value}</Text>
            {item.unit ? <Text className="text-sm font-semibold text-secondary">{item.unit}</Text> : null}
          </View>
          <Text className="mt-1 text-xs font-bold uppercase tracking-wide text-foreground">{item.label}</Text>
          <Text className="mt-1 text-xs leading-snug text-muted-foreground" style={nepaliTextStyle(11)}>
            {item.desc}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Reference/data table — headers + rows of already-resolved cell content. */
export function LearnTable({
  caption,
  headers,
  rows,
}: {
  caption?: ReactNode;
  headers: ReactNode[];
  rows: ReactNode[][];
}) {
  return (
    <View className="gap-1.5">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="overflow-hidden rounded-xl border border-border">
          <View className="flex-row bg-muted/40">
            {headers.map((h, i) => (
              <View key={i} className="min-w-[104px] px-3 py-2">
                <Text
                  className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                  style={nepaliTextStyle(10)}
                >
                  {h}
                </Text>
              </View>
            ))}
          </View>
          {rows.map((row, ri) => (
            <View
              key={ri}
              className={`flex-row ${ri % 2 === 1 ? "bg-muted/15" : ""} border-t border-border`}
            >
              {row.map((cell, ci) => (
                <View key={ci} className="min-w-[104px] px-3 py-2">
                  <Text className="text-sm text-foreground" style={nepaliTextStyle(13)}>
                    {cell}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      {caption ? (
        <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

/** Bulleted or numbered list. */
export function LearnList({ ordered, items }: { ordered?: boolean; items: ReactNode[] }) {
  return (
    <View className="gap-1.5">
      {items.map((item, i) => (
        <View key={i} className="flex-row gap-2">
          <Text className="font-num text-sm text-secondary">{ordered ? `${i + 1}.` : "·"}</Text>
          <Text className="flex-1 text-sm leading-relaxed text-foreground" style={nepaliTextStyle(14)}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Monospace ASCII figure (zodiac belts, hierarchy trees). */
export function LearnFigure({ art, caption }: { art: string; caption?: ReactNode }) {
  return (
    <View className="gap-1.5">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="rounded-xl border border-border bg-card px-4 py-3">
          <Text className="font-mono text-xs leading-relaxed text-foreground">{art}</Text>
        </View>
      </ScrollView>
      {caption ? (
        <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

/** A worked calculation: the rule, its symbols, and a numeric example. */
export function LearnCalc({
  rule,
  where,
  example,
  result,
  caption,
}: {
  rule: ReactNode[];
  where?: { sym: string; is: ReactNode }[];
  example?: { k: ReactNode; v: ReactNode; key?: string }[];
  result?: ReactNode;
  caption?: ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <View className="gap-3 rounded-xl border-l-[3px] border-l-primary bg-card p-4">
        <View className="gap-1">
          {rule.map((line, i) => (
            <Text key={i} className="font-num text-sm leading-relaxed text-foreground">
              {line}
            </Text>
          ))}
        </View>
        {where && where.length > 0 ? (
          <View className="gap-1 border-t border-border pt-2">
            {where.map((w) => (
              <View key={w.sym} className="flex-row gap-2">
                <Text className="min-w-[2.2rem] font-num text-sm font-semibold text-primary">{w.sym}</Text>
                <Text className="flex-1 text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
                  {w.is}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {example && example.length > 0 ? (
          <View className="gap-1 border-t border-border pt-2">
            {example.map((row, i) => (
              <View key={row.key ?? i} className="flex-row justify-between gap-2">
                <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
                  {row.k}
                </Text>
                <Text className="font-num text-sm font-semibold text-foreground">{row.v}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {result ? (
          <Text className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-foreground">
            {result}
          </Text>
        ) : null}
      </View>
      {caption ? (
        <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

/** Looks up a diagram by id from the shared registry and renders it inline. */
export function LearnDiagramBlock({ id, caption }: { id: DiagramId; caption?: ReactNode }) {
  const Diagram = LEARN_DIAGRAMS[id];
  if (!Diagram) return null;
  return (
    <View className="mt-1 gap-1.5">
      <Diagram />
      {caption ? (
        <Text className="text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

/** In-app link to another learn article or app route — never opens the website. */
export function LearnLink({
  slug,
  href,
  children,
}: {
  slug?: string;
  href?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const path = slug ? `/learn/${slug}` : href;
  if (!path) return <Text>{children}</Text>;
  return (
    <Pressable
      onPress={() => router.push(path as never)}
      accessibilityRole="link"
      className="active:opacity-80"
    >
      <Text className="font-semibold text-secondary underline" style={nepaliTextStyle(16)}>
        {children}
      </Text>
    </Pressable>
  );
}

export function LearnAppRouteLink({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(href as never)} className="mt-2 active:opacity-80">
      <Text className="text-sm font-semibold text-primary" style={nepaliTextStyle(14)}>
        {children} →
      </Text>
    </Pressable>
  );
}
