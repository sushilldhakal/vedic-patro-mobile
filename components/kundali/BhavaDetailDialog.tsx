import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal } from "@/components/ui/BottomSheetModal";
import { Text } from "@/components/ui/Text";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { cn } from "@/lib/utils";
import type { BhavaHouse } from "@/lib/bhava";
import { houseBadge, formatHouseBadge } from "@/lib/bhava";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import { GRAHA_DRISHTI } from "@/lib/kundali/graha-drishti";
import { janmaPhalaFor } from "@/lib/kundali/janma-phala-tables";
import { bhaveshPhalaFor } from "@/lib/kundali/bhavesh-phala";
import {
  RASHI_LORD,
  HOUSE_INFO,
  HOUSE_ORDINAL_NE,
  HOUSE_ORDINAL_EN,
  computeAspectedBy,
} from "@/lib/kundali/bhava-detail";

/** Mirrors the small RASHI_EN list each D1Chart file keeps locally. */
const RASHI_EN = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
];

type Props = {
  houses: BhavaHouse[];
  houseNumber: number | null;
  onClose: () => void;
};

export function BhavaDetailDialog({ houses, houseNumber, onClose }: Props) {
  const house = houseNumber != null ? houses.find((h) => h.house === houseNumber) : undefined;
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <BottomSheetModal
      visible={Boolean(house)}
      onClose={onClose}
      variant="bottom"
      maxHeight="85%"
      sheetStyle={{
        backgroundColor: colors.card,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: Math.max(insets.bottom, 12),
      }}
    >
      {house && <BhavaDetailBody house={house} houses={houses} onClose={onClose} />}
    </BottomSheetModal>
  );
}

function grahaName(key: string, pick: (ne: string, en: string) => string): string {
  const entry = GRAHA_NAME[key as GrahaKey];
  return entry ? pick(entry.ne, entry.en) : key;
}

function joinNames(keys: string[], pick: (ne: string, en: string) => string): string {
  if (keys.length === 0) return pick("कोही छैन", "None");
  return keys.map((k) => grahaName(k, pick)).join(", ");
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="rounded-xl border border-border bg-muted/30 p-3.5">
      <Text className="mb-2 text-sm font-bold text-foreground">{title}</Text>
      {children}
    </View>
  );
}

function NotAvailable({ pick }: { pick: (ne: string, en: string) => string }) {
  return (
    <View className="rounded-lg border border-dashed border-border bg-card/40 p-2.5">
      <Text className="text-sm text-muted-foreground">
        {pick(
          "यो खण्ड अहिले उपलब्ध छैन — छिट्टै थपिनेछ।",
          "This section isn't available yet — coming soon.",
        )}
      </Text>
    </View>
  );
}

