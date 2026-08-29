import type { RefObject } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import {
  LEARN_LIBRARY_BY_SLUG,
  LEARN_SECTIONS_BY_ID,
  adjacentPublishedTopics,
  type LibraryTopic,
} from "@/lib/learn/learn-library";
import { MERGED_BY_SLUG } from "@/lib/learn/merged-pages";
import { DATA_ARTICLES } from "@/lib/learn/articles";
import { MergedArticleBody } from "@/components/learn/MergedArticleBody";
import { ArticleBody } from "@/components/learn/article-render";
import { hrefForLearnSlug } from "@/lib/learn/learn-href";
import { hasTwoSystems, playgroundFor } from "@/lib/learn/playground-config";
import { DayPlayground } from "@/components/learn/playground/DayPlayground";
import { TwoSystemsStudy } from "@/components/learn/playground/TwoSystemsStudy";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useThemeColors } from "@/lib/theme-context";

function TopicNavCard({
  topic,
  direction,
  onPress,
}: {
  topic: LibraryTopic;
  direction: "prev" | "next";
  onPress: () => void;
}) {
  const { pick } = useLocale();
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className="min-w-0 flex-1 rounded-xl border border-border bg-card p-3 active:opacity-90"
    >
      <View className={`flex-row items-center gap-2 ${direction === "next" ? "justify-end" : ""}`}>
        {direction === "prev" ? (
          <Ionicons name="chevron-back" size={18} color={colors.secondary} />
        ) : null}
        <View className={`min-w-0 flex-1 ${direction === "next" ? "items-end" : ""}`}>
          <Text className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
            {direction === "prev" ? pick("अघिल्लो", "Previous") : pick("अर्को", "Next")}
          </Text>
          <Text numberOfLines={2} className="text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
            {pick(topic.title.ne, topic.title.en)}
          </Text>
        </View>
        {direction === "next" ? (
          <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
        ) : null}
      </View>
    </Pressable>
  );
}

export function LearnArticleView({
  slug,
  scrollRef,
  initialChapter,
}: {
  slug: string;
  scrollRef?: RefObject<ScrollView | null>;
  initialChapter?: string;
}) {
  const router = useRouter();
  const { pick } = useLocale();
  const colors = useThemeColors();
  const topic = LEARN_LIBRARY_BY_SLUG[slug];
  const section = topic ? LEARN_SECTIONS_BY_ID[topic.section] : undefined;
  const merged = MERGED_BY_SLUG[slug];
  const data = DATA_ARTICLES[slug];
  const { prev, next } = adjacentPublishedTopics(slug);
  /* Not every topic gets one, and that is the point: a topic with no entry in
     the config is one the sim cannot honestly illustrate. The two sets are
     disjoint — no guide carries two WebGL canvases. */
  const playground = playgroundFor(slug);
  const twoSystems = hasTwoSystems(slug);

  if (!topic || (!merged && !data)) {
    return (
      <View className="items-center justify-center py-12">
        <Text className="text-center text-muted-foreground">{pick("लेख फेला परेन।", "Article not found.")}</Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {section ? `${pick(section.title.ne, section.title.en)} · ` : ""}
          {pick(topic.title.ne, topic.title.en)}
        </Text>
        <Text className="text-sm leading-snug text-muted-foreground" style={nepaliTextStyle(14)}>
          {pick(topic.summary.ne, topic.summary.en)}
        </Text>
      </View>

      <View className="rounded-2xl border border-border bg-card p-4">
        {merged ? (
          <MergedArticleBody page={merged} scrollRef={scrollRef} initialChapter={initialChapter} />
        ) : data ? (
          <ArticleBody article={data} />
        ) : null}
      </View>

      {/* Below the prose rather than inside it: the playground is the whole
          guide's instrument, not one figure in an argument, and every one of
          its layers reaches past whatever chapter it would otherwise sit in. */}
      {playground ? (
        <DayPlayground
          config={playground}
          title={pick(`${topic.title.ne} · आकाश`, `${topic.title.en} · sky`)}
        />
      ) : null}
      {twoSystems ? (
        <TwoSystemsStudy title={pick(`${topic.title.ne} · सौरमान र चान्द्रमान`, `${topic.title.en} · two systems`)} />
      ) : null}

      <View className="flex-row gap-2">
        {prev ? (
          <TopicNavCard topic={prev} direction="prev" onPress={() => router.push(hrefForLearnSlug(prev.slug))} />
        ) : (
          <View className="flex-1" />
        )}
        {next ? (
          <TopicNavCard topic={next} direction="next" onPress={() => router.push(hrefForLearnSlug(next.slug))} />
        ) : (
          <View className="flex-1" />
        )}
      </View>

      <Pressable
        onPress={() => router.push("/learn")}
        className="flex-row items-center justify-center gap-1.5 py-3 active:opacity-80"
      >
        <Ionicons name="book-outline" size={16} color={colors.secondary} />
        <Text className="text-sm font-semibold text-secondary" style={nepaliTextStyle(14)}>
          {pick("सबै विषय", "All topics")}
        </Text>
      </Pressable>
    </View>
  );
}
