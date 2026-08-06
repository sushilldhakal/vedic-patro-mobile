import { Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { PatroYearNavBlock } from "@/components/patro-date/PatroYearNavBlock";
import { fetchTropicalSeasons, seasonsKeys } from "@/lib/api";
import { getCurrentBs } from "@/lib/bs-calendar";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { usePatroYearBrowse } from "@/lib/use-patro-year-browse";
import { useLocale } from "@/lib/i18n";

export default function RituScreen() {
  const { pick, lang } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const { era, setEra, year, setYear } = usePatroYearBrowse();

  const query = useQuery({
    queryKey: seasonsKeys.tropical(location.params),
    queryFn: () => fetchTropicalSeasons(location.params),
  });

  return (
    <AppShell title={pick("ऋतु", "Seasons")} showHeader={false}>
      <PatroYearNavBlock
        era={era}
        onEraChange={setEra}
        year={year}
        onYearChange={setYear}
        location={location}
        onLocationChange={setLocation}
        onToday={() => setYear(getCurrentBs().year)}
      />
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
