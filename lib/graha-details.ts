export type GrahaKey =
  | "sun"
  | "moon"
  | "mars"
  | "mercury"
  | "jupiter"
  | "venus"
  | "saturn"
  | "rahu"
  | "ketu";

export const GRAHA_DETAIL_ORDER: GrahaKey[] = [
  "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu",
];

export const GRAHA_NAME: Record<GrahaKey, { ne: string; en: string }> = {
  sun: { ne: "सूर्य", en: "Sun" },
  moon: { ne: "चन्द्र", en: "Moon" },
  mars: { ne: "मंगल", en: "Mars" },
  mercury: { ne: "बुध", en: "Mercury" },
  jupiter: { ne: "बृहस्पति", en: "Jupiter" },
  venus: { ne: "शुक्र", en: "Venus" },
  saturn: { ne: "शनि", en: "Saturn" },
  rahu: { ne: "राहु", en: "Rahu" },
  ketu: { ne: "केतु", en: "Ketu" },
};

export const RASHI_EN_NAMES = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
] as const;
