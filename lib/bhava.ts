/** Whole-sign house (bhava) mapping, derived from the Lagna's rashi. */

export interface BhavaPlanetEntry {
  key: string;
  labelNe: string;
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
  planetRashis: { key: string; labelNe: string; rashi: number }[],
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
    houses[house - 1]!.planets.push({ key: planet.key, labelNe: planet.labelNe });
  }

  return houses;
}
