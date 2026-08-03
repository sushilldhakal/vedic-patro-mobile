import { Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { fetchTropicalSeasons, seasonsKeys } from "@/lib/api";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";

export default function RituScreen() {
  const { pick, lang } = useLocale();
  const { location, setLocation } = usePanchangaLocation();

  const query = useQuery({
    queryKey: seasonsKeys.tropical(location.params),
    queryFn: () => fetchTropicalSeasons(location.params),
  });

  return (
    <AppShell title={pick("ऋतु", "Seasons")} subtitle={pick("सायन ऋतु तालिका", "Tropical season segments")}>
      <LocationSelector location={location} onLocationChange={setLocation} />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState />
      ) : (
        (query.data?.segments ?? []).map((seg, i) => (
          <Card key={i} className="mb-2 p-3">
            <Text className="text-base font-semibold text-foreground">
              {lang === "ne" ? seg.name_ne : seg.name_en}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {seg.start_ad} — {seg.end_ad}
            </Text>
          </Card>
        ))
      )}
    </AppShell>
  );
}
