import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "@/components/AppShell";
import { PatroYearNavBlock } from "@/components/patro-date/PatroYearNavBlock";
import { getCurrentBs } from "@/lib/bs-calendar";
import { usePatroYearBrowse } from "@/lib/use-patro-year-browse";
import { Text } from "@/components/ui/Text";
import { fetchPanchakYear, panchakKeys } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { mapPanchakPeriod, type PanchakPeriod } from "@/lib/panchak/panchak-patro-data";
import { PANCHAK_VARIETIES, panchakVarietyFromStartAd } from "@/lib/panchak/panchak-types";
import { formatBsMonthDayPatro } from "@/lib/panchanga-format";
import { useBreakpoint } from "@/lib/responsive";
import { useThemeColors } from "@/lib/theme-context";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";

function fmtAdShort(iso: string, lang: "ne" | "en"): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(lang === "en" ? "en-US" : "ne-NP", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PanchakPeriodCard({
  index,
  period,
  width,
}: {
  index: number;
  period: PanchakPeriod;
  width: string;
}) {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();
  const { width: screenWidth } = useBreakpoint();
  const en = lang === "en";
  const variety = panchakVarietyFromStartAd(period.start.ad);

  const bsStart = formatBsMonthDayPatro(period.start.bsYear, period.start.bsMonth, period.start.bsDay);
  const bsEnd = formatBsMonthDayPatro(period.end.bsYear, period.end.bsMonth, period.end.bsDay);

  const Boundary = ({ label, bs, time, ad }: { label: string; bs: string; time: string; ad: string }) => (
    <View
      style={{ backgroundColor: colors.surfaceInset, borderColor: colors.border }}
      className="flex-1 rounded-xl border px-3.5 py-3"
    >
      <Text
        className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        style={nepaliTextStyle(11)}
      >
        {label}
      </Text>
      <Text className="text-sm font-semibold leading-snug text-foreground" style={nepaliTextStyle(14)}>
        {digits(bs)}, {time}
      </Text>
      <Text className="mt-1 font-num text-xs text-muted-foreground">{ad}</Text>
    </View>
  );

  return (
    <View
      style={{ width: width as never, borderColor: colors.border }}
      className="rounded-2xl border bg-card p-4"
    >
      <View className="mb-4 flex-row flex-wrap items-start justify-between gap-2">
        <Text className="text-sm font-bold text-foreground" style={nepaliTextStyle(14)}>
          {pick(`पञ्चक ${digits(index + 1)}`, `Panchak ${index + 1}`)}
        </Text>
        {variety ? (
          <View
            style={{ backgroundColor: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.4)" }}
            className="rounded-full border px-2.5 py-0.5"
          >
            <Text
              style={{ color: colors.primary, ...nepaliTextStyle(12) }}
              className="text-xs font-semibold"
            >
              {en ? variety.labelEn : variety.labelNe}
            </Text>
          </View>
        ) : null}
      </View>

      <View className={screenWidth >= 640 ? "flex-row gap-4" : "gap-4"}>
        <Boundary
          label={pick("सुरु हुने मिति", "Start")}
          bs={bsStart}
          time={en ? period.start.timeEn : period.start.timeNe}
          ad={fmtAdShort(period.start.ad, lang)}
        />
        <Boundary
          label={pick("समाप्त हुने मिति", "End")}
          bs={bsEnd}
          time={en ? period.end.timeEn : period.end.timeNe}
          ad={fmtAdShort(period.end.ad, lang)}
        />
      </View>

      <Text className="mt-3 text-xs text-muted-foreground" style={nepaliTextStyle(12)}>
        {pick("अवधि", "Duration")}:{" "}
        <Text className="text-foreground">{en ? period.durationEn : period.durationNe}</Text>
      </Text>
    </View>
  );
}

const PROHIBITED: { ne: string; en: string; descNe: string; descEn: string }[] = [
  {
    ne: "दक्षिण यात्रा",
    en: "Travel south",
    descNe: "यमराजको दिशाबाट बच्न (Avoiding the direction of Yamaraj)",
    descEn: "Avoiding the direction of Yama (south)",
  },
  {
    ne: "घर छाउनु",
    en: "Roofing a house",
    descNe: "नयाँ घरमा छत हाल्नु (Putting the roof on a new house)",
    descEn: "Placing the roof on a new house",
  },
  {
    ne: "खाट/छपरी बुन्नु",
    en: "Weaving a bed or cot",
    descNe: "खाट वा कोक्रो बुन्नु वा बनाउनु (Weaving or constructing a bed/cot)",
    descEn: "Weaving or constructing a bed/cot (charpai)",
  },
  {
    ne: "काठ-दाउरा सञ्चय",
    en: "Gathering firewood or grass",
    descNe: "दाउरा वा घाँस जम्मा गर्नु (Gathering firewood or grass)",
    descEn: "Stockpiling fuel or fodder",
  },
  {
    ne: "दाह संस्कार",
    en: "Last rites",
    descNe: "अन्तिम संस्कार गर्नु (Performing last rites)",
    descEn: "Performing cremation or final funeral rites",
  },
];

export default function PanchakPatroScreen() {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();
  const { width } = useBreakpoint();
  const { location, setLocation } = usePanchangaLocation();
  const { era, setEra, year, setYear } = usePatroYearBrowse();
  const en = lang === "en";
  const yearLabel = digits(year);

  const query = useQuery({
    queryKey: panchakKeys.year(year, location.params),
    queryFn: () => fetchPanchakYear(year, location.params),
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
  });

  const periods = query.data?.periods.map(mapPanchakPeriod) ?? [];
  const cardWidth = width >= 1024 ? "49%" : "100%";

  return (
    <AppShell title={pick(`पञ्चक पात्रो ${yearLabel}`, `Panchak Patro ${yearLabel}`)} showHeader={false}>
      <PatroYearNavBlock
        era={era}
        onEraChange={setEra}
        year={year}
        onYearChange={setYear}
        location={location}
        onLocationChange={setLocation}
        onToday={() => setYear(getCurrentBs().year)}
      />

      <View
        style={{ backgroundColor: colors.surfaceInset, borderColor: colors.border }}
        className="mb-4 rounded-xl border px-4 py-3"
      >
        <Text className="text-sm leading-relaxed text-muted-foreground" style={nepaliTextStyle(14)}>
          {pick(
            "पञ्चक भन्नाले चन्द्रमाले पाँच विशेष नक्षत्रहरू (धनिष्ठाको उत्तरार्ध, शतभिषा, पूर्वाभाद्रपद, उत्तराभाद्रपद र रेवती) पार गर्ने पाँच दिनको अवधिलाई बुझिन्छ। वैदिक ज्योतिष अनुसार, यस अवधिमा केही निश्चित कार्यहरू नगर्न सल्लाह दिइन्छ किनभने पञ्चक कालमा गरिएका कार्यहरू पाँच पटक दोहोरिने धार्मिक विश्वास रहेको छ।",
            "Panchak is the roughly five-day span while the Moon transits the last half of Dhanishta, Shatabhisha, Purva Bhadrapada, Uttara Bhadrapada, and Revati. Many traditions advise avoiding certain acts during Panchak, believing work done then may repeat fivefold.",
          )}
        </Text>
      </View>

      {query.isLoading && !query.data ? (
        <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
          {pick("लोड हुँदै…", "Loading…")}
        </Text>
      ) : query.isError ? (
        <Text style={{ color: colors.destructive, ...nepaliTextStyle(14) }} className="text-sm">
          {pick("पञ्चक विवरण लोड गर्न सकिएन।", "Could not load Panchak details.")}
        </Text>
      ) : !periods.length ? (
        <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
          {pick(
            `${yearLabel} का लागि पञ्चक विवरण उपलब्ध छैन।`,
            `Panchak details for ${yearLabel} are not available yet.`,
          )}
        </Text>
      ) : (
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="warning-outline" size={16} color={colors.primary} />
            <Text className="text-base font-bold text-foreground" style={nepaliTextStyle(16)}>
              {pick(`${yearLabel} का पञ्चक अवधिहरू`, `Panchak windows for ${yearLabel}`)}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            {periods.map((period, i) => (
              <PanchakPeriodCard
                key={`${period.start.ad}-${period.end.ad}`}
                index={i}
                period={period}
                width={cardWidth}
              />
            ))}
          </View>
        </View>
      )}

      <View
        style={{ borderColor: colors.border }}
        className="mt-4 rounded-2xl border bg-card p-5"
      >
        <Text className="mb-3 text-base font-bold text-foreground" style={nepaliTextStyle(16)}>
          {pick("पञ्चकमा वर्जित गरिएका कार्यहरू", "Acts discouraged during Panchak")}
        </Text>
        <View className="gap-3">
          {PROHIBITED.map((item) => (
            <View key={item.en} className="border-b border-border pb-3">
              <Text className="text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
                {pick(item.ne, item.en)}
              </Text>
              <Text
                className="mt-0.5 text-sm leading-relaxed text-muted-foreground"
                style={nepaliTextStyle(14)}
              >
                {pick(item.descNe, item.descEn)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View
        style={{ borderColor: colors.border }}
        className="mt-4 gap-5 rounded-2xl border bg-card p-5"
      >
        <Text className="text-base font-bold text-foreground" style={nepaliTextStyle(16)}>
          {pick("पञ्चकको बारेमा बुझ्नुहोस्", "Understanding Panchak")}
        </Text>

        <View>
          <Text className="mb-1 text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
            {pick("पञ्चक के हो?", "What is Panchak?")}
          </Text>
          <Text
            className="text-sm leading-relaxed text-muted-foreground"
            style={nepaliTextStyle(14)}
          >
            {pick(
              "पञ्चक भन्नाले चन्द्रमाले पाँच विशेष नक्षत्रहरू (धनिष्ठाको उत्तरार्ध, शतभिषा, पूर्वाभाद्रपद, उत्तराभाद्रपद र रेवती) पार गर्ने पाँच दिनको अवधिलाई बुझिन्छ। यस अवधिमा दक्षिण यात्रा, तृण सङ्ग्रह, वा घरको छत हाल्ने जस्ता कार्यहरू नगर्न सल्लाह दिइन्छ।",
              "Panchak is the five-day lunar window through five special nakshatras (second half of Dhanishta through Revati). Travel south, gathering grass or firewood, and roofing a home are commonly avoided.",
            )}
          </Text>
        </View>

        <View>
          <Text className="mb-1 text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
            {pick("पञ्चक रहित मुहूर्तको महत्त्व", "Why Panchaka-rahita moment matters")}
          </Text>
          <Text
            className="text-sm leading-relaxed text-muted-foreground"
            style={nepaliTextStyle(14)}
          >
            {pick(
              "पञ्चक रहित विधिको प्रयोगले विवाह वा मुण्डन जस्ता शुभ कार्यहरू यी 'दोषयुक्त' समयभन्दा बाहिर तय भएको सुनिश्चित गर्दछ, जसले गर्दा कार्यहरू निर्विघ्न सम्पन्न हुन्छन्।",
              "Scheduling auspicious rites (vivaha, mundana, etc.) in Panchaka-rahita windows keeps them outside these inauspicious spans so the work may proceed smoothly.",
            )}
          </Text>
        </View>

        <View>
          <Text className="mb-2 text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
            {pick("पञ्चकका प्रकारहरू", "Types of Panchak by start weekday")}
          </Text>
          <View className="gap-2.5">
            {PANCHAK_VARIETIES.map((v) => (
              <Text
                key={v.id}
                className="text-sm leading-relaxed text-muted-foreground"
                style={nepaliTextStyle(14)}
              >
                <Text className="font-semibold text-foreground">{en ? v.labelEn : v.labelNe}</Text>
                {" — "}
                {en ? v.noteEn : v.noteNe}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </AppShell>
  );
}
