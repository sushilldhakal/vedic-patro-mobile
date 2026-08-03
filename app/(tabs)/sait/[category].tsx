import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { BsYearPicker, useBsYear } from "@/components/pickers/BsYearMonthPicker";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { CEREMONY_META } from "@/lib/panchanga-elements";
import { fetchSaitDetail, saitDetailKey } from "@/lib/api";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";

export default function SaitCategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const meta = CEREMONY_META.find((c) => c.id === category);
  const { pick, digits, lang } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const { year, setYear } = useBsYear();

  const query = useQuery({
    queryKey: saitDetailKey(year, category ?? "", location.params),
    queryFn: () => fetchSaitDetail(year, category!, location.params),
    enabled: Boolean(category),
  });

  if (!meta || !category) {
    return (
      <AppShell title={pick("साइत", "Muhurta")}>
        <ErrorState />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={pick(meta.titleNe, meta.titleEn)}
      subtitle={pick("शुभ मुहूर्त दिन", "Auspicious days")}
    >
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
