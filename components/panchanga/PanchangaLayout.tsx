import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "@/lib/i18n-translations.web";
import { cn } from "@/lib/utils";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useLocale } from "@/lib/i18n";
import { BREAKPOINTS, useBreakpoint } from "@/lib/responsive";

/** Paired label|value columns — always on native (phones fit compact 2×2 rows). */
export function usePanchangaLayoutWide(): boolean {
  return true;
}

function useQuadLabelWidth(): string {
  const { width } = useBreakpoint();
  return width >= BREAKPOINTS.md ? "w-[4.75rem]" : "w-[3.25rem]";
}

export function SectionSplitPanel({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <View className="flex-row">
      <View className="min-w-0 flex-1 border-r border-border px-3 py-2">{left}</View>
      <View className="min-w-0 flex-1 px-3 py-2">{right}</View>
    </View>
  );
}

export function PanchangaSection({
  titleKey,
  titleNe,
  titleEn,
  children,
  className,
}: {
  titleKey?: string;
  titleNe?: string;
  titleEn?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  const { pick } = useLocale();
  const title = titleKey
    ? t(titleKey)
    : pick(titleNe ?? titleEn ?? "", titleEn ?? titleNe ?? "");

  return (
    <View
      className={cn(
        "rounded-xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]",
        className,
      )}
    >
      <View className="flex items-baseline gap-2.5 border-b border-border bg-secondary/[0.09] px-3 py-2 dark:bg-secondary/20">
        <Text className="m-0 text-sm font-bold">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function rowLabel(labelKey?: string, label?: string, t?: (k: string) => string) {
  if (labelKey && t) return t(labelKey);
  return label ?? "";
}

function QuadLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={cn("pt-0.5 text-xs font-semibold md:text-sm", className)} style={nepaliTextStyle(12)}>
      {children}
    </Text>
  );
}

function QuadValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View
      className={cn(
        "min-w-0 flex flex-row flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm leading-snug",
        className,
      )}
    >
      {children}
    </View>
  );
}

/** One table band: label|value on the left, optional label|value on the right. */
function QuadPair({
  labelKey,
  label,
  children,
  t,
  labelWidth,
  bordered,
}: {
  labelKey?: string;
  label?: string;
  children: React.ReactNode;
  t: (key: string) => string;
  labelWidth: string;
  bordered?: boolean;
}) {
  return (
    <View
      className={cn(
        "min-w-0 flex-1 flex-row items-start gap-x-2",
        bordered && "border-l border-border/70 pl-2",
      )}
    >
      <QuadLabel className={cn(labelWidth, "shrink-0")}>{rowLabel(labelKey, label, t)}</QuadLabel>
      <QuadValue className="min-w-0 flex-1">{children}</QuadValue>
    </View>
  );
}

export function PanchangaQuadRow({
  left,
  right,
  className,
}: {
  left: { labelKey?: string; label?: string; children: React.ReactNode };
  right?: { labelKey?: string; label?: string; children: React.ReactNode };
  className?: string;
}) {
  const { t } = useTranslation();
  const labelWidth = useQuadLabelWidth();

  return (
    <View
      className={cn(
        "flex-row items-start gap-x-2 border-b border-border px-3 py-1.5",
        className,
      )}
    >
      <QuadPair labelKey={left.labelKey} label={left.label} t={t} labelWidth={labelWidth}>
        {left.children}
      </QuadPair>
      {right ? (
        <QuadPair
          labelKey={right.labelKey}
          label={right.label}
          t={t}
          labelWidth={labelWidth}
          bordered
        >
          {right.children}
        </QuadPair>
      ) : (
        <View className="min-w-0 flex-1 border-l border-border/70 pl-2" />
      )}
    </View>
  );
}

/** Full-width label|value row (e.g. long lists). */
export function PanchangaFullRow({
  labelKey,
  label,
  children,
  className,
}: {
  labelKey?: string;
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  const labelWidth = useQuadLabelWidth();

  return (
    <View
      className={cn(
        "flex-row items-start gap-x-2 border-b border-border px-3 py-1.5",
        className,
      )}
    >
      <QuadLabel className={cn(labelWidth, "shrink-0")}>{rowLabel(labelKey, label, t)}</QuadLabel>
      <QuadValue className="min-w-0 flex-1">{children}</QuadValue>
    </View>
  );
}

export function PanchangaTableBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("[&>*:last-child]:border-b-0", className)}>
      {children}
    </View>
  );
}

/** @deprecated use PanchangaQuadRow */
export function PanchangaRows({
  children,
}: {
  children: React.ReactNode;
  /** @deprecated ignored — use PanchangaQuadRow */
  twoCol?: boolean;
}) {
  return <PanchangaTableBody>{children}</PanchangaTableBody>;
}

/** @deprecated use PanchangaQuadRow or PanchangaFullRow */
export function PanchangaRow({
  labelKey,
  label,
  children,
  oddBorder: _oddBorder,
  className,
}: {
  labelKey?: string;
  label?: string;
  children: React.ReactNode;
  oddBorder?: boolean;
  className?: string;
}) {
  return (
    <PanchangaFullRow labelKey={labelKey} label={label} className={className}>
      {children}
    </PanchangaFullRow>
  );
}