function BhavaDetailBody({
  house,
  houses,
  onClose,
}: {
  house: BhavaHouse;
  houses: BhavaHouse[];
  onClose: () => void;
}) {
  const { pick, digits, lang } = useLocale();
  const body = lang === "en" ? undefined : nepaliTextStyle(13);
  const small = lang === "en" ? undefined : nepaliTextStyle(12);

  const info = HOUSE_INFO[house.house];
  const lordKey = RASHI_LORD[house.rashi];
  const lordHouse = houses.find((h) => h.planets.some((p) => p.key === lordKey))?.house;

  const occupants = house.planets;
  const aspectedBy = computeAspectedBy(houses, house.house);

  const beneficPresent = [...occupants.map((p) => p.key), ...aspectedBy].some(
    (k) => GRAHA_DRISHTI[k as GrahaKey]?.isMalefic === false,
  );
  const maleficPresent = [...occupants.map((p) => p.key), ...aspectedBy].some(
    (k) => GRAHA_DRISHTI[k as GrahaKey]?.isMalefic === true,
  );

  const badge = houseBadge(house.house);
  const ordinal = pick(HOUSE_ORDINAL_NE[house.house - 1], HOUSE_ORDINAL_EN[house.house - 1]);
  const title = pick(`भाव ${digits(house.house)} — ${ordinal} भाव`, `House ${digits(house.house)} — ${ordinal} house`);
  const rashiName = pick(house.rashiNe, RASHI_EN[house.rashi - 1] ?? house.rashiNe);

  return (
    <>
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3.5">
        <Text className="flex-1 text-base font-bold text-foreground" style={lang === "en" ? undefined : nepaliTextStyle(16)}>
          {title}
        </Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={pick("बन्द गर्नुहोस्", "Close")}
          className="ml-2 h-8 w-8 items-center justify-center rounded-full bg-muted/60"
        >
          <Text className="text-base text-muted-foreground">✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* भाव फलादेश */}
        <Section title={pick(`भाव ${digits(house.house)} — ${info.themeNe}`, `House ${digits(house.house)} — ${info.themeEn}`)}>
          <View className="mb-2 flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <Text className="text-sm" style={small}>
              {pick("राशि:", "Sign:")} <Text className="text-sm font-semibold text-foreground">{digits(house.rashi)} {rashiName}</Text>
            </Text>
            <Text className="text-sm" style={small}>
              {pick("राशि स्वामी:", "Sign lord:")} <Text className="text-sm font-semibold text-secondary">{grahaName(lordKey, pick)}</Text>
            </Text>
            {badge && (
              <View className="rounded-full border border-border bg-card px-2 py-0.5">
                <Text className="text-sm">{formatHouseBadge(badge, lang)}</Text>
              </View>
            )}
          </View>
          <Text className="mb-2 text-sm" style={small}>
            {pick("यस भावमा:", "Occupants:")}{" "}
            <Text className="text-sm font-semibold text-foreground">{joinNames(occupants.map((p) => p.key), pick)}</Text>
          </Text>
          <Text className="text-sm leading-relaxed" style={body}>
            {pick(info.summaryNe, info.summaryEn)}
          </Text>
          <View className="mt-2.5 gap-1.5">
            <View className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5">
              <Text className="text-sm" style={small}>
                <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{pick("शुभ ग्रह:", "Benefics:")}</Text>{" "}
                {pick(info.beneficEffectNe, info.beneficEffectEn)}
              </Text>
            </View>
            <View className="rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1.5">
              <Text className="text-sm" style={small}>
                <Text className="text-sm font-semibold text-destructive">{pick("पापग्रह:", "Malefics:")}</Text>{" "}
                {pick(info.maleficEffectNe, info.maleficEffectEn)}
              </Text>
            </View>
          </View>
        </Section>

        {/* ग्रह फलादेश — real data: janma-phala classical phrase per occupying graha */}
        {occupants.length > 0 && (
          <Section title={pick("🪐 ग्रह फलादेश", "🪐 Graha in this house")}>
            <View className="gap-2">
              {occupants.map((p) => {
                const phala = janmaPhalaFor(p.key, house.house);
                return (
                  <View key={p.key} className="rounded-lg border border-border bg-card p-2.5">
                    <Text className="text-sm font-semibold text-foreground">{grahaName(p.key, pick)}</Text>
                    {phala ? (
                      <Text className="mt-0.5 text-sm" style={small}>
                        {pick(`जन्म फल: ${phala}`, `Classical phala: ${phala}`)}
                      </Text>
                    ) : (
                      <Text className="mt-0.5 text-sm text-muted-foreground" style={small}>
                        {pick("जन्म फल उपलब्ध छैन", "No classical phala available")}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
            <Text className="mt-2 text-sm text-muted-foreground" style={small}>
              {pick(
                "स्रोत: पुरुष जन्म फल तालिका (परम्परागत ज्योतिष सन्दर्भ)। कारकत्व श्लोक र सारावली विवरण अहिले उपलब्ध छैन।",
                "Source: Purusha janma-phala table (classical reference). Karakatva shloka and saravali detail aren't available yet.",
              )}
            </Text>
          </Section>
        )}

        {/* मेडिकल ज्योतिष */}
        <Section title={pick("🩺 मेडिकल ज्योतिष", "🩺 Medical astrology")}>
          <Text className="mb-2 text-sm" style={small}>
            <Text className="text-sm font-semibold text-foreground">{pick("यस भावका शरीरका अंग:", "Body parts of this house:")}</Text>{" "}
            {pick(info.medicalNe, info.medicalEn)}
          </Text>
          <View
            className={cn(
              "flex-row self-start items-center gap-1 rounded-full border px-2.5 py-1",
              maleficPresent
                ? "border-destructive/30 bg-destructive/10"
                : "border-emerald-500/30 bg-emerald-500/15",
            )}
          >
            <Text className={cn("text-sm font-semibold", maleficPresent ? "text-destructive" : "text-emerald-700 dark:text-emerald-300")}>
              {maleficPresent ? pick("⚠️ ध्यान दिनुपर्ने", "⚠️ Needs attention") : pick("✅ सामान्यतया ठीक", "✅ Generally fine")}
            </Text>
          </View>
          {!maleficPresent && !beneficPresent && (
            <Text className="mt-1.5 text-sm text-muted-foreground" style={small}>
              {pick("यस भावमा कुनै ग्रहको दृष्टि वा उपस्थिति छैन।", "No graha occupies or aspects this house.")}
            </Text>
          )}
        </Section>

        {/* भावेश फल */}
        <Section title={pick("🏠 भावेश फल", "🏠 Lord placement (bhavesh)")}>
          {lordHouse ? (
            <Text className="text-sm" style={small}>
              {pick(
                `${digits(house.house)} भाव (${info.themeNe.split(",")[0]}) को स्वामी ${grahaName(lordKey, pick)} → ${digits(lordHouse)} भाव (${HOUSE_INFO[lordHouse]?.themeNe.split(",")[0]}) मा`,
                `Lord of house ${digits(house.house)} (${info.themeEn.split(",")[0]}), ${grahaName(lordKey, pick)}, sits in house ${digits(lordHouse)} (${HOUSE_INFO[lordHouse]?.themeEn.split(",")[0]})`,
              )}
            </Text>
          ) : (
            <Text className="text-sm text-muted-foreground" style={small}>
              {pick(
                `राशि स्वामी ${grahaName(lordKey, pick)} यो D1 चार्टमा फेला परेन।`,
                `Sign lord ${grahaName(lordKey, pick)} wasn't found placed in this D1 chart.`,
              )}
            </Text>
          )}
          {lordHouse && bhaveshPhalaFor(house.house, lordHouse) ? (
            <View className="mt-2 rounded-lg border border-border bg-card p-2.5">
              <Text className="text-sm leading-relaxed" style={small}>
                {pick(
                  bhaveshPhalaFor(house.house, lordHouse)!.ne,
                  bhaveshPhalaFor(house.house, lordHouse)!.en,
                )}
              </Text>
            </View>
          ) : (
            <Text className="mt-2 text-sm text-muted-foreground" style={small}>
              {pick(
                "यो विशेष स्थान-सम्बन्धको लागि श्लोक-व्याख्या अहिले उपलब्ध छैन — यो स्थान-सम्बन्ध मात्र देखाइएको हो।",
                "No shloka commentary is available for this specific placement yet — only the placement fact is shown.",
              )}
            </Text>
          )}
          <Text className="mt-2 text-sm text-muted-foreground" style={small}>
            {pick("स्रोत: बृहत्पाराशर होराशास्त्र, अध्याय २७", "Source: Brihat Parashara Hora Shastra, ch. 27")}
          </Text>
        </Section>

        {/* सम्पूर्ण लाल किताब भाव फलादेश */}
        <Section title={pick("📕 सम्पूर्ण लाल किताब भाव फलादेश", "📕 Complete Lal Kitab house prediction")}>
          <NotAvailable pick={pick} />
        </Section>

        {/* सम्पूर्ण ज्योतिष सूत्र सङ्ग्रह */}
        <Section title={pick("📜 सम्पूर्ण ज्योतिष सूत्र सङ्ग्रह", "📜 Complete jyotish sutra collection")}>
          <NotAvailable pick={pick} />
        </Section>

        {/* लागू भएका भृगु नन्दी नाडी सूत्र */}
        <Section title={pick("📘 लागू भएका भृगु नन्दी नाडी सूत्र", "📘 Applicable Bhrigu Nandi Nadi sutras")}>
          <NotAvailable pick={pick} />
        </Section>
      </ScrollView>
    </>
  );
}
