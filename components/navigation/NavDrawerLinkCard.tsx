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
      /* A fixed height, not `aspect-square`.
       *
       * The tile used to be `aspect-square w-[calc((100%-0.75rem)/3)]`, which
       * ties its width to its own content height: a label that needs a third
       * line makes the tile taller, and `aspectRatio: 1` then makes it just as
       * much wider. So one long name blew a tile up to several times the size
       * of its neighbours, the row overflowed, and tiles from other rows were
       * drawn across each other — which is what raising the label size set
       * off. (`calc()` is web CSS and does not resolve reliably on native
       * either, so the widths were never dependable to begin with.)
       *
       * Height fixed and width a flat percentage, the grid is the same three
       * columns whatever the labels say, and the text wraps inside a box that
       * cannot grow. */
      style={{ width: "31.5%", height: 88 }}
      className={cn(
        "shrink-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border px-1 py-2 active:opacity-90",
        active ? "border-secondary/40 bg-secondary/10" : "border-border bg-card",
      )}
    >
      <AppNavIcon name={icon} size={20} color={active ? colors.secondary : colors.danger} />
      <Text
        className={cn(
          "w-full text-center text-[12px] font-bold leading-tight text-foreground",
          active && "text-secondary",
        )}
        numberOfLines={2}
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
        className="mb-2 text-center text-[12px] font-bold uppercase tracking-wider text-muted-foreground"
        style={lang === "en" ? undefined : nepaliTextStyle(10)}
      >
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">{children}</View>
    </View>
  );
}
