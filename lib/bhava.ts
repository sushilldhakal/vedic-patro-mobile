/** Whole-sign house (bhava) mapping, derived from the Lagna's rashi. */

export interface BhavaPlanetEntry {
  key: string;
  labelNe: string;
  isRetrograde?: boolean;
  isCombust?: boolean;
}

export interface BhavaHouse {
  house: number;
  rashi: number;
  rashiNe: string;
  isLagna: boolean;
  planets: BhavaPlanetEntry[];
}

export function houseRashi(lagnaRashi: number, house: number): number {
  return ((lagnaRashi - 1 + (house - 1)) % 12) + 1;
}

export function rashiToHouse(planetRashi: number, lagnaRashi: number): number {
  return ((planetRashi - lagnaRashi + 12) % 12) + 1;
}

export function buildBhavaChart(
  lagnaRashi: number,
  planetRashis: {
    key: string;
    labelNe: string;
    rashi: number;
    isRetrograde?: boolean;
    isCombust?: boolean;
  }[],
  rashiNeFromNumber: (rashi?: number) => string | undefined,
): BhavaHouse[] {
  const houses: BhavaHouse[] = Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const rashi = houseRashi(lagnaRashi, house);
    return {
      house,
      rashi,
      rashiNe: rashiNeFromNumber(rashi) ?? "—",
      isLagna: house === 1,
      planets: [],
    };
  });

  for (const planet of planetRashis) {
    const house = rashiToHouse(planet.rashi, lagnaRashi);
    houses[house - 1]!.planets.push({
      key: planet.key,
      labelNe: planet.labelNe,
      isRetrograde: planet.isRetrograde,
      isCombust: planet.isCombust,
    });
  }

  return houses;
}

/** Rashi gender + modality, indexed 0–11. Mirrors the web RASHI_QUALITIES. */
export const RASHI_QUALITIES: { ne: string; en: string }[] = [
  { ne: "पुं, चर", en: "Mas, Movable" },
  { ne: "स्त्री, स्थिर", en: "Fem, Fixed" },
  { ne: "पुं, द्विस्वभाव", en: "Mas, Common" },
  { ne: "स्त्री, चर", en: "Fem, Movable" },
  { ne: "पुं, स्थिर", en: "Mas, Fixed" },
  { ne: "स्त्री, द्विस्वभाव", en: "Fem, Common" },
  { ne: "पुं, चर", en: "Mas, Movable" },
  { ne: "स्त्री, स्थिर", en: "Fem, Fixed" },
  { ne: "पुं, द्विस्वभाव", en: "Mas, Common" },
  { ne: "स्त्री, चर", en: "Fem, Movable" },
  { ne: "पुं, स्थिर", en: "Mas, Fixed" },
  { ne: "स्त्री, द्विस्वभाव", en: "Fem, Common" },
];

/**
 * Graha-drishti offsets (house-distance from the aspecting planet) beyond the
 * universal 7th aspect every planet casts. Mirrors the server's SPECIAL_ASPECTS
 * table (engine/vedic/interpretation.py).
 */
const SPECIAL_ASPECT_HOUSES: Record<string, number[]> = {
  mars: [4, 7, 8],
  jupiter: [5, 7, 9],
  saturn: [3, 7, 10],
  rahu: [5, 7, 9],
  ketu: [5, 7, 9],
};

function aspectHousesFor(key: string): number[] {
  return SPECIAL_ASPECT_HOUSES[key] ?? [7];
}

export type HouseBadgeKind = "Q" | "T";

/** Kendra (Q) / trikona (T) marker for a house number. */
function houseBadge(house: number): HouseBadgeKind | undefined {
  if ([1, 4, 7, 10].includes(house)) return "Q";
  if ([1, 5, 9].includes(house)) return "T";
  return undefined;
}

export function formatHouseBadge(badge: HouseBadgeKind, lang: "en" | "ne"): string {
  if (lang === "ne") return badge === "Q" ? "के" : "त्रि";
  return badge;
}

export interface BhavaTableRow {
  house: number;
  badge?: HouseBadgeKind;
  residents: BhavaPlanetEntry[];
  owner?: string;
  rashi: number;
  rashiNe: string;
  aspectedBy: string[];
}

/**
 * Per-house table: residents, rashi owner (lord), rashi qualities and which
 * planets cast a graha-drishti onto that house — everything already derivable
 * from data the API returns for the chart.
 */
export function buildBhavaTable(
  lagnaRashi: number,
  planetRashis: { key: string; labelNe: string; rashi: number }[],
  ownedRashis: Record<string, number[]>,
  rashiNeFromNumber: (rashi?: number) => string | undefined,
): BhavaTableRow[] {
  const houses = buildBhavaChart(lagnaRashi, planetRashis, rashiNeFromNumber);

  const rashiOwner = new Map<number, string>();
  for (const [ownerKey, rashis] of Object.entries(ownedRashis)) {
    for (const rashi of rashis) rashiOwner.set(rashi, ownerKey);
  }

  const planetHouse = new Map<string, number>();
  for (const planet of planetRashis) {
    planetHouse.set(planet.key, rashiToHouse(planet.rashi, lagnaRashi));
  }

  return houses.map((h) => {
    const aspectedBy: string[] = [];
    for (const [key, fromHouse] of planetHouse) {
      const distance = ((h.house - fromHouse + 12) % 12) + 1;
      if (aspectHousesFor(key).includes(distance)) aspectedBy.push(key);
    }
    return {
      house: h.house,
      badge: houseBadge(h.house),
      residents: h.planets,
      owner: rashiOwner.get(h.rashi),
      rashi: h.rashi,
      rashiNe: h.rashiNe,
      aspectedBy,
    };
  });
}
