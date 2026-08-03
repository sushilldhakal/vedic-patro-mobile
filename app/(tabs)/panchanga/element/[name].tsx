import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { ELEMENT_BY_ID } from "@/lib/panchanga-elements";
import { elementKeys, fetchElementDay } from "@/lib/api";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { useLocale } from "@/lib/i18n";
import { todayAdStringInTimezone, resolveTimeZone } from "@/lib/zoned-time";
import { VedicWebView } from "@/components/content/VedicWebView";

function formatElementData(data: unknown, depth = 0): string[] {
  if (data == null) return [];
  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    return [String(data)];
  }
  if (Array.isArray(data)) {
    return data.flatMap((item, i) => [`[${i + 1}]`, ...formatElementData(item, depth + 1)]);
  }
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const lines: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      if (v != null && typeof v === "object") {
        lines.push(k);
        lines.push(...formatElementData(v, depth + 1).map((l) => `  ${l}`));
      } else if (v != null && v !== "") {
        lines.push(`${k}: ${v}`);
      }
    }
    return lines;
  }
  return [];
}

export default function ElementScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const meta = name ? ELEMENT_BY_ID[name] : undefined;
  const { pick, lang } = useLocale();
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
    queryKey: elementKeys.day(name ?? "", dateAd, location.params),
    queryFn: () => fetchElementDay(name!, dateAd, location.params),
    enabled: Boolean(name && meta),
  });

  if (!meta || !name) {
    return (
      <AppShell title={pick("तत्त्व", "Element")}>
        <ErrorState />
      </AppShell>
    );
  }

  const lines = formatElementData(query.data?.data).slice(0, 80);
  const useWeb = lines.length === 0 && !query.isLoading;

  return (
    <AppShell
      title={pick(meta.titleNe, meta.titleEn)}
      subtitle={pick(meta.blurbNe, meta.blurbEn)}
    >
      <LocationSelector location={location} onLocationChange={setLocation} />
      <PanchangaDateNav date={date} onDateChange={setDate} todayAd={todayAd} />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState />
      ) : useWeb ? (
        <VedicWebView path={`/panchanga/element/${name}?date=${dateAd}`} />
      ) : (
        <Card className="gap-1 p-3">
          {lines.map((line, i) => (
            <Text key={`${line}-${i}`} className="font-mono text-xs leading-5 text-foreground">
              {line}
            </Text>
          ))}
          {lines.length >= 80 ? (
            <Text className="mt-2 text-xs text-muted-foreground">
              {pick("थप विवरण वेबमा हेर्नुहोस्", "See web for full detail")}
            </Text>
          ) : null}
        </Card>
      )}
      {!useWeb && lang === "en" && query.data?.label_en ? (
        <Text className="mt-2 text-xs text-muted-foreground">{query.data.label_en}</Text>
      ) : null}
    </AppShell>
  );
}
