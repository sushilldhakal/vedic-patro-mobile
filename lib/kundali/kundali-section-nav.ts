/** Section tabs on `/kundali/:profileId` — mirrors web `KundaliSectionNav`. */

import type { DashaSystem } from "@/lib/api";
import { kundaliLabel } from "@/lib/kundali/kundali-i18n";

export const KUNDALI_SECTIONS = [
  { id: "kundali-overview", i18nKey: "nav_overview" as const },
  { id: "kundali-graha", i18nKey: "nav_graha_details" as const },
  { id: "kundali-yoga", i18nKey: "nav_yoga" as const },
  /* Each dasha system is its own entry — jump straight to त्रिभागी or योगिनी
     without first opening दशा and then its internal tab. Vimshottari doubles
     as the group's anchor, same as kundali-shadbala below does for बल. */
  { id: "kundali-dasha-vimshottari", i18nKey: "nav_dasha" as const },
  {
    id: "kundali-dasha-tribhagi",
    i18nKey: "dasha_tribhagi" as const,
    parentId: "kundali-dasha-vimshottari" as const,
  },
  {
    id: "kundali-dasha-yogini",
    i18nKey: "dasha_yogini" as const,
    parentId: "kundali-dasha-vimshottari" as const,
  },
  {
    id: "kundali-shanti",
    i18nKey: "nav_shanti_vidhi" as const,
    parentId: "kundali-dasha-vimshottari" as const,
  },
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
  { id: "kundali-report", i18nKey: "nav_analysis" as const },
] as const;

export type KundaliSectionId = (typeof KUNDALI_SECTIONS)[number]["id"];

export const DEFAULT_KUNDALI_SECTION: KundaliSectionId = "kundali-overview";

/** Which dasha system a section id names, or `null` when it isn't a dasha section. */
export function dashaSystemFromSection(id: KundaliSectionId): DashaSystem | null {
  if (id === "kundali-dasha-vimshottari") return "vimshottari";
  if (id === "kundali-dasha-tribhagi") return "tribhagi";
  if (id === "kundali-dasha-yogini") return "yogini";
  return null;
}

/** The nav section id for a dasha system, for `onActiveChange` → `onNavigate`. */
export function dashaSectionId(system: DashaSystem): KundaliSectionId {
  if (system === "tribhagi") return "kundali-dasha-tribhagi";
  if (system === "yogini") return "kundali-dasha-yogini";
  return "kundali-dasha-vimshottari";
}

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
