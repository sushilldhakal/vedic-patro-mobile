import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "@/components/AppShell";
import { LearnArticleView } from "@/components/learn/LearnArticleView";
import { Text } from "@/components/ui/Text";
import { LEARN_SLUGS, LEARN_TOPIC_METAS } from "@/lib/learn/learn-topics-meta";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";

function resolveSlug(raw: string | string[] | undefined): string | undefined {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw[0];
  return undefined;
}

export default function LearnArticleScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ slug: string | string[] }>();
  const slug = resolveSlug(params.slug);
  const { pick } = useLocale();
  const meta = slug ? LEARN_TOPIC_METAS.find((t) => t.slug === slug) : undefined;
  const valid = Boolean(slug && LEARN_SLUGS.has(slug) && slug !== "history");

  return (
    <AppShell
      scroll
      headerRight={
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-lg active:bg-muted"
          accessibilityLabel={pick("पछाडि", "Back")}
        >
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
      }
      title={meta ? pick(meta.titleNe, meta.titleEn) : pick("सिकाइ", "Learn")}
      subtitle={pick("वैदिक पात्रो — मोबाइल लेख", "Vedic Patro — native article")}
    >
      {valid && slug ? (
        <LearnArticleView slug={slug} />
      ) : (
        <View className="items-center justify-center py-12">
          <Text className="text-center text-sm text-muted-foreground">
            {pick("लेख फेला परेन।", "Article not found.")}
          </Text>
          <Pressable onPress={() => router.replace("/learn")} className="mt-4 active:opacity-80">
            <Text className="text-sm font-semibold text-primary">{pick("सिकाइमा फर्कनुहोस्", "Back to Learn")}</Text>
          </Pressable>
        </View>
      )}
    </AppShell>
  );
}
