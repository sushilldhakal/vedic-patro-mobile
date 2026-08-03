import { BS_MONTH_NAMES, BS_MONTHS_NE } from "./bs-calendar";

export const BS_MONTHS_SHORT = [
  "Bai", "Jes", "Ash", "Shr", "Bha", "Asw",
  "Kar", "Man", "Pou", "Mag", "Fal", "Cha",
] as const;

export const AD_MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export const AD_MONTHS_SHORT_NE = [
  "जन", "फेब", "मार्च", "अप्र", "मे", "जुन",
  "जुल", "अग", "सेप", "अक्ट", "नोभ", "डिस",
] as const;

export function bsMonthLabel(month: number, lang: string): string {
  const i = month - 1;
  return lang === "en" ? BS_MONTH_NAMES[i]! : BS_MONTHS_NE[i]!;
}
