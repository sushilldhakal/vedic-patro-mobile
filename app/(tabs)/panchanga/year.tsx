import { useMemo, useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { PanchangaWheel } from "@/components/panchanga/PanchangaWheel";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { fetchPanchanga, panchangaKeys } from "@/lib/api";
import { adToBS } from "@/lib/bs-calendar";
import { displayLocationLabel, usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";
import { todayAdStringInTimezone, resolveTimeZone } from "@/lib/zoned-time";

export default function PanchangaYearScreen() {
  const { pick } = useLocale();
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
  const bs = adToBS(date);

  const query = useQuery({
    queryKey: panchangaKeys.day(dateAd, "ad", location.params),
    queryFn: () => fetchPanchanga(dateAd, "ad", location.params),
  });

  return (
    <AppShell title={pick("वार्षिक पञ्चाङ्ग चक्र", "Annual panchanga wheel")} showHeader={false}>
      <PanchangaDateNav
        date={date}
        onDateChange={setDate}
        todayAd={todayAd}
        location={location}
        onLocationChange={setLocation}
        wheelData={query.data}
        adDateStr={dateAd}
      />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError || !query.data ? (
        <ErrorState />
      ) : (
        <View className="mt-2 items-center py-2">
          <PanchangaWheel
            p={query.data}
            bsYear={bs.year}
            bsMonthNe={bs.monthName}
            bsDay={bs.day}
            isToday={dateAd === todayAd}
            timezone={tz}
            locationLabel={displayLocationLabel(location)}
          />
        </View>
      )}
    </AppShell>
  );
}
