/** Section tabs on `/kundali/:profileId` — mirrors web `KundaliSectionNav`. */

import { kundaliLabel } from "@/lib/kundali/kundali-i18n";

export const KUNDALI_SECTIONS = [
  { id: "kundali-overview", i18nKey: "nav_overview" as const },
  { id: "kundali-graha", i18nKey: "nav_graha_details" as const },
  { id: "kundali-yoga", i18nKey: "nav_yoga" as const },
  { id: "kundali-dasha", i18nKey: "nav_dasha" as const },
  { id: "kundali-shadbala", i18nKey: "nav_shadbala" as const },
  {
    id: "kundali-bhava-bala",
    i18nKey: "nav_bhava_bala" as const,
    parentId: "kundali-shadbala" as const,
  },
  {
    id: "kundali-ashtakavarga",
    i18nKey: "nav_ashtakavarga" as const,
    parentId: "kundali-shadbala" as const,
  },
  {
    id: "kundali-vimshopaka",
    i18nKey: "nav_vimshopaka" as const,
    parentId: "kundali-shadbala" as const,
  },
  { id: "kundali-shanti", i18nKey: "nav_shanti_vidhi" as const },
  { id: "kundali-report", i18nKey: "nav_analysis" as const },
] as const;

export type KundaliSectionId = (typeof KUNDALI_SECTIONS)[number]["id"];

export const DEFAULT_KUNDALI_SECTION: KundaliSectionId = "kundali-overview";

export function kundaliSectionLabel(
  section: (typeof KUNDALI_SECTIONS)[number],
  lang: "ne" | "en",
): string {
  return kundaliLabel(section.i18nKey, lang);
}

export function parseKundaliSectionFromHash(hash: string): KundaliSectionId {
  const id = hash.replace(/^#/, "");
  return KUNDALI_SECTIONS.some((s) => s.id === id) ? (id as KundaliSectionId) : DEFAULT_KUNDALI_SECTION;
}
