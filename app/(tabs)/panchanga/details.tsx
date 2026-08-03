import { AppShell } from "@/components/AppShell";
import { PanchangaDirectoryMobile } from "@/components/panchanga/PanchangaDirectoryMobile";
import { useLocale } from "@/lib/i18n";

export default function PanchangaDetailsScreen() {
  const { pick } = useLocale();
  return (
    <AppShell
      title={pick("पञ्चाङ्ग विवरण", "Panchanga details")}
      subtitle={pick("प्रत्येक तत्त्वको छुट्टै पृष्ठ", "Every element on its own page")}
    >
      <PanchangaDirectoryMobile />
    </AppShell>
  );
}
