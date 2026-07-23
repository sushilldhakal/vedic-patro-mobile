import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "@/lib/i18n-translations.web";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { BREAKPOINTS, useBreakpoint } from "@/lib/responsive";

/** Use 2-column section rows when the card/page has room (matches web sm: / md: paired layouts). */
export function usePanchangaLayoutWide(): boolean {
  const { width } = useBreakpoint();
  return width >= BREAKPOINTS.sm;
}

export function SectionSplitPanel({ left, right }: { left: ReactNode; right: ReactNode }) {
  const wide = usePanchangaLayoutWide();
  if (wide) {
    return (
      <View className="flex-row">
        <View className="min-w-0 flex-1 border-r border-border px-4 py-3">{left}</View>
        <View className="min-w-0 flex-1 px-4 py-2.5">{right}</View>
      </View>
    );
  }
  return (
    <View>
      <View className="border-b border-border px-4 py-3">{left}</View>
      <View className="px-4 py-3">{right}</View>
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
      <View className="flex items-baseline gap-2.5 px-4 py-2.5 border-b border-border bg-secondary/[0.09] dark:bg-secondary/20">
        <Text className="text-sm font-bold m-0">{title}</Text>
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
    <Text
      className={cn(
        "text-sm font-semibold leading-snug pt-0.5",
        className,
      )}
    >
      {children}
    </Text>
  );
}

function QuadValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View
      className={cn(
        "text-sm text-base leading-snug flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0",
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
  stackTopBorder,
}: {
  labelKey?: string;
  label?: string;
  children: React.ReactNode;
  t: (key: string) => string;
  stackTopBorder?: boolean;
}) {
  return (
    <View
      className={cn(
        "min-w-0 flex-1 flex-row items-start gap-x-3 gap-y-1.5",
        stackTopBorder && "mt-1.5 border-t border-dashed border-border pt-2",
      )}
    >
      <QuadLabel className="w-[4.75rem] shrink-0">{rowLabel(labelKey, label, t)}</QuadLabel>
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
  const wide = usePanchangaLayoutWide();

  if (wide && right) {
    return (
      <View
        className={cn(
          "flex-row items-start gap-x-3 gap-y-1.5 border-b border-border px-4 py-2",
          className,
        )}
      >
        <QuadPair labelKey={left.labelKey} label={left.label} t={t}>
          {left.children}
        </QuadPair>
        <QuadPair labelKey={right.labelKey} label={right.label} t={t}>
          {right.children}
        </QuadPair>
      </View>
    );
  }

  return (
    <View className={cn("gap-y-1.5 border-b border-border px-4 py-2", className)}>
      <QuadPair labelKey={left.labelKey} label={left.label} t={t}>
        {left.children}
      </QuadPair>
      {right ? (
        <QuadPair labelKey={right.labelKey} label={right.label} t={t} stackTopBorder>
          {right.children}
        </QuadPair>
      ) : null}
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

  return (
    <View
      className={cn(
        "flex-row items-start gap-x-3 gap-y-1 border-b border-border px-4 py-2",
        className,
      )}
    >
      <QuadLabel className="w-[4.75rem] shrink-0">{rowLabel(labelKey, label, t)}</QuadLabel>
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
  compact,
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
        "flex items-baseline gap-1.5 min-w-0",
        compact ? "justify-between gap-2 w-full" : "flex-wrap",
      )}
    >
      <Text className="inline-flex items-baseline gap-1.5 min-w-0">
        {sym && <Text className="text-sm shrink-0">{sym}</Text>}
        <Text className="font-semibold">{name}</Text>
        {badge && (
          <Text className="text-sm font-semibold px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary dark:text-accent">
            {badge}
          </Text>
        )}
      </Text>
      {endTime && (
        <Text className="text-sm font-mono font-semibold text-foreground whitespace-nowrap shrink-0">
          {endTime} {t("sections.until")}
        </Text>
      )}
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
        "font-mono text-sm font-semibold",
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
        "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2 px-2.5 py-1 text-sm leading-snug",
        highlight && "font-semibold text-success",
        className,
      )}
    >
      <Text className="min-w-0 truncate">{label}</Text>
      <Text className="shrink-0 font-mono text-sm font-semibold text-foreground tabular-nums">
        {time ?? "—"}
      </Text>
      {note ? (
        <Text className="col-span-2 text-sm font-mono text-base text-foreground/90 -mt-0.5 pb-0.5">
          {note}
        </Text>
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
    <View className={cn("border-b border-border px-4 py-2 last:border-b-0", className)}>
      <Text className="m-0 mb-1.5 text-sm font-semibold">{title}</Text>
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
  const wide = usePanchangaLayoutWide();

  return (
    <View className="text-sm">
      {wide ? (
        <View className="flex-row border-b border-border bg-secondary/10 px-3 py-1.5">
          <Text className="min-w-0 flex-1 text-sm font-semibold">{leftTitle}</Text>
          <Text className="min-w-0 flex-1 border-l border-border/60 pl-2 text-sm font-semibold">
            {rightTitle}
          </Text>
        </View>
      ) : null}
      <View className="divide-y divide-border/80">
        {rows.map((row, i) => (
          <View
            key={i}
            className={cn(
              "gap-2 px-3 py-1.5",
              wide ? "flex-row items-start py-1" : "flex-col",
            )}
          >
            <PairedTimingCell
              wide={wide}
              title={leftTitle}
              showTitleOnMobile={!wide}
              label={row.left?.label}
              time={row.left?.time}
              note={row.left?.note}
              highlight={row.left?.highlight}
            />
            <PairedTimingCell
              wide={wide}
              title={rightTitle}
              showTitleOnMobile={!wide}
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
  wide,
  title,
  label,
  time,
  note,
  highlight,
  showTitleOnMobile,
  bordered,
}: {
  wide: boolean;
  title: string;
  label?: React.ReactNode;
  time?: React.ReactNode;
  note?: React.ReactNode;
  highlight?: boolean;
  showTitleOnMobile?: boolean;
  bordered?: boolean;
}) {
  if (!label && !time) {
    return wide ? <View className={cn("min-w-0 flex-1", bordered && "border-l border-border/60 pl-2")} /> : null;
  }

  return (
    <View
      className={cn(
        "min-w-0 flex-1",
        bordered && !wide && "border-t border-border/60 pt-2",
        bordered && wide && "border-l border-border/60 pl-2",
      )}
    >
      {showTitleOnMobile ? (
        <Text className="mb-0.5 text-sm font-semibold">{title}</Text>
      ) : null}
      <View className="flex-row items-start justify-between gap-2">
        <Text className={cn("min-w-0 flex-1 text-base leading-snug", highlight && "font-semibold text-success")}>
          {label}
        </Text>
        <View className="shrink-0 items-end">
          <Text className="font-mono text-sm font-semibold tabular-nums leading-snug text-foreground">{time}</Text>
          {note ? (
            <Text className="mt-0.5 max-w-[9.5rem] text-sm leading-tight text-foreground/90">{note}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
