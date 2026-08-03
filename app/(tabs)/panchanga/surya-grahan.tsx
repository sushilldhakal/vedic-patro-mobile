import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { BsYearPicker, useBsYear } from "@/components/pickers/BsYearMonthPicker";
import { SimpleEventCard, EmptyHint } from "@/components/graha/GrahaEventCards";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { fetchEclipseYear, grahaDetailKeys } from "@/lib/api";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";

function EclipseYearScreen({ kind }: { kind: "solar" | "lunar" }) {
  const { pick, digits, lang } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const { year, setYear } = useBsYear();

  const query = useQuery({
    queryKey: grahaDetailKeys.eclipse(kind, year, location.params),
    queryFn: () => fetchEclipseYear(kind, year, location.params),
  });

  const title =
    kind === "solar"
      ? pick("सूर्य ग्रहण", "Solar eclipse")
      : pick("चन्द्र ग्रहण", "Lunar eclipse");

  return (
    <AppShell title={title} subtitle={pick("वर्षवार ग्रहण सूची", "Eclipses this year")}>
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
            title={lang === "ne" ? ev.type_ne ?? ev.date_bs ?? "" : ev.type_en ?? ev.date_ad ?? ""}
            subtitle={digits(ev.date_bs ?? ev.date_ad ?? "")}
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
