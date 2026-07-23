import { View } from "react-native"
import { Text } from "@/components/ui/Text"
import {
  PATRO_PLANET_KEYS,
  PATRO_PLANET_NE,
  RASHI_COLUMNS_EN,
  RASHI_COLUMNS_NE,
  type CalcNote,
  type GrahaSpashtaRow,
  type LagnaMatrixRow,
} from "@/lib/dainikKranti/month-patro-tables";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

const PLANET_EN: Record<string, string> = {
  sun: "Sun", moon: "Moon", mars: "Mars", mercury: "Mercury", jupiter: "Jupiter",
  venus: "Venus", saturn: "Saturn", rahu: "Rahu",
};

type Props = {
  lagna?: LagnaMatrixRow;
  graha?: GrahaSpashtaRow;
  notes?: CalcNote[];
};

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm">
      {children}
    </Text>
  );
}

export function DayPatroExpandPanel({ lagna, graha, notes = [] }: Props) {
  const { lang, pick } = useLocale();
  const isEn = lang === "en";

  return (
    <View className="w-full min-w-0 space-y-4 py-2">
      {lagna ? (
        <View className="w-full min-w-0">
          <SectionTitle>{pick("दैनिक लग्न आरम्भ (बजे)", "Daily lagna start")}</SectionTitle>
          <View className="flex-row flex-wrap gap-2">
            {RASHI_COLUMNS_NE.map((rne, i) => {
              const num = i + 1;
              const val = lagna.times[num];
              const late =
                val?.includes("२५") || val?.includes("२६") || val?.includes("२७");
              return (
                <View
                  key={rne}
                  className="min-w-[4.5rem] flex-1 rounded-md border border-border/80 bg-background/80 px-1.5 py-1.5"
                  style={{ maxWidth: "31%" }}
                >
                  <Text className="text-center text-xs text-muted-foreground">
                    {pick(rne, RASHI_COLUMNS_EN[i])}
                  </Text>
                  <Text
                    className={cn(
                      "mt-1 text-center font-num text-xs tabular-nums sm:text-sm",
                      late ? "text-amber-700 dark:text-amber-300" : "text-foreground",
                    )}
                  >
                    {val ?? "—"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {graha ? (
        <View className="w-full min-w-0">
          <SectionTitle>
            {pick("उदयकालिक ग्रहस्पष्ट (सूर्योदय)", "Planetary positions at sunrise")}
          </SectionTitle>
          <View className="flex-row flex-wrap gap-2">
            {PATRO_PLANET_KEYS.map((key) => {
              const cell = graha.planets[key];
              if (!cell) return null;
              return (
                <View
                  key={key}
                  className="min-w-[45%] flex-1 rounded-md border border-border/80 bg-background/80 px-2.5 py-2"
                  style={{ maxWidth: "48%" }}
                >
                  <Text className="text-sm font-semibold text-foreground">
                    {pick(PATRO_PLANET_NE[key], PLANET_EN[key] ?? PATRO_PLANET_NE[key])}
                  </Text>
                  <Text className="mt-0.5 font-num text-xs tabular-nums sm:text-sm">
                    <Text className="text-foreground">
                      {isEn ? (cell.rashiEn ?? cell.rashiNe) : cell.rashiNe}
                    </Text>{" "}
                    {cell.coords}
                  </Text>
                </View>
              );
            })}
            {graha.belaantar ? (
              <View className="w-full rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-2">
                <Text className="text-sm font-semibold text-foreground">
                  {pick("बेलान्तर", "Belaantar")}
                </Text>
                <Text className="mt-0.5 font-num text-xs text-amber-800 dark:text-amber-200 sm:text-sm">
                  {graha.belaantar}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {notes.length > 0 ? (
        <View className="w-full min-w-0 gap-1.5">
          {notes.map((n) => (
            <Text key={`${n.kind}-${n.text}`} className="text-sm text-foreground">
              {pick(n.text, n.textEn ?? n.text)}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
