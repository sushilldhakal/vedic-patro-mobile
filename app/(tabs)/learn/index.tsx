import { useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { LEARN_SECTIONS, publishedInSection, type LibraryTopic } from "@/lib/learn/learn-library";
import { hrefForLearnSlug } from "@/lib/learn/learn-href";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";

function LearnTopicRow({ topic, onOpen }: { topic: LibraryTopic; onOpen: (slug: string) => void }) {
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
        <Ionicons name={topic.icon} size={22} color={colors.secondary} />
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-foreground">{pick(topic.title.ne, topic.title.en)}</Text>
          <Text className="mt-0.5 text-sm leading-snug text-muted-foreground">
            {pick(topic.summary.ne, topic.summary.en)}
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
      {LEARN_SECTIONS.map((section) => {
        const topics = publishedInSection(section.id);
        if (topics.length === 0) return null;
        return (
          <View key={section.id} className="mb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <Ionicons name={section.icon} size={16} color={colors.secondary} />
              <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {pick(section.title.ne, section.title.en)}
              </Text>
            </View>
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
