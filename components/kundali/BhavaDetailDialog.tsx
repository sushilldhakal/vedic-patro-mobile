import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal } from "@/components/ui/BottomSheetModal";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { cn } from "@/lib/utils";
import type { BhavaHouse } from "@/lib/bhava";
import { houseBadge, formatHouseBadge } from "@/lib/bhava";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import type { BhavaReferencePayload } from "@/lib/api";
import { HOUSE_ORDINAL_NE, HOUSE_ORDINAL_EN, computeAspectedBy } from "@/lib/kundali/bhava-detail";

/** Mirrors the small RASHI_EN list each D1Chart file keeps locally. */
const RASHI_EN = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
];

type Props = {
  houses: BhavaHouse[];
  houseNumber: number | null;
  reference: BhavaReferencePayload | undefined;
  onClose: () => void;
};

export function BhavaDetailDialog({ houses, houseNumber, reference, onClose }: Props) {
  const { pick } = useLocale();
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
      {house ? (
        reference ? (
          <BhavaDetailBody house={house} houses={houses} reference={reference} onClose={onClose} />
        ) : (
          <View className="px-4 py-6">
            <Text className="text-sm text-muted-foreground">{pick("लोड हुँदैछ…", "Loading…")}</Text>
          </View>
        )
      ) : null}
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

function yutiKey(keys: string[]): string {
  return [...keys].sort().join("+");
}

/** Every 3-element subset of `keys` — houses rarely hold more than 3-4
 * grahas, so this stays small in practice. */
function subsetsOf3(keys: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      for (let k = j + 1; k < keys.length; k++) {
        out.push([keys[i], keys[j], keys[k]]);
      }
    }
  }
  return out;
}

