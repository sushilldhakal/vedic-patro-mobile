import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AppShell, LangToggle } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { apiKeys, fetchAdToBs, fetchBsToAd } from "@/lib/api";
import { adToBS, todayAdString } from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/responsive";

export default function ConverterScreen() {
  const { pick, digits } = useLocale();
  const { isTablet } = useBreakpoint();
  const today = todayAdString();
  const bs = adToBS(new Date());
  const [adDate, setAdDate] = useState(today);
  const [bsDate, setBsDate] = useState(`${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`);

  const adQuery = useQuery({
    queryKey: apiKeys.convertAd(adDate),
    queryFn: () => fetchAdToBs(adDate),
    enabled: !!adDate,
  });

  const bsQuery = useQuery({
    queryKey: apiKeys.convertBs(bsDate),
    queryFn: () => fetchBsToAd(bsDate),
    enabled: !!bsDate,
  });

  return (
    <AppShell
      title={pick("मिति रूपान्तर", "Date Converter")}
      subtitle={pick("AD ↔ BS", "AD ↔ BS")}
      headerRight={<LangToggle />}
    >
      <View className={isTablet ? "flex-row gap-4" : "gap-4"}>
        <Card className={isTablet ? "flex-1" : ""}>
          <Text className="mb-2 text-base font-semibold text-foreground">
            {pick("ईस्वी → विक्रम", "AD → BS")}
          </Text>
          <TextInput
            value={adDate}
            onChangeText={setAdDate}
            placeholder="2026-07-22"
            className="mb-3 rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-base"
          />
          <Button label={pick("रूपान्तर", "Convert")} onPress={() => adQuery.refetch()} />
          <View className="mt-4 rounded-lg bg-muted p-3">
            {adQuery.isLoading ? (
              <LoadingState />
            ) : adQuery.isError ? (
              <ErrorState />
            ) : adQuery.data ? (
              <Text className="text-base text-foreground">
                {pick(
                  `${digits(adQuery.data.bs_day)} ${adQuery.data.bs_month_name_ne ?? ""} ${digits(adQuery.data.bs_year)}`,
                  `${adQuery.data.bs_day} ${adQuery.data.bs_month_name ?? ""} ${adQuery.data.bs_year}`,
                )}
              </Text>
            ) : null}
          </View>
        </Card>

        <Card className={isTablet ? "flex-1" : ""}>
          <Text className="mb-2 text-base font-semibold text-foreground">
            {pick("विक्रम → ईस्वी", "BS → AD")}
          </Text>
          <TextInput
            value={bsDate}
            onChangeText={setBsDate}
            placeholder="2082-04-07"
            className="mb-3 rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-base"
          />
          <Button label={pick("रूपान्तर", "Convert")} onPress={() => bsQuery.refetch()} />
          <View className="mt-4 rounded-lg bg-muted p-3">
            {bsQuery.isLoading ? (
              <LoadingState />
            ) : bsQuery.isError ? (
              <ErrorState />
            ) : bsQuery.data ? (
              <Text className="text-base text-foreground">{bsQuery.data.ad_date}</Text>
            ) : null}
          </View>
        </Card>
      </View>
    </AppShell>
  );
}
