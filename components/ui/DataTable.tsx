import type { ReactNode } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { useLocale } from "@/lib/i18n";
import { nepaliLineHeight, nepaliTextStyle } from "@/lib/nepali-text";
import { useBreakpoint } from "@/lib/responsive";
import { tableHeaderBackground, tableRowBackground } from "@/lib/theme";
import { useTheme, useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export type TableColumn = { key: string; ne: string; en: string; width: number };

/** @deprecated use TableColumn */
export type Column = TableColumn;

function columnFlexStyle(
  stretch: boolean,
  width: number,
): { width: number } | { flex: number; minWidth: number } {
  if (!stretch) return { width };
  return { flex: width, minWidth: Math.round(width * 0.72) };
}

function useTableLayout(stretch?: boolean) {
  const { width: windowWidth } = useBreakpoint();
  const fill = stretch ?? windowWidth >= 640;
  return { fill };
}

/* ── Declarative column/row table (kundali, ashtakavarga, etc.) ───────── */

export function DataTable({
  columns,
  rows,
  compact = false,
  stretch,
}: {
  columns: TableColumn[];
  rows: { key: string; cells: React.ReactNode[]; highlight?: boolean }[];
  compact?: boolean;
  stretch?: boolean;
}) {
  const { pick } = useLocale();
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const { fill } = useTableLayout(stretch);
  const cellPx = compact ? 6 : 10;
  const cellPy = compact ? 5 : 8;
  const headerPy = compact ? 9 : 10;
  const headerSize = compact ? 10 : 11;
  const bodySize = compact ? 11 : 12;
  const headerLine = nepaliLineHeight(headerSize);
  const headerMaxLines = compact ? 2 : 2;
  const iosHeadroom = Platform.OS === "ios" ? 4 : 0;
  const headerMinH = headerLine * headerMaxLines + headerPy * 2 + iosHeadroom;

  const tableInner = (
    <View className={fill ? "w-full" : undefined}>
      <View
        className="flex-row border-b border-border"
        style={{
          backgroundColor: tableHeaderBackground(colors, isDark),
          minHeight: headerMinH,
          paddingTop: iosHeadroom > 0 ? 2 : 0,
        }}
      >
        {columns.map((c) => (
          <View
            key={c.key}
            style={{
              ...columnFlexStyle(fill, c.width),
              paddingHorizontal: cellPx,
              paddingVertical: headerPy,
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            <Text
              numberOfLines={headerMaxLines}
              style={nepaliTextStyle(headerSize)}
              className={`font-semibold text-muted-foreground ${compact ? "leading-snug tracking-normal" : "uppercase tracking-wide"}`}
            >
              {pick(c.ne, c.en)}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((r, i) => (
        <TableRow key={r.key} rowIndex={i} highlight={r.highlight}>
          {r.cells.map((cell, ci) => (
            <View
              key={ci}
              style={{
                ...columnFlexStyle(fill, columns[ci]?.width ?? 90),
                paddingHorizontal: cellPx,
                paddingVertical: cellPy,
                justifyContent: "center",
              }}
            >
              {typeof cell === "string" || typeof cell === "number" ? (
                <Text
                  className="text-foreground"
                  style={nepaliTextStyle(bodySize)}
                  numberOfLines={compact ? 3 : 2}
                >
                  {cell}
                </Text>
              ) : (
                cell
              )}
            </View>
          ))}
        </TableRow>
      ))}
    </View>
  );

  return (
    <TableScrollShell stretch={stretch} scroll={!fill}>
      {tableInner}
    </TableScrollShell>
  );
}

/* ── Composable primitives (custom cells, sortable headers, pressable rows) ─ */

export function TableScrollShell({
  children,
  scroll = true,
  stretch,
  bordered = true,
  rounded = true,
  className,
}: {
  children: ReactNode;
  scroll?: boolean;
  stretch?: boolean;
  bordered?: boolean;
  rounded?: boolean;
  className?: string;
}) {
  const { fill } = useTableLayout(stretch);
  const inner = <View className={fill ? "w-full" : undefined}>{children}</View>;

  return (
    <View
      className={cn(
        "w-full overflow-hidden bg-card",
        bordered && "border border-border",
        rounded && "rounded-xl",
        className,
      )}
    >
      {fill || !scroll ? inner : <ScrollView horizontal showsHorizontalScrollIndicator>{inner}</ScrollView>}
    </View>
  );
}

export function TableHeader({ children, className }: { children: ReactNode; className?: string }) {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  return (
    <View
      className={cn("flex-row border-b border-border", className)}
      style={{ backgroundColor: tableHeaderBackground(colors, isDark) }}
    >
      {children}
    </View>
  );
}

export function TableColumnsHeader({
  columns,
  compact,
  className,
}: {
  columns: readonly TableColumn[];
  compact?: boolean;
  className?: string;
}) {
  const { pick } = useLocale();
  const headerSize = compact ? 10 : 11;
  return (
    <TableHeader className={className}>
      {columns.map((c) => (
        <TableHeaderCell key={c.key} width={c.width} compact={compact}>
          <Text
            numberOfLines={compact ? 3 : 2}
            style={nepaliTextStyle(headerSize)}
            className="font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {pick(c.ne, c.en)}
          </Text>
        </TableHeaderCell>
      ))}
    </TableHeader>
  );
}

export function TableHeaderCell({
  width,
  flex,
  minWidth,
  children,
  onPress,
  disabled,
  className,
  compact,
}: {
  width?: number;
  flex?: number;
  minWidth?: number;
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}) {
  const px = compact ? 6 : 10;
  const py = compact ? 8 : 10;
  const layout =
    width != null
      ? { width }
      : flex != null
        ? { flex, minWidth: minWidth ?? 0 }
        : minWidth != null
          ? { minWidth }
          : undefined;

  if (onPress) {
    return (
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={[layout, { paddingHorizontal: px, paddingVertical: py }]}
        className={cn("flex-row items-center gap-1 active:opacity-70", className)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[layout, { paddingHorizontal: px, paddingVertical: py, justifyContent: "center" }]}
      className={className}
    >
      {children}
    </View>
  );
}

export function TableRow({
  rowIndex,
  highlight,
  onPress,
  children,
  className,
  borderTop = true,
}: {
  rowIndex: number;
  highlight?: boolean;
  onPress?: () => void;
  children: ReactNode;
  className?: string;
  /** @default true — first body row still uses border-t to separate from header */
  borderTop?: boolean;
}) {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const style = { backgroundColor: tableRowBackground(colors, isDark, rowIndex, highlight) };
  const rowClass = cn("flex-row", borderTop && "border-t border-border", className);

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={style} className={cn(rowClass, "active:opacity-80")}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={style} className={rowClass}>
      {children}
    </View>
  );
}

export function TableCell({
  width,
  flex,
  minWidth,
  children,
  className,
  compact,
  align = "left",
}: {
  width?: number;
  flex?: number;
  minWidth?: number;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  align?: "left" | "center" | "right";
}) {
  const px = compact ? 6 : 10;
  const py = compact ? 5 : 8;
  const layout =
    width != null
      ? { width }
      : flex != null
        ? { flex, minWidth: minWidth ?? 0 }
        : minWidth != null
          ? { minWidth }
          : undefined;

  const alignClass =
    align === "center" ? "items-center" : align === "right" ? "items-end" : "items-start";

  return (
    <View
      style={[layout, { paddingHorizontal: px, paddingVertical: py }]}
      className={cn("justify-center", alignClass, className)}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text className="text-sm text-foreground" style={nepaliTextStyle(13)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
