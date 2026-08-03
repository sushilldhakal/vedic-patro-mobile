import { Platform, type TextStyle } from "react-native";

/** Line-height ratio that keeps Devanagari upper matras visible on native Text. */
export const NEPALI_LINE_HEIGHT_RATIO = 1.45;

export function nepaliLineHeight(fontSize: number): number {
  return Math.round(fontSize * NEPALI_LINE_HEIGHT_RATIO);
}

export function nepaliTextStyle(fontSize: number): TextStyle {
  const lineHeight = nepaliLineHeight(fontSize);
  return {
    lineHeight,
    // iOS Text clips upper matras without a little headroom; Android uses font padding.
    ...(Platform.OS === "android"
      ? { includeFontPadding: true }
      : { paddingTop: fontSize <= 11 ? 2 : 1 }),
  };
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
