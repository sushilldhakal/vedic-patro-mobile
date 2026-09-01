/**
 * वास्तु reference data — structure only.
 *
 * Every label lives in the bilingual catalogue under `vastu.*`, same as the
 * rest of the app; what is here is the part that is not copy: where each
 * direction sits on the compass, which element it carries, and which direction
 * each room belongs to. The web app keeps an identical copy at
 * `dhakal-patro/src/lib/vastu.ts` so both platforms draw the same wheel from
 * the same numbers.
 */

export type VastuElementId = "earth" | "water" | "fire" | "air" | "space";

export type VastuDirectionId =
  | "north"
  | "northeast"
  | "east"
  | "southeast"
  | "south"
  | "southwest"
  | "west"
  | "northwest"
  | "center";

export interface VastuDirection {
  id: VastuDirectionId;
  /** Compass bearing in degrees (north = 0, clockwise). `null` for the centre. */
  bearing: number | null;
  element: VastuElementId;
  guna: VastuGunaId;
  /** Cardinal points get the wider wheel segments in the drawing. */
  cardinal: boolean;
  /** Inner-four pada: Bhūdhara / Aryamā / Vivasvān / Mitra. */
  innerDeity?: "bhudhara" | "aryama" | "vivasvan" | "mitra";
}

export type VastuGunaId = "sattva" | "rajas" | "tamas";

/** Clockwise from north — the order the wheel is drawn and listed in. */
export const VASTU_DIRECTIONS: VastuDirection[] = [
  { id: "north", bearing: 0, element: "water", guna: "sattva", cardinal: true, innerDeity: "bhudhara" },
  { id: "northeast", bearing: 45, element: "water", guna: "sattva", cardinal: false },
  { id: "east", bearing: 90, element: "air", guna: "sattva", cardinal: true, innerDeity: "aryama" },
  { id: "southeast", bearing: 135, element: "fire", guna: "rajas", cardinal: false },
  { id: "south", bearing: 180, element: "fire", guna: "tamas", cardinal: true, innerDeity: "vivasvan" },
  { id: "southwest", bearing: 225, element: "earth", guna: "tamas", cardinal: false },
  { id: "west", bearing: 270, element: "space", guna: "tamas", cardinal: true, innerDeity: "mitra" },
  { id: "northwest", bearing: 315, element: "air", guna: "rajas", cardinal: false },
  { id: "center", bearing: null, element: "space", guna: "sattva", cardinal: false },
];

export const VASTU_WHEEL_DIRECTIONS = VASTU_DIRECTIONS.filter(
  (d): d is VastuDirection & { bearing: number } => d.bearing !== null,
);

export const VASTU_CENTER: VastuDirection = VASTU_DIRECTIONS[VASTU_DIRECTIONS.length - 1]!;

export const VASTU_ELEMENT_ORDER: VastuElementId[] = ["water", "air", "fire", "earth", "space"];

export const VASTU_ELEMENT_COLOR: Record<VastuElementId, string> = {
  fire: "#E76F3C",
  water: "#3B82C4",
  air: "#48A9A6",
  earth: "#A58A45",
  space: "#6B5B95",
};

export const VASTU_GUNA_COLOR: Record<VastuGunaId, string> = {
  sattva: "#F4DFA3",
  rajas: "#D96C4F",
  tamas: "#394052",
};

export const VASTU_INK = {
  background: "#F7F4ED",
  line: "#B8B2A5",
  text: "#292722",
} as const;

export const VASTU_DIR16_ELEMENT: readonly VastuElementId[] = [
  "water",
  "water",
  "water",
  "air",
  "air",
  "fire",
  "fire",
  "fire",
  "fire",
  "earth",
  "earth",
  "space",
  "space",
  "space",
  "air",
  "space",
];

export function vastuElementAtBearing(bearing: number): VastuElementId {
  const idx = Math.round((((bearing % 360) + 360) % 360) / 22.5) % 16;
  return VASTU_DIR16_ELEMENT[idx]!;
}

export type VastuDir16Id = "nne" | "ene" | "ese" | "sse" | "ssw" | "wsw" | "wnw" | "nnw";

export type VastuZoneId = VastuDirectionId | VastuDir16Id;

export interface VastuDir16 {
  id: VastuDir16Id;
  bearing: number;
  abbr: string;
  element: VastuElementId;
  guna: VastuGunaId;
}

export const VASTU_DIR16: readonly VastuDir16[] = [
  { id: "nne", bearing: 22.5, abbr: "NNE", element: "water", guna: "sattva" },
  { id: "ene", bearing: 67.5, abbr: "ENE", element: "air", guna: "sattva" },
  { id: "ese", bearing: 112.5, abbr: "ESE", element: "fire", guna: "rajas" },
  { id: "sse", bearing: 157.5, abbr: "SSE", element: "fire", guna: "tamas" },
  { id: "ssw", bearing: 202.5, abbr: "SSW", element: "earth", guna: "tamas" },
  { id: "wsw", bearing: 247.5, abbr: "WSW", element: "space", guna: "tamas" },
  { id: "wnw", bearing: 292.5, abbr: "WNW", element: "space", guna: "rajas" },
  { id: "nnw", bearing: 337.5, abbr: "NNW", element: "space", guna: "sattva" },
];

const DIR16_BY_ID: Record<VastuDir16Id, VastuDir16> = Object.fromEntries(VASTU_DIR16.map((d) => [d.id, d])) as Record<
  VastuDir16Id,
  VastuDir16
>;

export function isDir16(id: VastuZoneId): id is VastuDir16Id {
  return id in DIR16_BY_ID;
}

export function vastuDir16(id: VastuDir16Id): VastuDir16 {
  return DIR16_BY_ID[id]!;
}

function hexChannel(hex: string, i: number): number {
  return Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
}

export function vastuElementTint(element: VastuElementId, strength = 0.28): string {
  const a = VASTU_INK.background;
  const b = VASTU_ELEMENT_COLOR[element];
  const t = Math.min(1, Math.max(0, strength));
  const ch = (i: number) => Math.round(hexChannel(a, i) + (hexChannel(b, i) - hexChannel(a, i)) * t);
  return `#${[0, 1, 2].map((i) => ch(i).toString(16).padStart(2, "0")).join("")}`;
}

export interface VastuRoom {
  id: string;
  direction: VastuDirectionId;
}

/** Ordered the way a house is usually walked through, not alphabetically. */
export const VASTU_ROOMS: VastuRoom[] = [
  { id: "main_door", direction: "east" },
  { id: "puja", direction: "northeast" },
  { id: "living", direction: "north" },
  { id: "kitchen", direction: "southeast" },
  { id: "master_bedroom", direction: "southwest" },
  { id: "study", direction: "west" },
  { id: "bathroom", direction: "northwest" },
  { id: "staircase", direction: "southwest" },
  { id: "water_tank", direction: "northeast" },
  { id: "storage", direction: "southwest" },
];

/** Common doshas, most-asked first. Copy lives at `vastu.dosha.<id>.*`. */
export const VASTU_DOSHAS: string[] = [
  "northeast_fire",
  "center_heavy",
  "southwest_light",
  "northeast_heavy",
  "head_north",
  "blocked_door",
];

export function vastuDirection(id: VastuDirectionId): VastuDirection {
  return VASTU_DIRECTIONS.find((d) => d.id === id) ?? VASTU_CENTER;
}

/** Point on the wheel for a bearing, with north at the top and east to the right. */
export function vastuWheelPoint(
  bearing: number,
  radius: number,
  cx = 0,
  cy = 0,
): { x: number; y: number } {
  const rad = ((bearing - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}
