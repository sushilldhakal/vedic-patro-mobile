import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { PanchangaDetailCard } from "@/components/PanchangaDetailCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { apiKeys, fetchPanchanga, fetchTodayPanchanga } from "@/lib/api";
import { adToBS, todayAdString } from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";

export default function PanchangaScreen() {
  const { pick } = useLocale();
  const params = useLocalSearchParams<{ date?: string }>();
  const today = todayAdString();
  const bs = adToBS(new Date());
  const [mode, setMode] = useState<"today" | "custom">("today");
  const [bsDate, setBsDate] = useState(`${bs.year}-${bs.month}-${bs.day}`);

  useEffect(() => {
    if (params.date) {
      setMode("custom");
      const d = new Date(`${params.date}T12:00:00`);
      const picked = adToBS(d);
      setBsDate(`${picked.year}-${picked.month}-${picked.day}`);
    }
  }, [params.date]);

  const todayQuery = useQuery({
    queryKey: apiKeys.today(),
    queryFn: () => fetchTodayPanchanga(),
    enabled: mode === "today",
  });

  const customQuery = useQuery({
    queryKey: apiKeys.panchanga(bsDate, "bs"),
    queryFn: () => fetchPanchanga(bsDate, "bs"),
    enabled: mode === "custom" && !!bsDate,
  });

  const active = mode === "today" ? todayQuery : customQuery;

  return (
    <AppShell
      title={pick("पञ्चाङ्ग", "Panchanga")}
      subtitle={pick("आजको वैदिक विवरण", "Today's vedic details")}
    >
      <Card className="mb-4 gap-3">
        <View className="flex-row gap-2">
          <Button
            label={pick("आज", "Today")}
            variant={mode === "today" ? "default" : "outline"}
            className="flex-1"
            onPress={() => setMode("today")}
          />
          <Button
            label={pick("मिति छान्नुहोस्", "Pick date")}
            variant={mode === "custom" ? "default" : "outline"}
            className="flex-1"
            onPress={() => setMode("custom")}
          />
        </View>
        {mode === "custom" ? (
          <TextInput
            value={bsDate}
            onChangeText={setBsDate}
            placeholder="2082-10-15"
            className="rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-base text-foreground"
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : (
          <Button
            label={`${pick("पुनः लोड", "Reload")} (${today})`}
            variant="ghost"
            onPress={() => todayQuery.refetch()}
          />
        )}
      </Card>

      {active.isLoading ? (
        <LoadingState />
      ) : active.isError ? (
        <ErrorState />
      ) : active.data ? (
        <PanchangaDetailCard data={active.data} />
      ) : null}
    </AppShell>
  );
}
