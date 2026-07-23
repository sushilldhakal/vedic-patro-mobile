/** Shared North-Indian kundali geometry (300×300 viewBox). */

export type Point = [number, number];

/** Gochar chart: map sidereal rashi (1–12) to North-Indian house polygon. */
export const GOCHAR_RASHI_TO_HOUSE: Record<number, number> = {
  1: 11,
  2: 12,
  3: 1,
  4: 2,
  5: 3,
  6: 4,
  7: 5,
  8: 6,
  9: 7,
  10: 8,
  11: 9,
  12: 10,
};

export const NI_HOUSE_POLYGONS: Record<number, Point[]> = {
  1: [[150, 0], [225, 75], [150, 150], [75, 75]],
  2: [[0, 0], [150, 0], [75, 75]],
  3: [[0, 0], [75, 75], [0, 150]],
  4: [[0, 150], [75, 75], [150, 150], [75, 225]],
  5: [[0, 150], [75, 225], [0, 300]],
  6: [[0, 300], [75, 225], [150, 300]],
  7: [[150, 300], [75, 225], [150, 150], [225, 225]],
  8: [[150, 300], [225, 225], [300, 300]],
  9: [[225, 225], [300, 300], [300, 150]],
  10: [[300, 150], [225, 225], [150, 150], [225, 75]],
  11: [[300, 150], [225, 75], [300, 0]],
  12: [[225, 75], [300, 0], [150, 0]],
};

export function polygonCentroid(points: Point[]): Point {
  const n = points.length;
  const sum = points.reduce<[number, number]>(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0]);
  return [sum[0] / n, sum[1] / n];
}

export function pointsToSvg(points: Point[]): string {
  return points.map((p) => p.join(",")).join(" ");
}

function polygonBounds(points: Point[]) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

export interface HouseGridLayout {
  columns: number;
  rows: number;
  fontSize: number;
  colGap: number;
  rowGap: number;
}

export function planetGridLayout(points: Point[], count: number): HouseGridLayout {
  if (count <= 0) return { columns: 0, rows: 0, fontSize: 13, colGap: 0, rowGap: 0 };

  const { width, height } = polygonBounds(points);
  const isKite = Math.abs(width - height) < 1;
  const isWide = width > height;

  const safeWidth = width * (isKite ? 0.62 : 0.55);
  const safeHeight = isKite ? 85 : isWide ? 40 : 100;

  const idealColumns = isKite ? 3 : isWide ? 3 : 2;
  const columns = Math.min(count, idealColumns);
  const rows = Math.ceil(count / columns);

  const PITCH_RATIO = 1.3;
  const fontFromWidth = safeWidth / columns / PITCH_RATIO;
  const fontFromHeight = safeHeight / rows / PITCH_RATIO;
  const fontSize = Math.max(7, Math.min(13, fontFromWidth, fontFromHeight));

  return {
    columns,
    rows,
    fontSize,
    colGap: fontSize * PITCH_RATIO,
    rowGap: fontSize * PITCH_RATIO,
  };
}
