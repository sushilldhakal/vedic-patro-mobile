import { useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { LEARN_CATEGORIES, topicsInCategory, type LearnTopicMeta } from "@/lib/learn/learn-topics-meta";
import { hrefForLearnSlug } from "@/lib/learn/learn-href";
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
  const colors = useThemeColors();

  const openTopic = (slug: string) => {
    router.push(hrefForLearnSlug(slug));
  };

  return (
    <AppShell
      title={pick("सिकाइ", "Learn")}
      subtitle={pick("पात्रो, पञ्चाङ्ग र ज्योतिष — लेख र ३D चित्र", "Calendar, panchanga & jyotish — with 3D diagrams")}
    >
      <View className="mb-5 gap-2">
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/learn/history")}>
          <Card className="flex-row items-center gap-3 border-secondary/30 bg-secondary/5 p-3">
            <Ionicons name="time-outline" size={24} color={colors.secondary} />
            <View className="flex-1">
              <Text className="font-semibold text-foreground">{pick("इतिहास", "History")}</Text>
              <Text className="text-xs text-muted-foreground">
                {pick("सूर्य सिद्धान्त र पात्रोको जग", "Surya Siddhanta & patro heritage")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Card>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} onPress={() => openTopic("how-we-calculate")}>
          <Card className="flex-row items-center gap-3 p-3">
            <Ionicons name="server-outline" size={24} color={colors.secondary} />
            <View className="flex-1">
              <Text className="font-semibold text-foreground">
                {pick("हामी यो कसरी गणना गर्छौं", "How we calculate")}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {pick("API + ३D सौर्यमण्डल", "API pipeline + 3D orbits")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Card>
        </TouchableOpacity>
      </View>

      {LEARN_CATEGORIES.map((cat) => {
        const topics = topicsInCategory(cat.id).filter((t) => t.slug !== "history");
        if (topics.length === 0) return null;
        return (
          <View key={cat.id} className="mb-5">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {pick(cat.ne, cat.en)}
            </Text>
            <View className="gap-2">
              {topics
                .filter((t) => t.slug !== "how-we-calculate")
                .map((t) => (
                <LearnTopicRow key={t.slug} topic={t} onOpen={openTopic} />
              ))}
            </View>
          </View>
        );
      })}
    </AppShell>
  );
}