/** Plain header + content, no border/bg box — sections separate via the
 * ScrollView's own gap instead of nested cards. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="mb-2 text-sm font-bold text-foreground">{title}</Text>
      {children}
    </View>
  );
}

const ratingBadgeCls: Record<string, string> = {
  uttam: "border-emerald-500/30 bg-emerald-500/15",
  shubh: "border-emerald-500/30 bg-emerald-500/15",
  mishrit: "border-amber-500/30 bg-amber-500/15",
  kamjor: "border-destructive/20 bg-destructive/10",
};

const ratingTextCls: Record<string, string> = {
  uttam: "text-emerald-700 dark:text-emerald-300",
  shubh: "text-emerald-700 dark:text-emerald-300",
  mishrit: "text-amber-700 dark:text-amber-300",
  kamjor: "text-destructive",
};

function GrahaKarakatvaCard({
  grahaKey,
  house,
  reference,
  pick,
  digits,
  small,
}: {
  grahaKey: string;
  house: number;
  reference: BhavaReferencePayload;
  pick: (ne: string, en: string) => string;
  digits: (v: string | number) => string;
  small: ReturnType<typeof nepaliTextStyle> | undefined;
}) {
  const k = reference.grahaKarakatva[grahaKey];
  if (!k) return null;
  const saravali = reference.grahaHouseSaravali[grahaKey]?.[house];

  return (
    <View className="gap-2">
      <Text className="text-sm font-bold text-foreground">🪐 {grahaName(grahaKey, pick)}</Text>

      <View>
        <Text className="text-sm font-semibold text-foreground">
          📜 {pick("कारकत्व श्लोक", "Karakatva shloka")}
          <Text className="text-sm font-normal text-muted-foreground"> — {pick(k.shlokaSourceNe, k.shlokaSourceEn)}</Text>
        </Text>
        <Text className="mt-1 text-sm italic leading-relaxed text-foreground/90" style={small}>
          {k.shloka}
        </Text>
      </View>

      <View>
        <Text className="text-sm font-semibold text-foreground">📋 {pick("कारकत्व विषयहरू", "Karakatva subjects")}</Text>
        <Text className="mt-1 text-sm leading-relaxed" style={small}>
          {pick(k.subjectsNe, k.subjectsEn)}।
        </Text>
      </View>

      <View>
        <Text className="text-sm font-semibold text-foreground">💡 {pick("ग्रहको महत्व", "Significance")}</Text>
        <Text className="mt-1 text-sm leading-relaxed" style={small}>
          {pick(k.significanceNe, k.significanceEn)}
        </Text>
      </View>

      <View className="border-l-2 border-secondary/40 pl-3">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-sm font-semibold text-foreground" style={small}>
            ⬡ {pick(`भाव ${digits(house)} मा ${grahaName(grahaKey, pick)}को फल`, `${grahaName(grahaKey, pick)} in house ${digits(house)}`)}
          </Text>
          {saravali && (
            <View className={cn("shrink-0 rounded-full border px-2 py-0.5", ratingBadgeCls[saravali.rating])}>
              <Text className={cn("text-sm font-semibold", ratingTextCls[saravali.rating])}>
                {pick(reference.ratingLabel[saravali.rating].ne, reference.ratingLabel[saravali.rating].en)}
              </Text>
            </View>
          )}
        </View>

        {saravali ? (
          <>
            <Text className="mt-2 text-sm font-semibold text-foreground">
              📜 {pick("श्लोक", "Shloka")} — {pick(saravali.shlokaSourceNe, saravali.shlokaSourceEn)}
            </Text>
            <Text className="mt-1 text-sm italic leading-relaxed text-foreground/90" style={small}>
              {saravali.shloka}
            </Text>
            <Text className="mt-1.5 text-sm leading-relaxed" style={small}>
              <Text className="text-sm font-semibold text-foreground">{pick("अर्थ:", "Meaning:")}</Text>{" "}
              {pick(saravali.meaningNe, saravali.meaningEn)}
            </Text>
            <Text className="mt-1 text-sm leading-relaxed" style={small}>
              <Text className="text-sm font-semibold text-foreground">{pick("व्याख्या:", "Explanation:")}</Text>{" "}
              {pick(saravali.explanationNe, saravali.explanationEn)}
            </Text>
          </>
        ) : (
          <Text className="mt-1.5 text-sm text-muted-foreground" style={small}>
            {pick(
              "यो भाव-ग्रह संयोजनको लागि सारावली श्लोक अहिले उपलब्ध छैन।",
              "No saravali shloka is available for this house-graha combination yet.",
            )}
          </Text>
        )}
      </View>
    </View>
  );
}

function BhavaDetailBody({
  house,
  houses,
  reference,
  onClose,
}: {
  house: BhavaHouse;
  houses: BhavaHouse[];
  reference: BhavaReferencePayload;
  onClose: () => void;
}) {
  const { pick, digits, lang } = useLocale();
  const body = lang === "en" ? undefined : nepaliTextStyle(13);
  const small = lang === "en" ? undefined : nepaliTextStyle(12);

  const info = reference.houseInfo[house.house];
  const lordKey = reference.rashiLord[house.rashi];
  const lordHouse = houses.find((h) => h.planets.some((p) => p.key === lordKey))?.house;

  const occupants = house.planets;
  const aspectedBy = computeAspectedBy(houses, house.house);

  const beneficPresent = [...occupants.map((p) => p.key), ...aspectedBy].some(
    (k) => reference.grahaDrishti[k]?.isMalefic === false,
  );
  const maleficPresent = [...occupants.map((p) => p.key), ...aspectedBy].some(
    (k) => reference.grahaDrishti[k]?.isMalefic === true,
  );

  const badge = houseBadge(house.house);
  const ordinal = pick(HOUSE_ORDINAL_NE[house.house - 1], HOUSE_ORDINAL_EN[house.house - 1]);
  const title = pick(`भाव ${digits(house.house)} — ${ordinal} भाव`, `House ${digits(house.house)} — ${ordinal} house`);
  const rashiName = pick(house.rashiNe, RASHI_EN[house.rashi - 1] ?? house.rashiNe);
  const lalKitabFixedLord = reference.lalKitabFixedLord[house.house] ?? [];
  const bhaveshEntry = lordHouse != null ? reference.bhaveshPhala[house.house]?.[lordHouse] : undefined;

  const occupantKeys = occupants.map((p) => p.key);
  const yuti2Entry = occupantKeys.length === 2 ? reference.grahaYuti2[yutiKey(occupantKeys)] : undefined;
  const yuti3Entries =
    occupantKeys.length >= 3
      ? subsetsOf3(occupantKeys)
          .map((triple) => reference.grahaYuti3[yutiKey(triple)])
          .filter((e): e is NonNullable<typeof e> => Boolean(e))
      : [];
  const showYutiSection = occupantKeys.length >= 2;

  const applicableSutras = reference.naadiSutras
    .filter((s) => s.grahas.some((g) => occupantKeys.includes(g)))
    .sort((a, b) => a.number - b.number);

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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 16, gap: 20 }}>
        {/* भाव फलादेश */}
        <Section title={pick(`भाव ${digits(house.house)} — ${info.themeNe}`, `House ${digits(house.house)} — ${info.themeEn}`)}>
          <View className="mb-2 flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <Text className="text-sm" style={small}>
              {pick("राशि:", "Sign:")} <Text className="text-sm font-semibold text-foreground">{digits(house.rashi)} {rashiName}</Text>
            </Text>
            <Text className="text-sm" style={small}>
              {pick("राशि स्वामी:", "Sign lord:")} <Text className="text-sm font-semibold text-secondary">{grahaName(lordKey, pick)}</Text>
            </Text>
            {badge && <Text className="text-sm text-muted-foreground">{formatHouseBadge(badge, lang)}</Text>}
          </View>
          <Text className="mb-2 text-sm" style={small}>
            {pick("यस भावमा:", "Occupants:")}{" "}
            <Text className="text-sm font-semibold text-foreground">{joinNames(occupants.map((p) => p.key), pick)}</Text>
          </Text>
          <Text className="text-sm leading-relaxed" style={body}>
            {pick(info.summaryNe, info.summaryEn)}
          </Text>
          <Text className="mt-2.5 text-sm leading-relaxed" style={small}>
            <Text className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{pick("शुभ ग्रह:", "Benefics:")}</Text>{" "}
            {pick(info.beneficEffectNe, info.beneficEffectEn)}
          </Text>
          <Text className="mt-1 text-sm leading-relaxed" style={small}>
            <Text className="text-sm font-semibold text-destructive">{pick("पापग्रह:", "Malefics:")}</Text>{" "}
            {pick(info.maleficEffectNe, info.maleficEffectEn)}
          </Text>
        </Section>

        {/* ग्रह फलादेश — karakatva + one worked saravali example per occupying graha */}
        <Section title={pick("🪐 ग्रह फलादेश", "🪐 Graha in this house")}>
          {occupants.length > 0 ? (
            <View className="gap-4">
              {occupants.map((p) => (
                <GrahaKarakatvaCard
                  key={p.key}
                  grahaKey={p.key}
                  house={house.house}
                  reference={reference}
                  pick={pick}
                  digits={digits}
                  small={small}
                />
              ))}
            </View>
          ) : (
            <View>
              <Text className="text-sm leading-relaxed" style={small}>
                <Text className="text-sm font-semibold text-foreground">{pick("रिक्त भाव:", "Empty house:")}</Text>{" "}
                {pick(
                  "यस भावमा कुनै ग्रह नभएमा भावस्वामी ग्रहको स्थिति र दृष्टिबाट फल निर्धारण हुन्छ।",
                  "When no graha occupies this house, its result is read from the position and aspects of the house's ruling graha instead.",
                )}
              </Text>
              <Text className="mt-1.5 text-sm leading-relaxed" style={small}>
                {pick(
                  `राशि स्वामी ${grahaName(lordKey, pick)}को स्थिति हेर्नुहोस्।`,
                  `See the placement of ${grahaName(lordKey, pick)}, this house's ruling graha.`,
                )}
              </Text>
            </View>
          )}
        </Section>

        {/* ग्रह युति फल — shown only when 2+ grahas share this house */}
        {showYutiSection && (
          <Section title={pick("👥 ग्रह युति फल", "👥 Graha conjunction (yuti) result")}>
            <View className="gap-3">
              {yuti2Entry && (
                <View className="border-l-2 border-secondary/40 pl-3">
                  <Text className="text-sm font-semibold text-foreground" style={small}>
                    {joinNames(occupantKeys, pick)}
                    {yuti2Entry.yogaNameNe && (
                      <Text className="text-sm font-normal text-muted-foreground">
                        {" "}
                        ({pick(yuti2Entry.yogaNameNe, yuti2Entry.yogaNameEn ?? yuti2Entry.yogaNameNe)})
                      </Text>
                    )}
                  </Text>
                  <Text className="mt-1 text-sm leading-relaxed" style={small}>
                    {pick(yuti2Entry.textNe, yuti2Entry.textEn)}
                  </Text>
                </View>
              )}
              {yuti3Entries.map((entry) => (
                <View key={yutiKey(entry.grahas)} className="border-l-2 border-secondary/40 pl-3">
                  <Text className="text-sm font-semibold text-foreground" style={small}>
                    {joinNames(entry.grahas, pick)}
                  </Text>
                  <Text className="mt-1 text-sm leading-relaxed" style={small}>
                    {pick(entry.textNe, entry.textEn)}
                  </Text>
                </View>
              ))}
              {occupantKeys.length >= 3 && (
                <Text className="text-sm leading-relaxed text-muted-foreground" style={small}>
                  {pick(reference.grahaYutiGeneralRule.ne, reference.grahaYutiGeneralRule.en)}
                </Text>
              )}
              {!yuti2Entry && yuti3Entries.length === 0 && occupantKeys.length < 3 && (
                <Text className="text-sm text-muted-foreground" style={small}>
                  {pick(
                    "यो विशेष ग्रह-युतिको लागि सन्दर्भ अहिले उपलब्ध छैन।",
                    "No reference is available for this specific graha combination yet.",
                  )}
                </Text>
              )}
            </View>
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
                `${digits(house.house)} भाव (${info.themeNe.split(",")[0]}) को स्वामी ${grahaName(lordKey, pick)} → ${digits(lordHouse)} भाव (${reference.houseInfo[lordHouse]?.themeNe.split(",")[0]}) मा`,
                `Lord of house ${digits(house.house)} (${info.themeEn.split(",")[0]}), ${grahaName(lordKey, pick)}, sits in house ${digits(lordHouse)} (${reference.houseInfo[lordHouse]?.themeEn.split(",")[0]})`,
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
          {bhaveshEntry ? (
            <>
              {bhaveshEntry.shloka && (
                <Text className="mt-2 text-sm italic leading-relaxed text-foreground/90" style={small}>
                  {bhaveshEntry.shloka}
                </Text>
              )}
              <Text className="mt-1.5 text-sm leading-relaxed" style={small}>
                {pick(bhaveshEntry.ne, bhaveshEntry.en)}
              </Text>
            </>
          ) : (
            <Text className="mt-2 text-sm text-muted-foreground" style={small}>
              {pick(
                "यो विशेष स्थान-सम्बन्धको लागि श्लोक-व्याख्या अहिले उपलब्ध छैन — यो स्थान-सम्बन्ध मात्र देखाइएको हो।",
                "No shloka commentary is available for this specific placement yet — only the placement fact is shown.",
              )}
            </Text>
          )}
          <Text className="mt-2 text-sm text-muted-foreground" style={small}>
            {pick(`स्रोत: ${reference.bhaveshPhalaSource}`, `Source: ${reference.bhaveshPhalaSource}`)}
          </Text>
        </Section>

        {/* लाल किताब भाव संकेत */}
        <Section title={pick("📕 लाल किताब भाव संकेत", "📕 Lal Kitab house signals")}>
          <Text className="mb-2 text-sm font-semibold text-foreground" style={small}>
            {pick(`ग्रहगत लाल किताब सङ्केत — भाव ${digits(house.house)}`, `Graha-wise Lal Kitab signals — house ${digits(house.house)}`)}
          </Text>
          {occupants.length > 0 ? (
            <View className="gap-3">
              {occupants.map((p) => {
                const entry = reference.lalKitabHouse[p.key]?.[house.house];
                if (!entry) return null;
                return (
                  <View key={p.key}>
                    <Text className="text-sm font-semibold text-foreground">
                      🪐 {grahaName(p.key, pick)} — {pick(`भाव ${digits(house.house)}`, `house ${digits(house.house)}`)}
                    </Text>
                    <Text className="mt-0.5 text-sm leading-relaxed" style={small}>
                      {pick(entry.ne, entry.en)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text className="text-sm leading-relaxed text-muted-foreground" style={small}>
              {pick(
                `यस भावमा कुनै ग्रह नभएकाले प्रत्यक्ष लाल किताब सङ्केत छैन। यस भावको पक्का घर स्वामी ${joinNames(lalKitabFixedLord, pick)}को स्थिति हेर्नुहोस्।`,
                `This house has no occupying graha, so there's no direct Lal Kitab signal. See the placement of ${joinNames(lalKitabFixedLord, pick)}, this house's fixed (pakka ghar) lord.`,
              )}
            </Text>
          )}
          <Text className="mt-2 text-sm text-muted-foreground" style={small}>
            {pick("स्रोत: लाल किताब — भाग २–१०", "Source: Lal Kitab, parts 2–10")}
          </Text>
        </Section>

        {/* लागू भएका भृगु नाडी सूत्र */}
        <Section
          title={pick(
            `📘 लागू भएका भृगु नाडी सूत्र — ${digits(applicableSutras.length)}`,
            `📘 Applicable Brighu Naadi sutras — ${digits(applicableSutras.length)}`,
          )}
        >
          {applicableSutras.length > 0 ? (
            <View className="gap-3">
              {applicableSutras.map((s) => (
                <View key={s.number} className="border-l-2 border-secondary/40 pl-3">
                  <Text className="text-sm font-semibold text-foreground" style={small}>
                    {pick(`सूत्र ${digits(s.number)} — ${s.titleNe}`, `Sutra ${digits(s.number)} — ${s.titleEn}`)}
                  </Text>
                  <Text className="text-sm text-muted-foreground" style={small}>
                    {pick(s.categoryNe, s.categoryEn)}
                  </Text>
                  <Text className="mt-1 text-sm leading-relaxed" style={small}>
                    {pick(s.bodyNe, s.bodyEn)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground" style={small}>
              {pick(
                "यस भावमा कुनै ग्रह नभएकाले लागू हुने भृगु नाडी सूत्र देखिएका छैनन्।",
                "No Brighu Naadi sutras apply, since no graha occupies this house.",
              )}
            </Text>
          )}
          <Text className="mt-2 text-sm text-muted-foreground" style={small}>
            {pick(`स्रोत: ${reference.naadiSutraSource}`, `Source: ${reference.naadiSutraSource}`)}
          </Text>
        </Section>
      </ScrollView>

      <View className="border-t border-border px-4 py-3">
        <Button label={pick("बन्द गर्नुहोस्", "Close")} variant="outline" onPress={onClose} />
      </View>
    </>
  );
}
