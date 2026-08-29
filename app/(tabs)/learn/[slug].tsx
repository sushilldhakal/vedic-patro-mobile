import { useRef } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "@/components/AppShell";
import { LearnArticleView } from "@/components/learn/LearnArticleView";
import { Text } from "@/components/ui/Text";
import { LEARN_LIBRARY_BY_SLUG } from "@/lib/learn/learn-library";
import { RETIRED_SLUG_REDIRECTS } from "@/lib/learn/merged-pages";
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
  const scrollRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{ slug: string | string[]; chapter?: string }>();
  const slug = resolveSlug(params.slug);
  const { pick } = useLocale();

  const retiredTo = slug ? RETIRED_SLUG_REDIRECTS[slug] : undefined;
  if (retiredTo) {
    const [to, chapter] = retiredTo.split("#");
    return <Redirect href={chapter ? `/learn/${to}?chapter=${chapter}` : `/learn/${to}`} />;
  }

  const topic = slug ? LEARN_LIBRARY_BY_SLUG[slug] : undefined;
  const valid = Boolean(topic && topic.status === "published");

  return (
    <AppShell
      scroll
      scrollRef={scrollRef}
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
      title={topic ? pick(topic.title.ne, topic.title.en) : pick("सिकाइ", "Learn")}
      subtitle={pick("वैदिक पात्रो — मोबाइल लेख", "Vedic Patro — native article")}
    >
      {valid && slug ? (
        <LearnArticleView slug={slug} scrollRef={scrollRef} initialChapter={params.chapter} />
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
