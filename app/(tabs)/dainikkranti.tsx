import { Linking, Text } from "react-native";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n";

export default function DainikKrantiScreen() {
  const { pick } = useLocale();

  return (
    <AppShell
      title={pick("दैनिक क्रान्ति", "Daily Transit")}
      subtitle={pick("ग्रह गोचर र दैनिक पात्रो", "Planetary transit and daily patro")}
    >
      <Card className="gap-3">
        <Text className="text-base leading-6 text-muted-foreground">
          {pick(
            "मासिक गोचर, लग्न मण्डल र ग्रह स्पष्ट विवरण वेबमा उपलब्ध छ। मोबाइल संस्करण चाँडै थपिनेछ।",
            "Monthly gochar, lagna matrix, and graha details are on the web app. A native mobile view is coming soon.",
          )}
        </Text>
        <Button
          label={pick("दैनिक क्रान्ति खोल्नुहोस्", "Open Daily Transit")}
          onPress={() => Linking.openURL("https://vedicpatro.com/dainikkranti")}
        />
      </Card>
    </AppShell>
  );
}
