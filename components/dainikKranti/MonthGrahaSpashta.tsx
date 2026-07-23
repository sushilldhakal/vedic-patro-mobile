import { ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"
import {
  PATRO_PLANET_KEYS,
  PATRO_PLANET_NE,
  RASHI_COLUMNS_EN,
  RASHI_COLUMNS_NE,
  type GrahaSpashtaRow,
} from "@/lib/dainikKranti/month-patro-tables";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import {
  patroStickyHeadCell,
  patroStickyHeadRow,
  patroStickySubHeadCell,
} from "@/lib/patro-classes";
import { PatroTableShell } from "./PatroTableShell";

const th = "px-2 py-2.5 text-sm font-semibold";
const td = "px-2 py-2 text-sm";

const PLANET_EN: Record<string, string> = {
  sun: "Sun", moon: "Moon", mars: "Mars", mercury: "Mercury", jupiter: "Jupiter",
  venus: "Venus", saturn: "Saturn", rahu: "Rahu",
};

type Props = {
  rows: GrahaSpashtaRow[];
  todayKey?: string;
  loading?: boolean;
  empty?: boolean;
  embedded?: boolean;
};

function formatPlanetCell(
  cell: { rashiNe: string; rashiEn?: string; coords: string } | undefined,
  isEn: boolean,
): string {
  if (!cell) return "—";
  return `${isEn ? (cell.rashiEn ?? cell.rashiNe) : cell.rashiNe} ${cell.coords}`;
}

export function MonthGrahaSpashta({ rows, todayKey, loading, empty, embedded }: Props) {
  const { lang, pick, digits } = useLocale();
  const isEn = lang === "en";

  const table = (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View className="min-w-full">
        <View className={cn("flex-row border-b border-border", patroStickyHeadRow)}>
          <View className={cn(th, "min-w-[3rem] pl-3")}>
            <Text className="text-sm font-semibold">{pick("गते", "Date")}</Text>
          </View>
          <View className={cn(th, patroStickyHeadCell, "min-w-[3.5rem]")}>
            <Text className="text-sm font-semibold">{pick("बा.", "Day")}</Text>
          </View>
          {PATRO_PLANET_KEYS.map((key) => (
            <View key={key} className={cn(th, patroStickyHeadCell, "min-w-[5.5rem] items-center")}>
              <Text className="text-center text-sm font-semibold">
                {pick(PATRO_PLANET_NE[key], PLANET_EN[key] ?? PATRO_PLANET_NE[key])}
              </Text>
            </View>
          ))}
          <View className={cn(th, patroStickyHeadCell, "min-w-[4.5rem] items-center")}>
            <Text className="text-center text-sm font-semibold">
              {pick("बेलान्तर", "Belaantar")}
            </Text>
          </View>
        </View>

        <View className="flex-row border-b border-border bg-muted/60">
          <View className="min-w-[6.5rem]" />
          {PATRO_PLANET_KEYS.map((key) => (
            <View key={`sub-${key}`} className={cn(th, patroStickySubHeadCell, "min-w-[5.5rem] items-center")}>
              <Text className="text-center text-xs font-normal text-muted-foreground">
                {pick("रा|अं|क|वि", "Ra|Deg|Ka|Vi")}
              </Text>
            </View>
          ))}
          <View className={cn(th, patroStickySubHeadCell, "min-w-[4.5rem] items-center")}>
            <Text className="text-center text-xs font-normal text-muted-foreground">
              {pick("समय सुधार", "Time corr.")}
            </Text>
          </View>
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
            const hasPlanets = PATRO_PLANET_KEYS.some((k) => row.planets[k]);
            return (
              <View
                key={row.dateAd}
                className={cn("flex-row border-b border-border/60", isToday && "bg-secondary/15")}
              >
                <View className={cn(td, "min-w-[3rem] pl-3 font-semibold")}>
                  <Text className="font-num font-semibold">{digits(row.day)}</Text>
                </View>
                <View className={cn(td, "min-w-[3.5rem]")}>
                  <Text>{pick(row.weekdayNe ?? "—", row.weekdayEn ?? row.weekdayNe ?? "—")}</Text>
                </View>
                {PATRO_PLANET_KEYS.map((key) => (
                  <View key={key} className={cn(td, "min-w-[5.5rem] items-center")}>
                    <Text className="font-num text-center tabular-nums">
                      {formatPlanetCell(row.planets[key], isEn)}
                    </Text>
                  </View>
                ))}
                <View className={cn(td, "min-w-[4.5rem] items-center")}>
                  <Text className="font-num text-center tabular-nums">
                    {row.belaantar ?? (hasPlanets ? "—" : "—")}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );

  const footnote = (
    <Text className="border-t border-border px-4 py-2 text-sm leading-relaxed text-muted-foreground">
      {pick(
        `राशिहरू: ${RASHI_COLUMNS_NE.join(", ")}। प्रत्येक ग्रहको कोष्ठकमा राशि अंश|कला|विकला — जस्तै वृष १३|६|२९ = वृष राशि, १३ अंश ६ कला २९ विकला।`,
        `Signs: ${RASHI_COLUMNS_EN.join(", ")}. Each planet's bracket shows sign deg|kala|vikala — e.g. Vrishabha 13|6|29 = Vrishabha sign, 13 deg 6 kala 29 vikala.`,
      )}
    </Text>
  );

  if (embedded) {
    return (
      <View className="overflow-hidden rounded-lg border border-border">
        {table}
        {footnote}
      </View>
    );
  }

  return (
    <PatroTableShell
      titleNe="उदयकालिक सूर्यादिग्रहस्पष्ट"
      titleEn="Sunrise Planetary Positions (Graha Spashta)"
      subtitle="सूर्योदयको क्षणमा ग्रहहरूको राश्यादि स्थिति (राशि, अंश|कला|विकला) र दैनिक बेलान्तर।"
      subtitleEn="The planets' rashi positions (sign, deg|kala|vikala) at the moment of sunrise, and the daily belaantar."
    >
      {table}
      {footnote}
    </PatroTableShell>
  );
}
