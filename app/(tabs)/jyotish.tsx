import { Linking, Text, View } from "react-native";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n";

const LINKS = [
  {
    ne: "कुण्डली",
    en: "Kundali",
    descNe: "जन्म कुण्डली बनाउनुहोस्",
    descEn: "Generate birth chart",
    url: "https://vedicpatro.com/kundali",
  },
  {
    ne: "कुण्डली मिलान",
    en: "Kundali Milan",
    descNe: "विवाह योग्यता मिलान",
    descEn: "Marriage compatibility",
    url: "https://vedicpatro.com/jyotish/kundali-milan",
  },
];

export default function JyotishScreen() {
  const { pick } = useLocale();

  return (
    <AppShell
      title={pick("ज्योतिष", "Jyotish")}
      subtitle={pick("कुण्डली र ज्योतिष उपकरण", "Kundali and jyotish tools")}
    >
      <Card className="mb-4 gap-2">
        <Text className="text-sm leading-6 text-muted-foreground">
          {pick(
            "पूर्ण ज्योतिष सुविधा वेबमा उपलब्ध छ। छिट्टै मोबाइलमा पनि थपिनेछ।",
            "Full jyotish features are on the web app. Native mobile views are coming soon.",
          )}
        </Text>
      </Card>

      <View className="gap-3">
        {LINKS.map((link) => (
          <Card key={link.url} className="gap-2">
            <Text className="text-lg font-bold text-foreground">{pick(link.ne, link.en)}</Text>
            <Text className="text-sm text-muted-foreground">{pick(link.descNe, link.descEn)}</Text>
            <Button
              label={pick("वेबमा खोल्नुहोस्", "Open on web")}
              variant="outline"
              onPress={() => Linking.openURL(link.url)}
            />
          </Card>
        ))}
      </View>
    </AppShell>
  );
}
