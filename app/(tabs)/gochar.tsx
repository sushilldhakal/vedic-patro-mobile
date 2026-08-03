import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { fetchGochar, gocharKeys } from "@/lib/api";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";
import { todayAdStringInTimezone, resolveTimeZone } from "@/lib/zoned-time";

export default function GocharScreen() {
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
    queryKey: gocharKeys.day(dateAd, "ad", location.params),
    queryFn: () => fetchGochar(dateAd, "ad", location.params),
  });

  const grahas = query.data?.gochar ? Object.entries(query.data.gochar) : [];

  return (
    <AppShell
      title={pick("गोचर", "Gochar")}
      subtitle={pick("ग्रह गोचर स्थिति", "Planetary transit positions")}
    >
      <LocationSelector location={location} onLocationChange={setLocation} />
      <PanchangaDateNav date={date} onDateChange={setDate} todayAd={todayAd} />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState />
      ) : (
        <View className="gap-2">
          {grahas.map(([key, g]) => (
            <Card key={key} className="gap-1 p-3">
              <Text className="text-base font-semibold text-foreground">
                {g.symbol} {lang === "ne" ? g.name_ne : key}
                {g.is_retrograde ? " ↺" : ""}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {lang === "ne" ? g.rashi_ne : g.rashi} · {digits(g.dms_in_rashi ?? g.deg_in_rashi ?? "")}
              </Text>
              {g.next_rashi_entry?.entry_time_local_short ? (
                <Text className="text-xs text-secondary">
                  {pick("अर्को राशि:", "Next sign:")}{" "}
                  {digits(g.next_rashi_entry.entry_time_local_short)}
                </Text>
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </AppShell>
  );
}
