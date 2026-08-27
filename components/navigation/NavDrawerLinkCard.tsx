import { Pressable, Text, View } from "react-native";
import type { ReactNode } from "react";
import { AppNavIcon } from "@/components/icons/AppNavIcon";
import { useThemeColors } from "@/lib/theme-context";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { DrawerIconName } from "@/lib/drawer-icons";

/** Compact drawer tile — 3 per row, same as web `navDrawerCardClass`. */
export function NavDrawerLinkCard({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: DrawerIconName;
  active?: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "aspect-square w-[calc((100%-0.75rem)/3)] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 active:opacity-90",
        active ? "border-secondary/40 bg-secondary/10" : "border-border bg-card",
      )}
    >
      <AppNavIcon name={icon} size={20} color={active ? colors.secondary : colors.danger} />
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
        className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
        style={lang === "en" ? undefined : nepaliTextStyle(10)}
      >
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">{children}</View>
    </View>
  );
}
