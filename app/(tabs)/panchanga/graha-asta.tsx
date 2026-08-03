import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { BsYearPicker, useBsYear } from "@/components/pickers/BsYearMonthPicker";
import { GrahaPeriodCard, EmptyHint } from "@/components/graha/GrahaEventCards";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { fetchGrahaAstaYear, grahaDetailKeys } from "@/lib/api";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";

export default function GrahaAstaScreen() {
  const { pick } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const { year, setYear } = useBsYear();

  const query = useQuery({
    queryKey: grahaDetailKeys.asta(year, location.params),
    queryFn: () => fetchGrahaAstaYear(year, location.params),
  });

  return (
    <AppShell title={pick("ग्रह अस्त", "Heliacal set")} subtitle={pick("वर्षवार अस्त/उदय", "Yearly set & rise")}>
      <LocationSelector location={location} onLocationChange={setLocation} />
      <BsYearPicker year={year} onYearChange={setYear} />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState />
      ) : !query.data?.periods?.length ? (
        <EmptyHint ne="यो वर्षमा अवधि छैन" en="No periods this year" />
      ) : (
        query.data.periods.map((p) => (
          <GrahaPeriodCard
            key={p.graha}
            grahaNe={p.graha_ne}
            start={p.start}
            end={p.end}
            extraNe={
              p.hemisphere === "east"
                ? "पूर्व (बिहान)"
                : p.hemisphere === "west"
                  ? "पश्चिम (साँझ)"
                  : undefined
            }
            extraEn={
              p.hemisphere === "east" ? "East (morning)" : p.hemisphere === "west" ? "West (evening)" : undefined
            }
          />
        ))
      )}
    </AppShell>
  );
}
