import { useState } from "react";
import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { BsMonthPicker, BsYearPicker, useBsMonth, useBsYear } from "@/components/pickers/BsYearMonthPicker";
import { computeAbhijitFromSunTimes } from "@/lib/panchanga-format";
import { apiKeys, fetchMonthCalendar } from "@/lib/api";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";
import { todayAdStringInTimezone, resolveTimeZone } from "@/lib/zoned-time";

export default function AbhijitMuhurtaScreen() {
  const { pick, digits } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const { year, setYear } = useBsYear();
  const { month, setMonth } = useBsMonth();
  const tz = resolveTimeZone(undefined, location.params.timezone);
  const todayAd = todayAdStringInTimezone(new Date(), tz);

  const query = useQuery({
    queryKey: apiKeys.month(year, month, location.params),
    queryFn: () => fetchMonthCalendar(year, month, location.params),
  });

  const rows =
    query.data?.calendar
      .map((day) => {
        const ab = computeAbhijitFromSunTimes(day.sunrise, day.sunset);
        if (!ab) return null;
        return { day, ab };
      })
      .filter(Boolean) ?? [];

  return (
    <AppShell
      title={pick("अभिजित् मुहूर्त", "Abhijit muhurta")}
      subtitle={pick("महिनावार अभिजित् समय", "Abhijit window each day")}
    >
      <BsYearPicker year={year} onYearChange={setYear} />
      <BsMonthPicker month={month} onMonthChange={setMonth} />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState />
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {rows.map((row) => {
            if (!row) return null;
            const isToday = row.day.date_ad === todayAd;
            return (
              <Card
                key={row.day.date_ad}
                className={`min-w-[46%] flex-1 p-2 ${isToday ? "border-secondary bg-secondary/10" : ""}`}
              >
                <Text className="text-sm font-semibold text-foreground">
                  {digits(row.day.day)} · {row.day.weekday_ne ?? row.day.weekday}
                </Text>
                <Text className="text-xs text-muted-foreground">{digits(row.ab.rangeDisplay)}</Text>
              </Card>
            );
          })}
        </View>
      )}
    </AppShell>
  );
}
