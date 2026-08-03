import { ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { BsYearPicker, useBsYear } from "@/components/pickers/BsYearMonthPicker";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { fetchYearSunTimes, sunTimesKeys } from "@/lib/api";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";

export default function SuryakrantiScreen() {
  const { pick, digits } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const { year, setYear } = useBsYear();

  const query = useQuery({
    queryKey: sunTimesKeys.year(year, "bs", location.params),
    queryFn: () => fetchYearSunTimes(year, "bs", location.params),
  });

  return (
    <AppShell
      title={pick("सूर्यक्रान्ति", "Sun times")}
      subtitle={pick("वर्षवार उदय/अस्त", "Sunrise & sunset by day")}
    >
      <LocationSelector location={location} onLocationChange={setLocation} />
      <BsYearPicker year={year} onYearChange={setYear} />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View className="flex-row bg-muted/30 px-2 py-2">
              {[pick("मिति", "Date"), pick("उदय", "Rise"), pick("अस्त", "Set")].map((h) => (
                <Text key={h} className="min-w-[88px] px-1 text-xs font-bold text-muted-foreground">
                  {h}
                </Text>
              ))}
            </View>
            {(query.data?.days ?? []).slice(0, 120).map((day) => (
              <View key={day.date_ad} className="flex-row border-b border-border/50 px-2 py-1.5">
                <Text className="min-w-[88px] px-1 text-xs text-foreground">{day.date_ad.slice(5)}</Text>
                <Text className="min-w-[88px] px-1 text-xs text-foreground">
                  {digits((day.sunrise ?? "").slice(0, 5))}
                </Text>
                <Text className="min-w-[88px] px-1 text-xs text-foreground">
                  {digits((day.sunset ?? "").slice(0, 5))}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      <Card className="mt-3">
        <Text className="text-xs text-muted-foreground">
          {pick("पहिलो १२० दिन देखाइएको छ।", "Showing first 120 days.")}
        </Text>
      </Card>
    </AppShell>
  );
}
