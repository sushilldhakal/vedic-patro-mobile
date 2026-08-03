/** Civil ISO date helpers (YYYY-MM-DD, no time). */

export function parseCivilIso(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y ?? 0, month: m ?? 1, day: d ?? 1 };
}

export function civilIsoDayOfMonth(iso: string): number {
  return parseCivilIso(iso).day;
}

export function parseCivilIsoToDate(iso: string): Date {
  const { year, month, day } = parseCivilIso(iso);
  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00`);
}
