/**
 * Simplified Sun–Earth–Moon orbit math (shared with web learn diagrams).
 */

export const RAD = Math.PI / 180;

export const SYNODIC_MONTH = 29.530588;
export const TROPICAL_YEAR = 365.2422;

export const SEM = {
  earthOrbitE: 0.14,
  earthOrbitA: 1,
  moonOrbitA: 0.22,
  moonOrbitE: 0.12,
} as const;

function eccentricAnomaly(Mrad: number, e: number): number {
  let E = Mrad;
  for (let i = 0; i < 10; i++) E = Mrad + e * Math.sin(E);
  return E;
}

function trueAnomalyFromE(E: number, e: number): number {
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
}

export function earthOrbitFromMeanAnomaly(meanDeg: number) {
  const M = meanDeg * RAD;
  const E = eccentricAnomaly(M, SEM.earthOrbitE);
  const nu = trueAnomalyFromE(E, SEM.earthOrbitE);
  const r = (SEM.earthOrbitA * (1 - SEM.earthOrbitE ** 2)) / (1 + SEM.earthOrbitE * Math.cos(nu));
  const nuDeg = (((nu / RAD) % 360) + 360) % 360;
  return { nuDeg, r };
}

export function moonLocalFromTrueAnomaly(nuDeg: number): [number, number] {
  const nu = nuDeg * RAD;
  const r =
    (SEM.moonOrbitA * (1 - SEM.moonOrbitE ** 2)) / (1 + SEM.moonOrbitE * Math.cos(nu));
  return [r * Math.cos(nu), r * Math.sin(nu)];
}

export function yearAngleFromDay(day: number): number {
  return (((day / TROPICAL_YEAR) * 360) % 360 + 360) % 360;
}

export function elongationFromDay(day: number): number {
  return (((day % SYNODIC_MONTH) / SYNODIC_MONTH) * 360 + 360) % 360;
}

/** Geocentric-style layout: Sun at origin; Earth on ecliptic (XZ); Moon around Earth. */
export function sunEarthMoonLayout3D(day: number) {
  const mean = yearAngleFromDay(day);
  const { nuDeg, r: earthR } = earthOrbitFromMeanAnomaly(mean);
  const earthAngle = nuDeg * RAD;
  const earth: [number, number, number] = [earthR * Math.cos(earthAngle), 0, earthR * Math.sin(earthAngle)];

  const elong = elongationFromDay(day);
  const [mlx, mlz] = moonLocalFromTrueAnomaly(elong);
  const sunDir = Math.atan2(-earth[2], -earth[0]);
  const ca = Math.cos(sunDir);
  const sa = Math.sin(sunDir);
  const moon: [number, number, number] = [
    earth[0] + mlx * ca - mlz * sa,
    0,
    earth[2] + mlx * sa + mlz * ca,
  ];

  const sun: [number, number, number] = [0, 0, 0];
  return { sun, earth, moon, elongDeg: elong, earthNuDeg: nuDeg };
}

export function tithiIndexFromElongation(elongDeg: number): number {
  return Math.floor((((elongDeg % 360) + 360) % 360) / 12) + 1;
}

const PRECESS_RATE = 50.2879 / 3600;
const LAHIRI_2000 = 23.85;

export function lahiriAyanamsha(yearCe: number): number {
  return Math.max(0, LAHIRI_2000 + (yearCe - 2000) * PRECESS_RATE);
}
