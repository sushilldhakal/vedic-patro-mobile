import { Platform, type TextStyle } from "react-native";

/** Line-height ratio that keeps Devanagari upper matras visible on native Text. */
export const NEPALI_LINE_HEIGHT_RATIO = 1.45;

export function nepaliLineHeight(fontSize: number): number {
  return Math.round(fontSize * NEPALI_LINE_HEIGHT_RATIO);
}

export function nepaliTextStyle(fontSize: number): TextStyle {
  return {
    lineHeight: nepaliLineHeight(fontSize),
    ...(Platform.OS === "android" ? { includeFontPadding: true } : {}),
  };
}

/** Vertical centering for react-native-svg Text (default y is baseline, which clips matras). */
export const nepaliSvgTextCenter = {
  alignmentBaseline: "central" as const,
};
