import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { BsYearPicker, useBsYear } from "@/components/pickers/BsYearMonthPicker";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { fetchSaitDetail, saitDetailKey } from "@/lib/api";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";

function SaitDetailList({ category }: { category: string }) {
  const { pick, digits, lang } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const { year, setYear } = useBsYear();

  const query = useQuery({
    queryKey: saitDetailKey(year, category, location.params),
    queryFn: () => fetchSaitDetail(year, category, location.params),
  });

  const title =
    category === "vivah"
      ? pick("विवाह साइत", "Marriage muhurta")
      : pick(query.data?.category_label_ne ?? category, query.data?.category_label_ne ?? category);

  return (
    <AppShell title={title} subtitle={pick("वर्षवार शुभ दिन", "Auspicious days this year")}>
      <LocationSelector location={location} onLocationChange={setLocation} />
      <BsYearPicker year={year} onYearChange={setYear} />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState />
      ) : (
        <View className="gap-2">
          {(query.data?.days ?? []).map((d) => (
            <Card key={`${d.bs_month}-${d.bs_day}`} className="gap-1 p-3">
              <Text className="text-base font-semibold text-foreground">
                {digits(d.bs_day)} · {lang === "ne" ? d.weekday_ne : d.weekday_en}
              </Text>
              <Text className="text-sm text-muted-foreground">{d.gregorian}</Text>
              <Text className="text-sm text-foreground">
                {lang === "ne" ? d.tithi_ne : d.tithi_ne} · {lang === "ne" ? d.nakshatra_ne : d.nakshatra_ne}
              </Text>
              <Text className="text-xs text-secondary">
                {digits(d.window_start)} – {digits(d.window_end)}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </AppShell>
  );
}

export default function VivahSaitScreen() {
  return <SaitDetailList category="vivah" />;
}
