import { Platform, type TextStyle } from "react-native";
import { NOTO_DEVANAGARI_BOLD, NOTO_DEVANAGARI_REGULAR } from "@/lib/fonts";

/**
 * Line-height ratio for देवनागरी on native `Text`.
 *
 * Latin sits between a baseline and an x-height and 1.2–1.3 covers it.
 * Devanagari does not: it hangs off a शिरोरेखा with matras stacked *above* it
 * (ि े ै ो ौ ं ँ, and the chandrabindu above those) and more hanging *below*
 * (ु ू ृ, and halant conjuncts that drop a whole second storey). The used
 * extent is close to the font's full ascender-plus-descender, so a line box
 * sized by Latin instinct crops the top marks — and once something shoves the
 * glyph down to save them, it crops the bottom ones instead. Both happened.
 *
 * 1.62 clears Noto Sans Devanagari's ascender and descender together with
 * room to spare, so nothing has to be nudged and nothing lands on an edge.
 */
export const NEPALI_LINE_HEIGHT_RATIO = 1.62;

/** Slightly taller headers — matras + rounded `overflow-hidden` table shells. */
export const TABLE_HEADER_LINE_HEIGHT_RATIO = 1.72;

export function nepaliLineHeight(fontSize: number): number {
  return Math.round(fontSize * NEPALI_LINE_HEIGHT_RATIO);
}

export function tableHeaderLineHeight(fontSize: number): number {
  return Math.round(fontSize * TABLE_HEADER_LINE_HEIGHT_RATIO);
}

/**
 * The smallest देवनागरी this app will render as ordinary reading text.
 *
 * Devanagari carries its meaning above and below the headline — matras,
 * chandrabindu, the conjunct stack — and those are the first strokes to
 * disappear as the size comes down. Sizes that read perfectly well in Latin
 * (9, 10, 11 px) put those marks under a pixel of height, and the text stops
 * being readable rather than merely small. Dense sizes were being chosen all
 * over the app on Latin instincts, so the floor is applied here, at the one
 * place every Nepali string passes through, rather than site by site.
 *
 * Opt out with `{ dense: true }` — for map labels over the sky, where the
 * constraint is how many names fit around a star, not comfortable reading.
 */
export const MIN_NEPALI_FONT_SIZE = 13;

export type NepaliTextOptions = {
  /** Skip {@link MIN_NEPALI_FONT_SIZE}. Overlay labels only. */
  dense?: boolean;
};

export function nepaliTextStyle(
  requestedSize: number,
  { dense = false }: NepaliTextOptions = {},
): TextStyle {
  const fontSize = dense ? requestedSize : Math.max(MIN_NEPALI_FONT_SIZE, requestedSize);
  const lineHeight = nepaliLineHeight(fontSize);
  return {
    fontFamily: NOTO_DEVANAGARI_REGULAR,
    fontSize,
    lineHeight,
    /* Android is told to keep the font's own ascent/descent padding, which is
       what reserves the room the matras need.
     *
     * iOS used to get a `paddingTop` of 2–3 px instead. That was a workaround
     * for a line box too short to hold the upper matras — it shoved the glyph
     * down so the tops survived, at the cost of pushing the lower matras and
     * descenders into (or past) the bottom edge, which is the other half of
     * the clipping. With {@link NEPALI_LINE_HEIGHT_RATIO} tall enough to hold
     * both, iOS centres the glyph in the box on its own and the shove is not
     * only unnecessary, it is the bug. */
    ...(Platform.OS === "android" ? { includeFontPadding: true } : {}),
  };
}

/**
 * All data-table column headers should use this (via `TableHeaderLabel` in DataTable).
 * Extra top inset avoids Devanagari matras clipped by `overflow-hidden` on table shells.
 */
export function tableHeaderTextStyle(requestedSize: number): TextStyle {
  const fontSize = Math.max(MIN_NEPALI_FONT_SIZE, requestedSize);
  const lineHeight = tableHeaderLineHeight(fontSize);
  return {
    fontFamily: NOTO_DEVANAGARI_REGULAR,
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

/** Large day numbers in Nepali — Noto Sans Devanagari (matches web). */
export function nepaliDayNumberStyle(fontSize: number): TextStyle {
  return {
    ...nepaliTextStyle(fontSize),
    fontFamily: NOTO_DEVANAGARI_BOLD,
  };
}

/** Vertical centering for react-native-svg Text (default y is baseline, which clips matras). */
export const nepaliSvgTextCenter = {
  alignmentBaseline: "central" as const,
};
