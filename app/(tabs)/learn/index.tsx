import { useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { LEARN_CATEGORIES, topicsInCategory, type LearnTopicMeta } from "@/lib/learn/learn-topics-meta";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";
import type { MobileNavIcon } from "@/lib/mobile-nav";

function LearnTopicRow({ topic, onOpen }: { topic: LearnTopicMeta; onOpen: (slug: string) => void }) {
  const { pick } = useLocale();
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onOpen(topic.slug)}
      accessibilityRole="button"
      className="w-full"
    >
      <Card className="flex-row items-start gap-3 p-3">
        <Ionicons name={topic.icon as MobileNavIcon} size={22} color={colors.secondary} />
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-foreground">
            {pick(topic.titleNe, topic.titleEn)}
          </Text>
          <Text className="mt-0.5 text-sm leading-snug text-muted-foreground">
            {pick(topic.summary, topic.summaryEn)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </Card>
    </TouchableOpacity>
  );
}

export default function LearnScreen() {
  const { pick } = useLocale();
  const router = useRouter();

  const openTopic = (slug: string) => {
    if (slug === "history") {
      router.push("/learn/history");
      return;
    }
    router.push({
      pathname: "/learn/[slug]",
      params: { slug },
    });
  };

  return (
    <AppShell
      title={pick("सिकाइ", "Learn")}
      subtitle={pick("पात्रो, पञ्चाङ्ग र ज्योतिष — लेख र चित्र", "Calendar, panchanga & jyotish guides")}
    >
      {LEARN_CATEGORIES.map((cat) => {
        const topics = topicsInCategory(cat.id);
        if (topics.length === 0) return null;
        return (
          <View key={cat.id} className="mb-5">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {pick(cat.ne, cat.en)}
            </Text>
            <View className="gap-2">
              {topics.map((t) => (
                <LearnTopicRow key={t.slug} topic={t} onOpen={openTopic} />
              ))}
            </View>
          </View>
        );
      })}
    </AppShell>
  );
}
