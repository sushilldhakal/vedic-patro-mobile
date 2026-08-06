import { Platform, type TextStyle } from "react-native";

/** Line-height ratio that keeps Devanagari upper matras visible on native Text. */
export const NEPALI_LINE_HEIGHT_RATIO = 1.45;

/** Slightly taller headers — matras + rounded `overflow-hidden` table shells. */
export const TABLE_HEADER_LINE_HEIGHT_RATIO = 1.58;

export function nepaliLineHeight(fontSize: number): number {
  return Math.round(fontSize * NEPALI_LINE_HEIGHT_RATIO);
}

export function tableHeaderLineHeight(fontSize: number): number {
  return Math.round(fontSize * TABLE_HEADER_LINE_HEIGHT_RATIO);
}

export function nepaliTextStyle(fontSize: number): TextStyle {
  const lineHeight = nepaliLineHeight(fontSize);
  const matraPad = fontSize <= 11 ? 3 : 2;
  return {
    fontSize,
    lineHeight,
    ...(Platform.OS === "android"
      ? { includeFontPadding: true }
      : { paddingTop: matraPad }),
  };
}

/**
 * All data-table column headers should use this (via `TableHeaderLabel` in DataTable).
 * Extra top inset avoids Devanagari matras clipped by `overflow-hidden` on table shells.
 */
export function tableHeaderTextStyle(fontSize: number): TextStyle {
  const lineHeight = tableHeaderLineHeight(fontSize);
  return {
    fontSize,
    lineHeight,
    paddingTop: 5,
    paddingBottom: 2,
    ...(Platform.OS === "android"
      ? { includeFontPadding: true, textAlignVertical: "center" as const }
      : {}),
  };
}

/** Shared header cell padding — keep in sync with `TableHeaderCell`. */
export function tableHeaderCellPadding(compact?: boolean): {
  horizontal: number;
  top: number;
  bottom: number;
} {
  if (compact) return { horizontal: 6, top: 11, bottom: 9 };
  return { horizontal: 10, top: 12, bottom: 10 };
}

export function tableHeaderFontSize(compact?: boolean): number {
  return compact ? 11 : 12;
}

/** Large day numbers in Nepali — use Mukta, not Fira Code (Devanagari digits clip in mono). */
export function nepaliDayNumberStyle(fontSize: number): TextStyle {
  return {
    fontFamily: "Mukta_700Bold",
    fontSize,
    ...nepaliTextStyle(fontSize),
  };
}

/** Vertical centering for react-native-svg Text (default y is baseline, which clips matras). */
export const nepaliSvgTextCenter = {
  alignmentBaseline: "central" as const,
};
