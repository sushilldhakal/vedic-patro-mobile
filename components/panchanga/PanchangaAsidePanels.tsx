import { View } from "react-native";
import type { LocationParams, PanchangaDay } from "@/lib/api";
import { GhatiClock } from "@/components/panchanga/GhatiClock";
import { MuhurtaNowPanel } from "@/components/panchanga/MuhurtaNowPanel";
import { PlanetEventsPanel } from "@/components/panchanga/PlanetEventsPanel";

type Props = {
  sunrise?: string;
  sunset?: string;
  timezone: string;
  ephemeris: boolean;
  data?: PanchangaDay;
  clock: string;
  chartAd: string;
  location: LocationParams;
};

export function PanchangaAsidePanels({
  sunrise,
  sunset,
  timezone,
  ephemeris,
  data,
  clock,
  chartAd,
  location,
}: Props) {
  return (
    <View className="gap-4">
      <GhatiClock sunrise={sunrise} sunset={sunset} timezone={timezone} />
      {ephemeris && data ? <MuhurtaNowPanel p={data} clock={clock} /> : null}
      <PlanetEventsPanel dateAd={chartAd} location={location} />
    </View>
  );
}
