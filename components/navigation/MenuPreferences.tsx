import { Text, View } from "react-native";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useLocale } from "@/lib/i18n";

/** Language + theme row — mirrors web drawer footer `MenuPreferences`. */
export function MenuPreferences() {
  const { pick } = useLocale();
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-sm text-foreground">{pick("भाषा", "Language")}</Text>
        <LanguageSwitcher />
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-sm text-foreground">{pick("थिम", "Theme")}</Text>
        <ThemeSwitcher showLabel />
      </View>
    </View>
  );
}
