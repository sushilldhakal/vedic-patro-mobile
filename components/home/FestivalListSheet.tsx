import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CalendarDay } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { parseCivilIsoToDate } from "@/lib/patro-day";
import { useThemeColors } from "@/lib/theme-context";

type Props = {
  visible: boolean;
  day: CalendarDay | null;
  festivals: string[];
  onClose: () => void;
};

export function FestivalListSheet({ visible, day, festivals, onClose }: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { pick, digits, lang } = useLocale();

  if (!day) return null;

  const weekday = pick(day.weekday_ne ?? day.weekday, day.weekday_en ?? day.weekday);
  const adDate = parseCivilIsoToDate(day.date_ad).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            maxHeight: "70%",
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              className="text-base font-bold text-foreground"
              style={lang === "en" ? undefined : nepaliTextStyle(16)}
            >
              {pick("चाडपर्व", "Festivals")}
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground" style={lang === "en" ? undefined : nepaliTextStyle(14)}>
              {weekday} · {pick("वि.सं.", "BS")} {digits(day.day)} · {adDate}
            </Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {festivals.map((name, i) => (
              <View
                key={`${name}-${i}`}
                className="rounded-lg border border-border bg-muted/40 px-3 py-2.5"
              >
                <Text
                  className="text-sm font-semibold leading-snug text-foreground"
                  style={lang === "en" ? undefined : nepaliTextStyle(14)}
                >
                  {name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
