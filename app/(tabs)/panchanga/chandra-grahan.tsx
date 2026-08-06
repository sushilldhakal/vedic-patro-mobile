import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { PatroYearNavBlock } from "@/components/patro-date/PatroYearNavBlock";
import { SimpleEventCard, EmptyHint } from "@/components/graha/GrahaEventCards";
import { fetchEclipseYear, grahaDetailKeys } from "@/lib/api";
import { getCurrentBs } from "@/lib/bs-calendar";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { usePatroYearBrowse } from "@/lib/use-patro-year-browse";
import { useLocale } from "@/lib/i18n";

export default function ChandraGrahanScreen() {
  const { pick, digits, lang } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const { era, setEra, year, setYear } = usePatroYearBrowse();

  const query = useQuery({
    queryKey: grahaDetailKeys.eclipse("lunar", year, location.params),
    queryFn: () => fetchEclipseYear("lunar", year, location.params),
  });

  return (
    <AppShell title={pick("चन्द्र ग्रहण", "Lunar eclipse")} showHeader={false}>
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
