import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { fetchGrahaSthiti, grahaDetailKeys } from "@/lib/api";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";
import { todayAdStringInTimezone, resolveTimeZone } from "@/lib/zoned-time";

export default function GrahaSthitiScreen() {
  const { pick, digits, lang } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const tz = resolveTimeZone(undefined, location.params.timezone);
  const todayAd = todayAdStringInTimezone(new Date(), tz);
  const [date, setDate] = useState(() => new Date(`${todayAd}T12:00:00`));
  const dateAd = useMemo(() => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [date]);

  const query = useQuery({
    queryKey: grahaDetailKeys.sthiti(dateAd, "ad", location.params),
    queryFn: () => fetchGrahaSthiti(dateAd, location.params, "ad"),
  });

  return (
    <AppShell
      title={pick("ग्रह स्थिति", "Planetary positions")}
      subtitle={pick("दैनिक ग्रह तालिका", "Daily graha table")}
    >
      <LocationSelector location={location} onLocationChange={setLocation} />
      <PanchangaDateNav date={date} onDateChange={setDate} todayAd={todayAd} />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError || !query.data ? (
        <ErrorState />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View className="flex-row border-b border-border bg-muted/40 px-2 py-2">
              {[
                pick("ग्रह", "Graha"),
                pick("रेखांश", "Sign°"),
                pick("नक्षत्र", "Nakshatra"),
                pick("गति", "Speed"),
              ].map((h) => (
                <Text key={h} className="min-w-[100px] px-1 text-xs font-bold text-muted-foreground">
                  {h}
                </Text>
              ))}
            </View>
            {query.data.rows.map((row) => (
              <View key={row.graha} className="flex-row border-b border-border/60 px-2 py-2">
                <Text className="min-w-[100px] px-1 text-sm font-semibold text-foreground">
                  {row.symbol} {lang === "ne" ? row.name_ne : row.graha}
                  {row.is_retrograde ? " ↺" : ""}
                </Text>
                <Text className="min-w-[100px] px-1 text-sm text-foreground">
                  {digits(lang === "ne" ? row.rekhamsha : row.rekhamsha)}
                </Text>
                <Text className="min-w-[100px] px-1 text-sm text-foreground">
                  {lang === "ne" ? row.nakshatra_ne : row.nakshatra} · {digits(row.pada)}
                </Text>
                <Text className="min-w-[100px] px-1 text-sm text-foreground">
                  {digits(row.speed_deg_day.toFixed(2))}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      <Card className="mt-4">
        <Text className="text-xs text-muted-foreground">
          {pick("BS:", "BS:")} {digits(query.data?.date_bs ?? "")} · AD: {query.data?.date_ad}
        </Text>
      </Card>
    </AppShell>
  );
}
