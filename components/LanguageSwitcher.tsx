import { Pressable, Text } from "react-native";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const BTN =
  "h-9 items-center justify-center rounded-lg border border-border bg-card active:bg-muted shrink-0";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLocale();
  const isNepali = lang === "ne";

  return (
    <Pressable
      onPress={() => setLang(isNepali ? "en" : "ne")}
      className={cn(BTN, "min-w-[2.25rem] px-2.5", className)}
      accessibilityRole="button"
      accessibilityLabel={isNepali ? "Switch to English" : "Switch to Nepali"}
    >
      <Text className="text-xs font-semibold text-foreground">
        {isNepali ? "English" : "नेपाली"}
      </Text>
    </Pressable>
  );
}

/** @deprecated Use LanguageSwitcher */
export function LangToggle() {
  return <LanguageSwitcher />;
}
