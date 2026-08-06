import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { CalendarDay, PanchangaDay } from "@/lib/api";
import {
  buildPanchangaDetailCells,
  formatPatroSignedCorrection,
  getAbhijitMuhurta,
  getPlanetGocharLines,
  getSolarCorrections,
  type PanchangaDetailCell,
} from "@/lib/panchanga-format";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { nepaliTextStyle } from "@/lib/nepali-text";

type Props = {
  p?: PanchangaDay;
  selectedDay?: CalendarDay | null;
  selectedAd?: string;
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
      <Text className="text-sm uppercase tracking-widest text-muted-foreground">{label}</Text>
      <Text
        className={cn(
          "mt-1 text-base font-semibold leading-snug text-foreground",
          mono && "font-num text-sm",
        )}
        style={mono ? nepaliTextStyle(14) : undefined}
      >
        {value ?? "—"}
      </Text>
      {hint ? (
        <Text className="mt-0.5 text-sm leading-snug text-muted-foreground">{hint}</Text>
      ) : null}
    </View>
  );
}

function GocharAsideCard({
  label,
  rashi,
  degree,
  insetBg,
}: {
  label: string;
  rashi?: string;
  degree: string;
  insetBg: string;
}) {
  return (
    <View
      className="min-w-[46%] flex-1 gap-0.5 rounded-[5px] p-2.5"
      style={{ backgroundColor: insetBg, maxWidth: "33%" }}
    >
      <Text className="text-sm font-semibold leading-tight text-foreground" style={nepaliTextStyle(14)}>
        {label}
        {rashi ? (
          <>
            {" "}
            <Text aria-hidden>→</Text> {rashi}
          </>
        ) : null}
      </Text>
      <Text className="font-num text-sm font-semibold leading-tight text-foreground" style={nepaliTextStyle(14)}>
        {degree}
      </Text>
    </View>
  );
}

function SolarCorrectionAsideCard({
  label,
  value,
  insetBg,
}: {
  label: string;
  value: string;
  insetBg: string;
}) {
  return (
    <View className="min-w-0 flex-1 gap-0.5 rounded-[5px] p-2.5" style={{ backgroundColor: insetBg }}>
      <Text className="text-sm font-semibold leading-tight text-foreground">{label}</Text>
      <Text className="font-num text-sm font-semibold leading-tight text-foreground" style={nepaliTextStyle(14)}>
        {value}
      </Text>
    </View>
  );
}

function AsideFooter({ p, selectedAd }: { p: PanchangaDay; selectedAd?: string }) {
  const { pick, lang } = useLocale();
  const router = useRouter();
  const abhijit = getAbhijitMuhurta(p);
  const isEn = lang === "en";

  return (
    <View className="mt-2.5 border-t border-border/60 pt-2.5">
      {abhijit ? (
        <Text className="text-sm leading-snug text-foreground">
          <Text className="font-semibold">{pick("अभिजित् मुहूर्त", "Abhijit Muhurta")} </Text>
          <Text className="font-num font-semibold" style={nepaliTextStyle(14)}>
            {abhijit.rangeDisplay}
            {abhijit.noonDisplay
              ? isEn
                ? ` (noon ${abhijit.noonDisplay})`
                : ` (${pick("मध्यान्ह", "noon")} ${abhijit.noonDisplay})`
              : ""}
          </Text>
        </Text>
      ) : (
        <Text className="text-sm text-muted-foreground">
          {pick("अभिजित् मुहूर्त उपलब्ध छैन।", "Abhijit muhurta unavailable.")}
        </Text>
      )}
      {selectedAd ? (
        <Pressable
          onPress={() => router.push({ pathname: "/panchanga", params: { date: selectedAd } })}
          className="mt-3 items-center rounded-lg border border-border py-2.5"
        >
          <Text className="text-sm font-semibold text-foreground">
            {pick("पञ्चाङ्ग विवरण", "Panchanga detail")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PanchangaVivaranPanel({ p, selectedDay, selectedAd, loading }: Props) {
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
  const hasSolar =
    solar?.deshaantar != null || solar?.akshamsha != null || solar?.belaantar != null;
  const solarCards = hasSolar
    ? (
        [
          [pick("देशान्तर", "Deshaantar"), solar?.deshaantar] as const,
          [pick("अक्षांश", "Akshamsha"), solar?.akshamsha] as const,
          [pick("बेलान्तर", "Belaantar"), solar?.belaantar] as const,
        ] as const
      )
        .filter(([, block]) => block != null)
        .map(([label, block]) => ({
          label,
          value: formatPatroSignedCorrection(block) ?? "—",
        }))
    : [];

  return (
    <View>
      <View className="mb-2.5 flex-row flex-wrap gap-2">
        {cells.map((cell) => (
          <View key={cell.label} className="min-w-[46%] flex-1">
            <VivaranCell {...cell} insetBg={colors.surfaceInset} />
          </View>
        ))}
      </View>

      {planets.length > 0 ? (
        <View className="mt-2.5 border-t border-border/60 pt-2.5">
          <Text className="mb-1.5 text-sm font-bold text-foreground">
            {pick("ग्रह गोचर", "Planet positions")}
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {planets.map(({ key, label, rashi, degree }) => (
              <GocharAsideCard
                key={key}
                label={label}
                rashi={rashi}
                degree={degree}
                insetBg={colors.surfaceInset}
              />
            ))}
          </View>
        </View>
      ) : null}

      {solarCards.length > 0 ? (
        <View
          className={cn(
            "border-t border-border/60 pt-2",
            planets.length > 0 ? "mt-1.5" : "mt-2.5",
          )}
        >
          <View className="flex-row gap-1.5">
            {solarCards.map(({ label, value }) => (
              <SolarCorrectionAsideCard
                key={label}
                label={label}
                value={value}
                insetBg={colors.surfaceInset}
              />
            ))}
          </View>
        </View>
      ) : null}

      <AsideFooter p={p} selectedAd={selectedAd} />
    </View>
  );
}
