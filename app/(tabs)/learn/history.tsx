import { AppShell } from "@/components/AppShell";
import { VedicWebView } from "@/components/content/VedicWebView";
import { useLocale } from "@/lib/i18n";

export default function LearnHistoryScreen() {
  const { pick } = useLocale();
  return (
    <AppShell
      title={pick("मयासुरको सूर्य सिद्धान्त", "Mayasura's Surya Siddhanta")}
      subtitle={pick("इतिहास · सम्पदा", "History · heritage")}
    >
      <VedicWebView path="/learn/history" />
    </AppShell>
  );
}
