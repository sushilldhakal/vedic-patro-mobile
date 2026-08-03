import { useLocalSearchParams } from "expo-router";
import { AppShell } from "@/components/AppShell";
import { VedicWebView } from "@/components/content/VedicWebView";
import { LEARN_SLUGS, LEARN_TOPIC_METAS } from "@/lib/learn/learn-topics-meta";
import { useLocale } from "@/lib/i18n";

export default function LearnArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { pick } = useLocale();
  const meta = LEARN_TOPIC_METAS.find((t) => t.slug === slug);
  const valid = slug && LEARN_SLUGS.has(slug) && slug !== "history";

  return (
    <AppShell
      title={meta ? pick(meta.titleNe, meta.titleEn) : pick("सिकाइ", "Learn")}
      subtitle={pick("वैदिक पात्रो लेख", "Vedic Patro article")}
    >
      {valid ? <VedicWebView path={`/learn/${slug}`} /> : null}
    </AppShell>
  );
}
