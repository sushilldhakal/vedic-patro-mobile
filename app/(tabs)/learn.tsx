import { Linking, Text, View } from "react-native";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n";

export default function LearnScreen() {
  const { pick } = useLocale();

  return (
    <AppShell
      title={pick("सिकाइ", "Learn")}
      subtitle={pick("पात्रो, पञ्चाङ्ग र ज्योतिष शिक्षा", "Calendar, panchanga and jyotish guides")}
    >
      <Card className="gap-3">
        <Text className="text-base leading-6 text-muted-foreground">
          {pick(
            "वैदिक पात्रोका लेख, शब्दावली र मार्गदर्शन वेबमा उपलब्ध छन्।",
            "Articles, glossary, and guides from Vedic Patro are available on the website.",
          )}
        </Text>
        <Button
          label={pick("सिकाइ खण्ड खोल्नुहोस्", "Open Learn section")}
          onPress={() => Linking.openURL("https://vedicpatro.com/learn")}
        />
      </Card>
    </AppShell>
  );
}
