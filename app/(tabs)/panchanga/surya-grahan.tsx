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

function EclipseYearScreen({ kind }: { kind: "solar" | "lunar" }) {
  const { pick, digits, lang } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const { era, setEra, year, setYear } = usePatroYearBrowse();

  const query = useQuery({
    queryKey: grahaDetailKeys.eclipse(kind, year, location.params),
    queryFn: () => fetchEclipseYear(kind, year, location.params),
  });

  const title =
    kind === "solar"
      ? pick("सूर्य ग्रहण", "Solar eclipse")
      : pick("चन्द्र ग्रहण", "Lunar eclipse");

  return (
    <AppShell title={title} showHeader={false}>
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
            title={lang === "ne" ? ev.type_ne ?? ev.date_bs ?? "" : ev.type_en ?? ev.date_ad ?? ""}
            subtitle={digits(ev.date_jd_date ?? ev.date_bs ?? ev.date_ad ?? "")}
            body={
              ev.maximum_time_local_short
                ? `${pick("बढी:", "Max:")} ${digits(ev.maximum_time_local_short)}`
                : lang === "ne"
                  ? ev.visible_ne
                  : ev.visible_en
            }
          />
        ))
      )}
    </AppShell>
  );
}

export default function SuryaGrahanScreen() {
  return <EclipseYearScreen kind="solar" />;
}
