import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocale } from "@/lib/i18n";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

const BTN =
  "h-9 items-center justify-center rounded-lg border border-border bg-card active:bg-muted shrink-0";

export function ThemeSwitcher({ className }: { className?: string }) {
  const { isDark, setPreference, colors } = useTheme();
  const { pick } = useLocale();

  const toggle = () => setPreference(isDark ? "light" : "dark");

  return (
    <Pressable
      onPress={toggle}
      className={cn(BTN, "w-9", className)}
      accessibilityRole="button"
      accessibilityLabel={pick(isDark ? "उज्यालो मोड" : "अँध्यारो मोड", isDark ? "Light mode" : "Dark mode")}
    >
      <Ionicons
        name={isDark ? "sunny-outline" : "moon-outline"}
        size={16}
        color={colors.foreground}
      />
    </Pressable>
  );
}
