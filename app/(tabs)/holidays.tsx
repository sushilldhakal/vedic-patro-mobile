import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AppShell, LangToggle } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { apiKeys, fetchHolidays, type Holiday } from "@/lib/api";
import { getCurrentBs } from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { useState } from "react";
import { useBreakpoint } from "@/lib/responsive";

export default function HolidaysScreen() {
  const { pick, digits, lang } = useLocale();
  const { isTablet } = useBreakpoint();
  const initial = getCurrentBs();
  const [year, setYear] = useState(initial.year);

  const query = useQuery({
    queryKey: apiKeys.holidays(year),
    queryFn: () => fetchHolidays(year),
  });

  const grouped = groupByMonth(query.data?.holidays ?? [], lang);

  return (
    <AppShell
      title={pick("बिदा तथा पर्व", "Holidays & Festivals")}
      subtitle={pick("नेपाली सार्वजनिक बिदा", "Nepal public holidays")}
      headerRight={<LangToggle />}
    >
      <Card className="mb-4 flex-row items-center justify-between">
        <Button label="‹" variant="outline" size="sm" onPress={() => setYear((y) => y - 1)} />
        <Text className="text-lg font-bold text-foreground">{digits(year)} BS</Text>
        <Button label="›" variant="outline" size="sm" onPress={() => setYear((y) => y + 1)} />
      </Card>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState />
      ) : (
        <View className={isTablet ? "flex-row flex-wrap gap-3" : "gap-3"}>
          {Object.entries(grouped).map(([month, items]) => (
            <Card key={month} className={isTablet ? "min-w-[45%] flex-1" : ""}>
              <Text className="mb-2 text-base font-semibold text-primary">{month}</Text>
              {items.map((h, i) => (
                <View
                  key={`${h.date_ad}-${i}`}
                  className="mb-2 flex-row items-start justify-between gap-2 border-b border-border/50 pb-2"
                >
                  <Text className="flex-1 text-sm text-foreground">
                    {lang === "ne" ? h.name_ne || h.name : h.name || h.name_ne}
                  </Text>
                  <View className="items-end">
                    <Text className="text-xs text-muted-foreground">{h.date_ad}</Text>
                    {h.is_public_holiday ? (
                      <Text className="text-[10px] font-semibold text-vermilion">
                        {pick("बिदा", "Holiday")}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </Card>
          ))}
        </View>
      )}
    </AppShell>
  );
}

function groupByMonth(holidays: Holiday[], lang: "ne" | "en") {
  const out: Record<string, Holiday[]> = {};
  for (const h of holidays) {
    const key = h.date_bs?.slice(5, 7) ?? h.date_ad?.slice(5, 7) ?? "?";
    const label = lang === "ne" ? `महिना ${key}` : `Month ${key}`;
    out[label] = out[label] ?? [];
    out[label].push(h);
  }
  return out;
}
