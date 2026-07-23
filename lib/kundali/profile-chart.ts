import { bsToAD } from "@/lib/bs-calendar";
import { parseBirthDateParts } from "@/lib/birth-date";
import type { Profile } from "@/lib/auth/client";
import {
  DEFAULT_PANCHANGA_LOCATION,
  type PanchangaLocation,
} from "@/lib/use-panchanga-location";

export function parseBirthDate(p: Profile): Date | null {
  if (!p.birth_date) return null;
  const parts = parseBirthDateParts(p.birth_date);
  if (!parts) return null;
  try {
    return p.birth_era === "ad"
      ? new Date(parts.y, parts.m - 1, parts.d)
      : bsToAD(parts.y, parts.m, parts.d);
  } catch {
    return null;
  }
}

export function profileLocation(
  p: Profile,
  fallback: PanchangaLocation = DEFAULT_PANCHANGA_LOCATION,
): PanchangaLocation {
  if (p.latitude != null && p.longitude != null) {
    return {
      label: p.location_label || p.city || "जन्म स्थान",
      params: {
        lat: p.latitude,
        lon: p.longitude,
        ...(p.timezone ? { timezone: p.timezone } : {}),
      },
    };
  }
  return fallback;
}

export function profileClock(p: Profile, fallback = "12:00"): string {
  return p.birth_time && /^\d{1,2}:\d{2}/.test(p.birth_time) ? p.birth_time : fallback;
}

export function formatProfileAdDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function profileChartParams(p: Profile) {
  const adDate = parseBirthDate(p);
  if (!adDate) return null;
  return {
    adDate: formatProfileAdDate(adDate),
    clock: profileClock(p),
    location: profileLocation(p),
  };
}
