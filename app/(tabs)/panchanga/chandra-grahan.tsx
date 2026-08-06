import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { BsYearPicker, useBsYear } from "@/components/pickers/BsYearMonthPicker";
import { SimpleEventCard, EmptyHint } from "@/components/graha/GrahaEventCards";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { fetchEclipseYear, grahaDetailKeys } from "@/lib/api";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";

export default function ChandraGrahanScreen() {
  const { pick, digits, lang } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const { year, setYear } = useBsYear();

  const query = useQuery({
    queryKey: grahaDetailKeys.eclipse("lunar", year, location.params),
    queryFn: () => fetchEclipseYear("lunar", year, location.params),
  });

  return (
    <AppShell title={pick("चन्द्र ग्रहण", "Lunar eclipse")} subtitle={pick("वर्षवार ग्रहण", "Yearly eclipses")}>
      <LocationSelector location={location} onLocationChange={setLocation} />
      <BsYearPicker year={year} onYearChange={setYear} />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState />
      ) : !query.data?.events?.length ? (
        <EmptyHint ne="यो वर्षमा ग्रहण छैन" en="No eclipses this year" />
      ) : (
        query.data.events.map((ev, i) => (
          <SimpleEventCard
            key={`${ev.date_ad}-${i}`}
            title={lang === "ne" ? ev.type_ne ?? "" : ev.type_en ?? ""}
            subtitle={digits(ev.date_jd_date ?? ev.date_bs ?? ev.date_ad ?? "")}
            body={ev.maximum_time_local_short ? digits(ev.maximum_time_local_short) : undefined}
          />
        ))
      )}
    </AppShell>
  );
}
