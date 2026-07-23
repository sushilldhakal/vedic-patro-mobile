import { ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"
import type { LagnaMatrixRow } from "@/lib/dainikKranti/month-patro-tables";
import { RASHI_COLUMNS_EN, RASHI_COLUMNS_NE } from "@/lib/dainikKranti/month-patro-tables";
import { rashiSymFromNumber } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { patroStickyHeadCell, patroStickyHeadRow } from "@/lib/patro-classes";
import { PatroTableShell } from "./PatroTableShell";

type Props = {
  rows: LagnaMatrixRow[];
  todayKey?: string;
  loading?: boolean;
  empty?: boolean;
  embedded?: boolean;
};

const th = "px-2 py-2.5 text-sm font-semibold";
const td = "px-2 py-2 text-center font-num text-sm tabular-nums";

export function MonthLagnaMatrix({ rows, todayKey, loading, empty, embedded }: Props) {
  const { pick, digits } = useLocale();

  const table = (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View className="min-w-full">
        <View className={cn("flex-row border-b border-border", patroStickyHeadRow)}>
          <View className={cn(th, "min-w-[3rem] pl-3")}>
            <Text className="text-sm font-semibold text-foreground">{pick("गते", "Date")}</Text>
          </View>
          <View className={cn(th, patroStickyHeadCell, "min-w-[3.5rem]")}>
            <Text className="text-sm font-semibold text-foreground">{pick("बा.", "Day")}</Text>
          </View>
          <View className={cn(th, patroStickyHeadCell, "min-w-[3.5rem]")}>
            <Text className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {pick("सु.उ.", "Rise")}
            </Text>
          </View>
          {RASHI_COLUMNS_NE.map((rne, i) => (
            <View key={rne} className={cn(th, patroStickyHeadCell, "min-w-[3.75rem] items-center")}>
              {rashiSymFromNumber(i + 1) ? (
                <Text className="text-secondary">{rashiSymFromNumber(i + 1)}</Text>
              ) : null}
              <Text className="text-center text-sm font-semibold text-foreground">
                {pick(rne, RASHI_COLUMNS_EN[i])}
              </Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View className="py-8">
            <Text className="text-center text-sm text-muted-foreground">
              {pick("लोड हुँदैछ…", "Loading…")}
            </Text>
          </View>
        ) : empty || rows.length === 0 ? (
          <View className="py-8">
            <Text className="text-center text-sm text-muted-foreground">
              {pick("यो पक्षमा कुनै दिन भेटिएन।", "No days found in this paksha.")}
            </Text>
          </View>
        ) : (
          rows.map((row) => {
            const isToday = row.dateAd === todayKey;
            return (
              <View
                key={row.dateAd}
                className={cn(
                  "flex-row border-b border-border/60",
                  isToday && "bg-secondary/15",
                )}
              >
                <View className={cn(td, "min-w-[3rem] pl-3 text-left font-semibold")}>
                  <Text className="font-num font-semibold">{digits(row.day)}</Text>
                </View>
                <View className={cn(td, "min-w-[3.5rem] text-left")}>
                  <Text>{pick(row.weekdayNe ?? "—", row.weekdayEn ?? row.weekdayNe ?? "—")}</Text>
                </View>
                <View className={cn(td, "min-w-[3.5rem] text-amber-600 dark:text-amber-400")}>
                  <Text>{row.sunrise ? digits(row.sunrise) : "—"}</Text>
                </View>
                {RASHI_COLUMNS_NE.map((_, i) => {
                  const num = i + 1;
                  const val = row.times[num];
                  const late =
                    val?.includes("२५") || val?.includes("२६") || val?.includes("२७");
                  return (
                    <View key={num} className={cn(td, "min-w-[3.75rem]")}>
                      <Text
                        className={cn(
                          late ? "text-amber-700 dark:text-amber-300" : "text-foreground",
                        )}
                      >
                        {val ?? "—"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );

  if (embedded) return table;

  return (
    <PatroTableShell
      titleNe="दैनिक लग्न आरम्भ समयतालिका"
      titleEn="Daily Lagna (Ascendant) Start Time Table"
      subtitle="प्रत्येक गते सूर्योदयदेखि अर्को सूर्योदयसम्म कुन राशि कहिले लग्नमा आउँछ — समय सूर्योदयभन्दा अगाडि भए २४ घण्टा थपिएको देखाइन्छ।"
      subtitleEn="For each day, which rashi rises as the lagna and when, from sunrise to the next sunrise — times before sunrise are shown with 24 hours added."
    >
      {table}
    </PatroTableShell>
  );
}
