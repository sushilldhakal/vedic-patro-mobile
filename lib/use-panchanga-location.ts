import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import type { LocationParams } from "@/lib/api";
import { NEPAL_CITIES, nepalCityEnglishLabel } from "@/lib/cities/nepal-cities";

const STORAGE_KEY = "vedicPatroLocation";

export interface PanchangaLocation {
  label: string;
  params: LocationParams;
}

export const DEFAULT_PANCHANGA_LOCATION: PanchangaLocation = {
  label: "Kathmandu, NP",
  params: { city_id: 1283240, timezone: "Asia/Kathmandu" },
};

export function resolveLocationTimezone(location: PanchangaLocation): string {
  return location.params.timezone ?? "Asia/Kathmandu";
}

function hasDevanagari(value: string): boolean {
  return /[\u0900-\u097F]/.test(value);
}

function healStoredLocation(loc: PanchangaLocation): PanchangaLocation {
  const { params } = loc;
  if (!params.city || !hasDevanagari(params.city)) return loc;

  if (params.lat != null && params.lon != null) {
    return {
      ...loc,
      params: {
        lat: params.lat,
        lon: params.lon,
        timezone: params.timezone ?? "Asia/Kathmandu",
      },
    };
  }

  const needle = params.city.trim();
  const match = NEPAL_CITIES.find(
    (c) =>
      c.name_ne === needle ||
      c.name_ne.startsWith(needle) ||
      needle.startsWith(c.name_ne.split(" ")[0]!),
  );
  if (!match) return loc;

  return {
    label: `${nepalCityEnglishLabel(match)}, NP`,
    params: {
      lat: match.lat,
      lon: match.lon,
      timezone: "Asia/Kathmandu",
    },
  };
}

async function readStoredLocation(): Promise<PanchangaLocation> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return DEFAULT_PANCHANGA_LOCATION;
    const parsed = JSON.parse(raw) as PanchangaLocation;
    if (!parsed?.label || !parsed?.params) return DEFAULT_PANCHANGA_LOCATION;
    return healStoredLocation(parsed);
  } catch {
    return DEFAULT_PANCHANGA_LOCATION;
  }
}

export function usePanchangaLocation(initial?: PanchangaLocation) {
  const [location, setLocationState] = useState<PanchangaLocation>(
    initial ?? DEFAULT_PANCHANGA_LOCATION,
  );
  const [ready, setReady] = useState(Boolean(initial));

  useEffect(() => {
    if (initial) return;
    readStoredLocation().then((stored) => {
      setLocationState(stored);
      setReady(true);
    });
  }, [initial]);

  const setLocation = useCallback((next: PanchangaLocation) => {
    setLocationState(next);
    SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  return { location, setLocation, ready };
}

export function cityToLocation(city: {
  id: number;
  ascii_name: string;
  name: string;
  country: string;
  timezone?: string;
  lat?: number;
  lon?: number;
  local?: boolean;
}): PanchangaLocation {
  const displayName = city.name || city.ascii_name;
  const label = `${displayName}, ${city.country}`;
  if (city.local && city.lat != null && city.lon != null) {
    return {
      label,
      params: {
        lat: city.lat,
        lon: city.lon,
        timezone: city.timezone ?? "Asia/Kathmandu",
      },
    };
  }
  return {
    label,
    params: {
      city_id: city.id,
      ...(city.timezone ? { timezone: city.timezone } : {}),
    },
  };
}

const GENERIC_API_LOCATION_NAMES = new Set(["custom"]);

export function displayLocationLabel(
  location: PanchangaLocation,
  apiName?: string | null,
): string {
  const name = apiName?.trim();
  if (name && !GENERIC_API_LOCATION_NAMES.has(name.toLowerCase())) {
    return name;
  }
  const parts = location.label.split(",").map((s) => s.trim());
  return parts[0] ?? location.label;
}
