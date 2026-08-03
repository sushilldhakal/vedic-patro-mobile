import { useQuery } from "@tanstack/react-query";
import { Text } from "react-native";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { BsYearPicker, useBsYear } from "@/components/pickers/BsYearMonthPicker";
import { EmptyHint } from "@/components/graha/GrahaEventCards";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { fetchPanchakYear, panchakKeys } from "@/lib/api";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";

export default function PanchakPatroScreen() {
  const { pick, digits } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const { year, setYear } = useBsYear();

  const query = useQuery({
    queryKey: panchakKeys.year(year, location.params),
    queryFn: () => fetchPanchakYear(year, location.params),
  });

  return (
    <AppShell title={pick("पञ्चक पात्रो", "Panchak calendar")} subtitle={pick("वर्षवार पञ्चक", "Panchak periods")}>
      <LocationSelector location={location} onLocationChange={setLocation} />
      <BsYearPicker year={year} onYearChange={setYear} />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState />
      ) : !query.data?.periods?.length ? (
        <EmptyHint ne="यो वर्षमा पञ्चक छैन" en="No panchak this year" />
      ) : (
        query.data.periods.map((p, i) => (
          <Card key={i} className="mb-2 gap-1 p-3">
            <Text className="text-sm font-semibold text-foreground">
              {digits(p.start.date_ad ?? "")} → {digits(p.end.date_ad ?? "")}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {pick(p.duration_ne ?? "", p.duration_en ?? "")}
            </Text>
          </Card>
        ))
      )}
    </AppShell>
  );
}
