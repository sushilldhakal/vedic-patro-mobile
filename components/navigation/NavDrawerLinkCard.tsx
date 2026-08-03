import { Pressable, Text, View } from "react-native";
import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/lib/theme-context";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { MobileNavIcon } from "@/lib/mobile-nav";

/** Compact drawer tile — 3 per row, matches web `NavDrawerLinkCard`. */
export function NavDrawerLinkCard({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: MobileNavIcon;
  active?: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "aspect-square w-[31%] max-w-[7.5rem] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border px-1.5 py-2.5 active:opacity-90",
        active ? "border-secondary/40 bg-secondary/10" : "border-border bg-card",
      )}
    >
      <Ionicons name={icon} size={20} color={active ? colors.secondary : colors.mutedForeground} />
      <Text
        className={cn(
          "w-full text-center text-[11px] font-bold leading-tight text-foreground",
          active && "text-secondary",
        )}
        numberOfLines={3}
        style={nepaliTextStyle(11)}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function DrawerNavSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { lang } = useLocale();
  return (
    <View className="px-3 pb-4">
      <Text
        className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground"
        style={lang === "en" ? undefined : nepaliTextStyle(12)}
      >
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">{children}</View>
    </View>
  );
}
