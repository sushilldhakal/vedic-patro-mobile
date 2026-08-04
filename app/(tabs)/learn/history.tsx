import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppShell } from "@/components/AppShell";
import { Text } from "@/components/ui/Text";
import { getCurrentBs } from "@/lib/bs-calendar";
import { formatBbse } from "@/lib/history/era-dates";
import {
  HISTORY_ERA_NOTE,
  HISTORY_MILESTONES,
  HISTORY_SOURCE,
  SURYA_SIDDHANTA_HISTORY,
  type HistorySection,
} from "@/lib/history/surya-siddhanta-history";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { useBreakpoint } from "@/lib/responsive";
import { colorWithAlpha } from "@/lib/theme";
import { useThemeColors } from "@/lib/theme-context";

function SectionBody({ section }: { section: HistorySection }) {
  return (
    <View className="gap-4">
      {section.paragraphs.map((paragraph, i) => (
        <Text
          key={i}
          className="text-sm leading-relaxed text-muted-foreground"
          style={nepaliTextStyle(14)}
        >
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

/** Collapsible section — the web page's mobile accordion. */
function SectionAccordionItem({
  section,
  open,
  onToggle,
}: {
  section: HistorySection;
  open: boolean;
  onToggle: () => void;
}) {
  const colors = useThemeColors();
  return (
    <View className="border-b border-border">
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between gap-2 py-3 active:opacity-80"
      >
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="font-num text-xs text-muted-foreground">{section.kicker}</Text>
          <Text className="text-base font-semibold text-foreground" style={nepaliTextStyle(15)}>
            {section.title}
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={17}
          color={colors.mutedForeground}
        />
      </Pressable>
      {open ? (
        <View className="pb-4">
          <SectionBody section={section} />
        </View>
      ) : null}
    </View>
  );
}

export default function LearnHistoryScreen() {
  const { pick } = useLocale();
  const colors = useThemeColors();
  const router = useRouter();
  const { width } = useBreakpoint();
  const currentBsYear = getCurrentBs().year;
  const [openId, setOpenId] = useState(SURYA_SIDDHANTA_HISTORY[0]?.id ?? "");

  // Web: grid-cols-2 on phones, lg:grid-cols-4.
  const milestoneCols = width >= 1024 ? 4 : 2;
  const milestoneWidth = `${(100 / milestoneCols - 1.5).toFixed(2)}%`;

  return (
    <AppShell
      title={pick("मयासुरको सूर्य सिद्धान्त", "Mayasura's Surya Siddhanta")}
      subtitle={pick("इतिहास · खगोलशास्त्र सम्पदा", "History · astronomy heritage")}
    >
      <Pressable
        onPress={() => router.push("/learn" as never)}
        className="mb-4 flex-row items-center gap-1.5 self-start"
      >
        <Ionicons name="arrow-back" size={15} color={colors.mutedForeground} />
        <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
          {pick("ज्ञानकेन्द्र", "Learn hub")}
        </Text>
      </Pressable>

      <View
        style={{ borderColor: colors.border }}
        className="overflow-hidden rounded-2xl border bg-card p-5"
      >
        <Text
          style={{ color: colors.secondary, letterSpacing: 1, ...nepaliTextStyle(11) }}
          className="text-xs font-bold uppercase"
        >
          {pick("इतिहास · खगोलशास्त्र सम्पदा", "History · astronomy heritage")}
        </Text>
        <Text className="mt-1.5 text-2xl font-bold text-foreground" style={nepaliTextStyle(24)}>
          {pick("मयासुरको सूर्य सिद्धान्त", "Mayasura's Surya Siddhanta")}
        </Text>
        <Text
          className="mt-2 text-sm leading-relaxed text-muted-foreground"
          style={nepaliTextStyle(14)}
        >
          {pick(
            `८,८०० वर्ष पुरानो वैदिक पञ्चाङ्ग परम्परा — ${formatBbse(6778)} को ग्रहसंयोगदेखि युग चक्र, नक्षत्र स्थानान्तरण, र विश्वका पात्रोहरूमा प्रभावसम्म। सबै मिति पू.वि.सं. (~३०००–५८ ई.पू.) वा वि.सं. (५७ ई.पू. देखि) मा प्रस्तुत।`,
            `An 8,800-year-old Vedic panchanga tradition — from the ${formatBbse(6778)} conjunction through the yuga cycles, the nakshatra shift, and its influence on calendars worldwide. All dates are given in BBS (~3000–58 BCE) or BS (from 57 BCE).`,
          )}
        </Text>

        <Pressable
          onPress={() => void Linking.openURL(HISTORY_SOURCE.url)}
          style={{ borderColor: colors.border }}
          className="mt-6 flex-row items-center gap-2 self-start rounded-full border bg-card px-4 py-2 active:opacity-80"
        >
          <Ionicons name="videocam" size={15} color={colors.destructive} />
          <Text
            numberOfLines={2}
            className="shrink text-sm text-foreground"
            style={nepaliTextStyle(13)}
          >
            {HISTORY_SOURCE.title}
          </Text>
          <Ionicons name="open-outline" size={13} color={colors.mutedForeground} />
        </Pressable>

        <View className="mt-8 flex-row flex-wrap justify-between gap-3">
          {HISTORY_MILESTONES.map((m) => (
            <View
              key={m.label}
              style={{ width: milestoneWidth as never, borderColor: colors.border }}
              className="items-center rounded-xl border bg-background px-2 py-3"
            >
              <Text className="font-num text-lg font-bold text-foreground">{m.year}</Text>
              <Text
                className="mt-1 text-center text-xs text-muted-foreground"
                style={nepaliTextStyle(11)}
              >
                {m.label}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{ borderColor: colors.border, backgroundColor: colors.surfaceInset }}
          className="mt-6 gap-2 rounded-xl border px-4 py-3"
        >
          <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
            <Text className="font-semibold text-foreground">पू.वि.सं.</Text>
            {" — "}
            {HISTORY_ERA_NOTE.bbse}
          </Text>
          <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
            <Text className="font-semibold text-foreground">वि.सं.</Text>
            {" — "}
            {HISTORY_ERA_NOTE.bs} ({pick("आज", "today")} {toNepaliDigits(currentBsYear)})
          </Text>
        </View>

        <View className="mt-10">
          <View className="mb-4 flex-row items-center gap-2">
            <Ionicons name="document-text-outline" size={15} color={colors.secondary} />
            <Text className="text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
              {pick("विषयहरू", "Sections")}
            </Text>
          </View>
          <View
            style={{ borderColor: colors.border }}
            className="rounded-xl border bg-background px-3"
          >
            {SURYA_SIDDHANTA_HISTORY.map((section) => (
              <SectionAccordionItem
                key={section.id}
                section={section}
                open={openId === section.id}
                onToggle={() => setOpenId((id) => (id === section.id ? "" : section.id))}
              />
            ))}
          </View>
        </View>

        <View
          style={{ borderColor: colors.border, backgroundColor: colors.surfaceInset }}
          className="mt-10 items-center rounded-xl border p-6"
        >
          <Ionicons name="time-outline" size={30} color={colors.secondary} />
          <Text
            className="mt-4 text-center text-sm leading-relaxed text-muted-foreground"
            style={nepaliTextStyle(14)}
          >
            {pick(
              "यो पृष्ठ वृत्तचित्रको नेपाली प्रतिलेख हो — शैक्षिक उद्देश्यका लागि। विज्ञान र इतिहासका दावीहरू स्वतन्त्र रूपमा प्रमाणित गर्न सिफारिस गरिन्छ।",
              "This page is a Nepali transcript of the documentary, for educational purposes. Independently verifying its scientific and historical claims is recommended.",
            )}
          </Text>
          <Pressable
            onPress={() => router.push("/learn" as never)}
            className="mt-5 flex-row items-center gap-1.5"
          >
            <Ionicons name="book-outline" size={15} color={colors.secondary} />
            <Text style={{ color: colors.secondary, ...nepaliTextStyle(14) }} className="text-sm">
              {pick("ज्ञानकेन्द्रमा फर्कनुहोस्", "Back to the learn hub")}
            </Text>
          </Pressable>
        </View>
      </View>
    </AppShell>
  );
}
