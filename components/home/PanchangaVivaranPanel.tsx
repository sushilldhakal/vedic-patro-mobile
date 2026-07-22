import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { CalendarDay, PanchangaDay } from "@/lib/api";
import {
  buildPanchangaDetailCells,
  formatPatroBelaantar,
  formatPatroDeshaantar,
  getAbhijitMuhurta,
  getPlanetGocharLines,
  getSolarCorrections,
  type PanchangaDetailCell,
} from "@/lib/panchanga-format";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

type Props = {
  p?: PanchangaDay;
  selectedDay?: CalendarDay | null;
  bsYear?: number;
  bsMonth?: number;
  loading?: boolean;
};

function VivaranCell({
  label,
  value,
  hint,
  wide,
  mono,
  insetBg,
}: PanchangaDetailCell & { insetBg: string }) {
  return (
    <View
      className={cn("min-w-0 rounded-lg p-2.5", wide && "col-span-2")}
      style={{ backgroundColor: insetBg }}
    >
      <Text className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Text>
      <Text
        className={cn(
          "mt-1 text-sm font-semibold leading-snug text-foreground",
          mono && "font-num text-sm",
        )}
      >
        {value ?? "—"}
      </Text>
      {hint ? (
        <Text className="mt-0.5 text-xs leading-snug text-muted-foreground">{hint}</Text>
      ) : null}
    </View>
  );
}

function AbhijitVivaranBlock({
  p,
  bsYear,
  bsMonth,
}: {
  p: PanchangaDay;
  bsYear: number;
  bsMonth: number;
}) {
  const { pick, lang } = useLocale();
  const router = useRouter();
  const abhijit = getAbhijitMuhurta(p, lang);

  return (
    <View className="mt-2.5 border-t border-border/60 pt-2.5">
      <View className="mb-2 flex-row items-center justify-between gap-2">
        <Text className="text-sm font-bold text-secondary">
          {pick("अभिजित् मुहूर्त", "Abhijit Muhurta")}
        </Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/panchanga",
              params: { year: String(bsYear), month: String(bsMonth) },
            })
          }
        >
          <Text className="text-xs text-secondary">
            {pick("सबै हेर्नुहोस् →", "View all →")}
          </Text>
        </Pressable>
      </View>
      {abhijit ? (
        <View className="flex-row flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <Text className="text-xs text-muted-foreground">
            {pick("आजको समय", "Today's window")}
          </Text>
          <View className="flex-row flex-wrap items-baseline justify-end gap-1.5">
            <Text className="font-num text-sm font-semibold text-foreground">
              {abhijit.rangeDisplay}
            </Text>
            {abhijit.noonDisplay ? (
              <Text className="font-num text-sm text-foreground">
                ({pick("मध्यान्ह", "noon")} {abhijit.noonDisplay})
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <Text className="py-5 text-center text-sm text-muted-foreground">
          {pick("अभिजित् मुहूर्त उपलब्ध छैन।", "Abhijit muhurta unavailable.")}
        </Text>
      )}
    </View>
  );
}

export function PanchangaVivaranPanel({ p, selectedDay, bsYear, bsMonth, loading }: Props) {
  const { pick, lang } = useLocale();
  const colors = useThemeColors();

  if (loading || !p) {
    return (
      <View>
        <View className="mb-2.5 flex-row flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              className="h-16 min-w-[46%] flex-1 rounded-lg p-2.5"
              style={{ backgroundColor: colors.surfaceInset }}
            >
              <View className="h-3 w-16 rounded bg-muted-foreground/20" />
              <View className="mt-2 h-4 w-24 rounded bg-muted-foreground/20" />
            </View>
          ))}
        </View>
        <View className="mt-2.5 h-28 rounded-md bg-muted" />
      </View>
    );
  }

  const cells = buildPanchangaDetailCells(p, lang, selectedDay, {
    sunriseSunset: pick("सूर्योदय / सूर्यास्त", "Sunrise / Sunset"),
    moonrise: pick("चन्द्रोदय", "Moonrise"),
    ritu: pick("ऋतु", "Season"),
    nakshatra: pick("नक्षत्र", "Nakshatra"),
    yoga: pick("योग", "Yoga"),
    karana: pick("करण", "Karana"),
    dash: pick("—", "—"),
  });
  const planets = getPlanetGocharLines(p, lang);
  const solar = getSolarCorrections(p);
  const deshaantar = formatPatroDeshaantar(solar?.deshaantar);
  const belaantar = formatPatroBelaantar(solar?.belaantar);

  return (
    <View>
      <View className="mb-2.5 flex-row flex-wrap gap-2">
        {cells.map((cell) => (
          <View key={cell.label} className="min-w-[46%] flex-1">
            <VivaranCell {...cell} insetBg={colors.surfaceInset} />
          </View>
        ))}
      </View>

      {planets.length > 0 || deshaantar || belaantar ? (
        <View className="mt-2.5 border-t border-border/60 pt-2.5">
          <Text className="mb-1.5 text-sm font-bold text-foreground">
            {pick("ग्रह गोचर", "Planet positions")}
          </Text>
          {planets.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5">
              {planets.map(({ label, value }) => (
                <View
                  key={label}
                  className="min-w-[30%] flex-1 flex-row items-center justify-between gap-1 rounded px-1.5 py-1"
                  style={{ backgroundColor: colors.surfaceInset }}
                >
                  <Text className="shrink-0 text-xs font-semibold leading-tight text-foreground">
                    {label}
                  </Text>
                  <Text className="min-w-0 flex-1 text-right font-num text-xs font-semibold text-foreground">
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {deshaantar || belaantar ? (
            <View className="mt-1.5 flex-row flex-wrap gap-1.5 border-t border-border/60 pt-2">
              {deshaantar ? (
                <View
                  className="min-w-[46%] flex-1 flex-row items-center justify-between gap-1 rounded px-1.5 py-1"
                  style={{ backgroundColor: colors.surfaceInset }}
                >
                  <Text className="shrink-0 text-xs font-semibold leading-tight text-foreground">
                    {pick("सूर्यक्रान्ति", "Suryakranti")}
                  </Text>
                  <Text className="font-num text-xs font-semibold text-foreground">
                    {deshaantar}
                  </Text>
                </View>
              ) : null}
              {belaantar ? (
                <View
                  className="min-w-[46%] flex-1 flex-row items-center justify-between gap-1 rounded px-1.5 py-1"
                  style={{ backgroundColor: colors.surfaceInset }}
                >
                  <Text className="shrink-0 text-xs font-semibold leading-tight text-foreground">
                    {pick("वेलान्तर", "Belaantar")}
                  </Text>
                  <Text className="font-num text-xs font-semibold text-foreground">
                    {belaantar}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {bsYear != null && bsMonth != null ? (
        <AbhijitVivaranBlock p={p} bsYear={bsYear} bsMonth={bsMonth} />
      ) : null}
    </View>
  );
}
