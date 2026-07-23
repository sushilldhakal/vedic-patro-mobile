import { Pressable, Text, View } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocale } from "@/lib/i18n";
import { FLOATING_NAV, isNavActive } from "@/lib/mobile-nav";
import { useBreakpoint } from "@/lib/responsive";
import { useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { nepaliTextStyle } from "@/lib/nepali-text";

export function FloatingNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { pick } = useLocale();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { isTablet, width } = useBreakpoint();

  const iconSize = isTablet ? 24 : 20;
  const barMaxWidth = isTablet ? Math.min(width - 40, 720) : undefined;

  return (
    <View
      pointerEvents="box-none"
      style={{ paddingBottom: Math.max(insets.bottom, isTablet ? 14 : 10) }}
      className={cn("absolute bottom-0 left-0 right-0", isTablet ? "px-5" : "px-3")}
    >
      <View
        style={{
          maxWidth: barMaxWidth,
          alignSelf: "center",
          width: "100%",
          shadowColor: "#1a1410",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 20,
          elevation: 14,
        }}
        className={cn(
          "flex-row items-stretch rounded-[28px] border border-border/80 bg-card/95",
          isTablet ? "px-2 py-2" : "px-1 py-1.5",
        )}
      >
        {FLOATING_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as never)}
              className={cn(
                "min-w-0 flex-1 items-center justify-center rounded-[22px]",
                isTablet ? "px-1 py-2.5" : "px-0.5 py-2",
                active && "bg-tab-active",
              )}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={item.icon}
                size={iconSize}
                color={active ? colors.primary : colors.mutedForeground}
              />
              <Text
                numberOfLines={2}
                className={cn(
                  "mt-1 min-h-[28px] text-center font-medium",
                  isTablet ? "text-[11px]" : "text-[10px]",
                  active ? "font-bold text-primary" : "text-muted-foreground",
                )}
                style={[nepaliTextStyle(isTablet ? 11 : 10), { paddingTop: 1 }]}
              >
                {pick(item.ne, item.en)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
