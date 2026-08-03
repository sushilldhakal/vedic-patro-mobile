import { AppShell } from "@/components/AppShell";
import { VedicWebView } from "@/components/content/VedicWebView";
import { useLocale } from "@/lib/i18n";

export default function AvakahadaScreen() {
  const { pick } = useLocale();
  return (
    <AppShell
      title={pick("अवकहडा चक्र", "Avakahada chakra")}
      subtitle={pick("जन्म विवरण चक्र", "Birth matrix wheel")}
    >
      <VedicWebView path="/panchanga/avakahada-chakra" />
    </AppShell>
  );
}
