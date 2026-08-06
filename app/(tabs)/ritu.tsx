import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "@/components/AppShell";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { PatroPageHeader } from "@/components/patro-date/PatroPageHeader";
import { LearnMoreCard } from "@/components/learn/LearnMoreCard";
import { RituSeasons } from "@/components/RituSeasons";
import { useLocale } from "@/lib/i18n";
import { displayLocationLabel, usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useThemeColors } from "@/lib/theme-context";

export default function RituScreen() {
  const { pick } = useLocale();
  const colors = useThemeColors();
  const { location, setLocation } = usePanchangaLocation();
  const locationLabel = displayLocationLabel(location);
  const subtitle = `${pick("सायन ऋतु · विषुव–अयनान्त", "Tropical seasons · equinox–solstice")}${
    locationLabel ? ` · ${locationLabel}` : ""
  }`;

  return (
    <AppShell title="" showHeader={false}>
      <View className="mb-3 flex-row flex-wrap items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <PatroPageHeader
            icon={<Ionicons name="leaf-outline" size={28} color={colors.secondary} />}
            title={pick("ऋतु", "Season")}
            subtitle={subtitle}
          />
        </View>
        <View className="shrink-0 self-start pt-1">
          <LocationSelector location={location} onLocationChange={setLocation} />
        </View>
      </View>

      <RituSeasons location={location} />

      <LearnMoreCard className="mt-7" slugs={["ritu-drift"]} />
    </AppShell>
  );
}
