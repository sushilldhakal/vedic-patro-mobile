import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { BsYearPicker, useBsYear } from "@/components/pickers/BsYearMonthPicker";
import { GrahaPeriodCard, EmptyHint } from "@/components/graha/GrahaEventCards";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { fetchGrahaVakriYear, grahaDetailKeys } from "@/lib/api";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";

export default function GrahaVakriScreen() {
  const { pick } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const { year, setYear } = useBsYear();

  const query = useQuery({
    queryKey: grahaDetailKeys.vakri(year, location.params),
    queryFn: () => fetchGrahaVakriYear(year, location.params),
  });

  return (
    <AppShell title={pick("ग्रह वक्री", "Retrograde")} subtitle={pick("वर्षवार वक्री अवधि", "Yearly retrograde windows")}>
      <LocationSelector location={location} onLocationChange={setLocation} />
      <BsYearPicker year={year} onYearChange={setYear} />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState />
      ) : !query.data?.periods?.length ? (
        <EmptyHint ne="यो वर्षमा वक्री अवधि छैन" en="No retrograde periods this year" />
      ) : (
        query.data.periods.map((p) => (
          <GrahaPeriodCard key={p.graha} grahaNe={p.graha_ne} start={p.start} end={p.end} />
        ))
      )}
    </AppShell>
  );
}
