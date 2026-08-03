import { AppShell } from "@/components/AppShell";
import { VedicWebView } from "@/components/content/VedicWebView";
import { useLocale } from "@/lib/i18n";

export default function ShantiVidhiScreen() {
  const { pick } = useLocale();
  return (
    <AppShell
      title={pick("शान्ति विधि", "Shanti vidhi")}
      subtitle={pick("ग्रह शान्ति विधान", "Planetary peace rites")}
    >
      <VedicWebView path="/shanti-vidhi" />
    </AppShell>
  );
}