export function UptoValue({
  name,
  sym,
  endTime,
  badge,
  compact = true,
}: {
  name?: string;
  sym?: string;
  endTime?: string;
  badge?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  if (!name) return null;
  return (
    <View
      className={cn(
        "min-w-0 flex-row items-baseline gap-1.5",
        compact ? "justify-between gap-2" : "flex-wrap",
      )}
    >
      <Text className="min-w-0 shrink flex-row flex-wrap items-baseline gap-1">
        {sym ? <Text className="shrink-0 text-sm">{sym}</Text> : null}
        <Text className="font-semibold" style={nepaliTextStyle(14)}>
          {name}
        </Text>
        {badge ? (
          <Text className="rounded-full bg-secondary/15 px-1.5 py-0.5 text-xs font-semibold text-secondary dark:text-accent">
            {badge}
          </Text>
        ) : null}
      </Text>
      {endTime ? (
        <Text className="shrink-0 text-xs font-mono font-semibold text-foreground">
          {endTime} {t("sections.until")}
        </Text>
      ) : null}
    </View>
  );
}

export function TimingRange({
  start,
  end,
  variant = "neutral",
}: {
  start?: string;
  end?: string;
  variant?: "good" | "bad" | "neutral";
}) {
  const { t } = useTranslation();
  if (!start || !end) {
    return (
      <Text className="text-xs">
        {t("sections.dash")} {t("sections.not_available")}
      </Text>
    );
  }
  return (
    <Text
      className={cn(
        "font-mono text-xs font-semibold md:text-sm",
        variant === "good" && "text-[var(--color-success)]",
        variant === "bad" && "text-destructive",
        variant === "neutral" && "text-foreground",
      )}
    >
      {start} → {end}
    </Text>
  );
}

/** Tight name | time rows — label and time stay on one line. */
export function DenseListTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("divide-y divide-border/80 rounded-md border border-border/80", className)}>
      {children}
    </View>
  );
}

export function DenseListRow({
  label,
  time,
  note,
  highlight,
  className,
}: {
  label: React.ReactNode;
  time?: React.ReactNode;
  note?: React.ReactNode;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "px-2 py-1 text-sm leading-snug",
        highlight && "font-semibold text-success",
        className,
      )}
    >
      <View className="flex-row items-baseline justify-between gap-x-2">
        <Text className="min-w-0 flex-1">{label}</Text>
        <Text className="shrink-0 font-mono text-xs font-semibold tabular-nums text-foreground md:text-sm">
          {time ?? "—"}
        </Text>
      </View>
      {note ? (
        <Text className="mt-0.5 text-xs leading-tight text-foreground/90">{note}</Text>
      ) : null}
    </View>
  );
}

/** Section sub-heading above a dense block. */
export function PanchangaSubBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("border-b border-border px-3 py-1.5 last:border-b-0", className)}>
      <Text className="m-0 mb-1 text-xs font-semibold md:text-sm">{title}</Text>
      {children}
    </View>
  );
}

/** Four-column paired timing table (two lists aligned row-by-row). */
export function PairedTimingTable({
  leftTitle,
  rightTitle,
  rows,
}: {
  leftTitle: string;
  rightTitle: string;
  rows: Array<{
    left?: { label: React.ReactNode; time?: React.ReactNode; note?: React.ReactNode; highlight?: boolean };
    right?: { label: React.ReactNode; time?: React.ReactNode; note?: React.ReactNode };
  }>;
}) {
  return (
    <View>
      <View className="flex-row border-b border-border bg-secondary/10 px-2 py-1">
        <Text className="min-w-0 flex-1 text-xs font-semibold md:text-sm">{leftTitle}</Text>
        <Text className="min-w-0 flex-1 border-l border-border/60 pl-2 text-xs font-semibold md:text-sm">
          {rightTitle}
        </Text>
      </View>
      <View className="divide-y divide-border/80">
        {rows.map((row, i) => (
          <View key={i} className="flex-row items-start px-2 py-1">
            <PairedTimingCell
              label={row.left?.label}
              time={row.left?.time}
              note={row.left?.note}
              highlight={row.left?.highlight}
            />
            <PairedTimingCell
              label={row.right?.label}
              time={row.right?.time}
              note={row.right?.note}
              bordered
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function PairedTimingCell({
  label,
  time,
  note,
  highlight,
  bordered,
}: {
  label?: React.ReactNode;
  time?: React.ReactNode;
  note?: React.ReactNode;
  highlight?: boolean;
  bordered?: boolean;
}) {
  if (!label && !time && !note) {
    return <View className={cn("min-w-0 flex-1", bordered && "border-l border-border/60 pl-2")} />;
  }

  return (
    <View className={cn("min-w-0 flex-1", bordered && "border-l border-border/60 pl-2")}>
      <View className="flex-row items-start justify-between gap-1">
        <Text
          className={cn(
            "min-w-0 flex-1 text-sm leading-snug",
            highlight && "font-semibold text-success",
          )}
          numberOfLines={2}
        >
          {label}
        </Text>
        <Text className="shrink-0 font-mono text-xs font-semibold tabular-nums leading-snug text-foreground">
          {time}
        </Text>
      </View>
      {note ? (
        <Text className="mt-0.5 text-xs leading-tight text-foreground/90" numberOfLines={2}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}
