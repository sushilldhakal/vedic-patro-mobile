import { Linking, Text, View } from "react-native";
import { AppShell, LangToggle } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { API_BASE } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/responsive";

const LINKS = [
  { ne: "वेबसाइट", en: "Website", url: "https://vedicpatro.com" },
  { ne: "कुण्डली", en: "Kundali", url: "https://vedicpatro.com/kundali" },
  { ne: "विवाह साइत", en: "Marriage muhurta", url: "https://vedicpatro.com/vivah-sait" },
  { ne: "दैनिक क्रान्ति", en: "Daily transit", url: "https://vedicpatro.com/dainikkranti" },
];

export default function MoreScreen() {
  const { pick } = useLocale();
  const { isTablet } = useBreakpoint();

  return (
    <AppShell
      title={pick("थप", "More")}
      subtitle={pick("वैदिक पात्रो मोबाइल", "Vedic Patro Mobile")}
      headerRight={<LangToggle />}
    >
      <View className={isTablet ? "flex-row flex-wrap gap-4" : "gap-4"}>
        <Card className={isTablet ? "min-w-[45%] flex-1" : ""}>
          <Text className="mb-2 text-base font-semibold text-foreground">
            {pick("यस एपमा", "In this app")}
          </Text>
          <Text className="text-sm leading-6 text-muted-foreground">
            {pick(
              "पात्रो, दैनिक पञ्चाङ्ग, बिदा सूची, र AD/BS रूपान्तर — सबै vedicpatro.com API बाट। फोन, ट्याबलेट, iPad र Android ट्याबलेटमा responsive layout।",
              "Calendar, daily panchanga, holidays, and AD/BS converter — all powered by the vedicpatro.com API. Responsive on phone, tablet, iPad, and Android tablets.",
            )}
          </Text>
        </Card>

        <Card className={isTablet ? "min-w-[45%] flex-1" : ""}>
          <Text className="mb-2 text-base font-semibold text-foreground">
            {pick("API", "API")}
          </Text>
          <Text className="mb-3 font-mono text-xs text-muted-foreground">{API_BASE}</Text>
          <Text className="text-sm text-muted-foreground">
            {pick("सर्वर:", "Server:")} vedicpatro.com
          </Text>
        </Card>

        <Card className={isTablet ? "w-full" : ""}>
          <Text className="mb-3 text-base font-semibold text-foreground">
            {pick("वेबमा खोल्नुहोस्", "Open on web")}
          </Text>
          {LINKS.map((link) => (
            <Button
              key={link.url}
              label={pick(link.ne, link.en)}
              variant="outline"
              className="mb-2"
              onPress={() => Linking.openURL(link.url)}
            />
          ))}
        </Card>

        <Card>
          <Text className="text-sm text-muted-foreground">
            {pick("संस्करण 1.0.0 · Mukta + Fira Code fonts", "Version 1.0.0 · Mukta + Fira Code fonts")}
          </Text>
        </Card>
      </View>
    </AppShell>
  );
}
