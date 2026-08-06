import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { AppShell, LangToggle } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Text } from "@/components/ui/Text";
import { apiKeys, fetchAdToBs, fetchBsToAd } from "@/lib/api";
import { adToBS, todayAdString } from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useBreakpoint } from "@/lib/responsive";
import { colorWithAlpha } from "@/lib/theme";
import { useThemeColors } from "@/lib/theme-context";

const WEEKDAY_NE: Record<string, string> = {
  Sunday: "आइतबार",
  Monday: "सोमबार",
  Tuesday: "मङ्गलबार",
  Wednesday: "बुधबार",
  Thursday: "बिहिबार",
  Friday: "शुक्रबार",
  Saturday: "शनिबार",
};

type Mode = "ad-to-bs" | "bs-to-ad";

export default function ConverterScreen() {
  const { pick, digits } = useLocale();
  const colors = useThemeColors();
  const { width, isCalendarWide } = useBreakpoint();
  const today = todayAdString();
  const bs = adToBS(new Date());
  const todayBs = `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`;

  const [mode, setMode] = useState<Mode>("ad-to-bs");
  const [adInput, setAdInput] = useState(today);
  const [bsInput, setBsInput] = useState(todayBs);
  const [adDate, setAdDate] = useState(today);
  const [bsDate, setBsDate] = useState(todayBs);

  const adToBsQ = useQuery({
    queryKey: apiKeys.convertAd(adDate),
    queryFn: () => fetchAdToBs(adDate),
    enabled: mode === "ad-to-bs" && !!adDate,
    staleTime: Infinity,
  });

  const bsToAdQ = useQuery({
    queryKey: apiKeys.convertBs(bsDate),
    queryFn: () => fetchBsToAd(bsDate),
    enabled: mode === "bs-to-ad" && !!bsDate,
    staleTime: Infinity,
  });

  const submit = () => {
    if (mode === "ad-to-bs") setAdDate(adInput.trim());
    else setBsDate(bsInput.trim());
  };

  const adResult = adToBsQ.data;
  const bsResult = bsToAdQ.data;
  const isError = mode === "ad-to-bs" ? adToBsQ.isError : bsToAdQ.isError;

  // Web grid: grid-cols-2 / sm:grid-cols-3 / lg:grid-cols-4
  const cols = width >= 1024 ? 4 : width >= 640 ? 3 : 2;
  const tileWidth = `${(100 / cols - 1.5).toFixed(2)}%`;

  return (
    <AppShell
      title={pick("मिति रूपान्तर", "Date Converter")}
      showHeader={false}
    >
      {!isCalendarWide ? (
        <View className="mb-3 flex-row justify-end">
          <LangToggle />
        </View>
      ) : null}

      <View className="mb-4 w-fit flex-row self-start overflow-hidden rounded-xl border border-border">
        {(["ad-to-bs", "bs-to-ad"] as const).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={{ backgroundColor: active ? colors.secondary : "transparent" }}
              className="flex-row items-center gap-2 px-5 py-2.5 active:opacity-80"
            >
              <Text
                style={{ color: active ? "#ffffff" : colors.foreground }}
                className="text-sm font-semibold"
              >
                {m === "ad-to-bs" ? "AD" : "BS"}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={13}
                color={active ? "#ffffff" : colors.mutedForeground}
              />
              <Text
                style={{ color: active ? "#ffffff" : colors.foreground }}
                className="text-sm font-semibold"
              >
                {m === "ad-to-bs" ? "BS" : "AD"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mb-4 flex-row flex-wrap items-end gap-3">
        <View className="min-w-[176px] flex-1 gap-1">
          <Text
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            style={nepaliTextStyle(11)}
          >
            {mode === "ad-to-bs" ? pick("ईस्वी मिति", "AD date") : pick("विक्रम मिति", "BS date")}
          </Text>
          <TextInput
            value={mode === "ad-to-bs" ? adInput : bsInput}
            onChangeText={mode === "ad-to-bs" ? setAdInput : setBsInput}
            onSubmitEditing={submit}
            placeholder={mode === "ad-to-bs" ? "2026-07-22" : "2083-02-24"}
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.foreground,
              fontFamily: "FiraCode_400Regular",
            }}
            className="rounded-lg border px-3 py-2.5 text-sm"
          />
        </View>
        <Button label={pick("रूपान्तर", "Convert")} variant="secondary" onPress={submit} />
      </View>

      {isError ? (
        <View
          style={{
            backgroundColor: colorWithAlpha("#c62828", 0.1),
            borderColor: colorWithAlpha("#c62828", 0.2),
          }}
          className="mb-4 rounded-xl border p-4"
        >
          <Text style={{ color: colors.destructive, ...nepaliTextStyle(14) }} className="text-sm">
            {pick(
              "मिति रूपान्तर गर्न सकिएन। ढाँचा YYYY-MM-DD मिलाउनुहोस्।",
              "Could not convert that date. Use the YYYY-MM-DD format.",
            )}
          </Text>
        </View>
      ) : null}

      {mode === "ad-to-bs" && adResult ? (
        <View className="gap-4">
          <View className="flex-row items-center gap-3">
            <Text
              style={{ color: colors.secondary }}
              className="font-num text-2xl font-bold"
            >
              {adResult.ad_date}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.foreground} />
            <Text
              style={{ color: colors.secondary }}
              className="font-num text-2xl font-bold"
            >
              {adResult.bs_date}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            <StatCard width={tileWidth} highlight label={pick("विक्रम मिति", "BS date")} value={adResult.bs_date} />
            <StatCard width={tileWidth} label={pick("विक्रम वर्ष", "BS year")} value={digits(adResult.bs_year)} />
            <StatCard
              width={tileWidth}
              label={pick("विक्रम महिना", "BS month")}
              value={pick(adResult.bs_month_name_ne ?? "", adResult.bs_month_name ?? "")}
            />
            <StatCard width={tileWidth} label={pick("गते", "BS day")} value={digits(adResult.bs_day)} />
            <StatCard width={tileWidth} label={pick("ईस्वी मिति", "AD date")} value={adResult.ad_date} />
            <StatCard
              width={tileWidth}
              label={pick("बार", "Weekday")}
              value={pick(WEEKDAY_NE[adResult.weekday] ?? adResult.weekday, adResult.weekday)}
            />
          </View>
        </View>
      ) : null}

      {mode === "bs-to-ad" && bsResult ? (
        <View className="gap-4">
          <View className="flex-row items-center gap-3">
            <Text style={{ color: colors.secondary }} className="font-num text-2xl font-bold">
              {bsResult.bs_date}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.foreground} />
            <Text style={{ color: colors.secondary }} className="font-num text-2xl font-bold">
              {bsResult.ad_date}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            <StatCard width={tileWidth} highlight label={pick("ईस्वी मिति", "AD date")} value={bsResult.ad_date} />
            <StatCard width={tileWidth} label={pick("विक्रम मिति", "BS date")} value={bsResult.bs_date} />
            <StatCard
              width={tileWidth}
              label={pick("विक्रम महिना", "BS month")}
              value={pick(bsResult.bs_month_name_ne ?? "", bsResult.bs_month_name ?? "")}
            />
            <StatCard width={tileWidth} label={pick("गते", "BS day")} value={digits(bsResult.bs_day)} />
            <StatCard width={tileWidth} label={pick("विक्रम वर्ष", "BS year")} value={digits(bsResult.bs_year)} />
            <StatCard
              width={tileWidth}
              label={pick("बार", "Weekday")}
              value={pick(WEEKDAY_NE[bsResult.weekday] ?? bsResult.weekday, bsResult.weekday)}
            />
          </View>
        </View>
      ) : null}
    </AppShell>
  );
}
