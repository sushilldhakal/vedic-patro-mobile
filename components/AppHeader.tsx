import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VedicPatroMark } from "@/components/branding/VedicPatroMark";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";
import { DRAWER_NAV_EXTRA, FLOATING_NAV, isNavActive, PAGE_HORIZONTAL_PADDING } from "@/lib/mobile-nav";
import { cn } from "@/lib/utils";

const NAV = [...FLOATING_NAV, ...DRAWER_NAV_EXTRA];

function BrandMark({ onPress, centered }: { onPress: () => void; centered?: boolean }) {
  const { pick } = useLocale();
  return (
    <Pressable
      onPress={onPress}
      className={cn("min-w-0 flex-row items-center gap-2.5 active:opacity-80", centered && "justify-center")}
    >
      <VedicPatroMark size={42} />
      <Text className="text-base font-bold" numberOfLines={1}>
        <Text className="text-secondary">{pick("वैदिक", "Vedic")}</Text>
        <Text className="text-foreground"> {pick("पात्रो", "Patro")}</Text>
      </Text>
    </Pressable>
  );
}

export function AppHeader() {
  const { pick } = useLocale();
  const colors = useThemeColors();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (href: string) => {
    setMenuOpen(false);
    router.push(href as never);
  };

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="border-b border-border bg-background/95"
    >
      <View
        style={{
          maxWidth: 1400,
          width: "100%",
          alignSelf: "center",
          paddingHorizontal: PAGE_HORIZONTAL_PADDING,
        }}
        className="h-16 flex-row items-center"
      >
        {/* Left — hamburger */}
        <View className="flex-1 flex-row justify-start">
          <Pressable
            onPress={() => setMenuOpen(true)}
            className="h-10 w-10 items-center justify-center rounded-lg active:bg-muted"
            accessibilityLabel={pick("मेनु खोल्नुहोस्", "Open menu")}
          >
            <Ionicons name="menu-outline" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Center — brand */}
        <View className="shrink-0">
          <BrandMark onPress={() => go("/")} centered />
        </View>

        {/* Right — theme + language + account */}
        <View className="flex-1 flex-row items-center justify-end gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <AccountMenu />
        </View>
      </View>

      <NavDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={go}
        pathname={pathname}
      />
    </View>
  );
}

function NavDrawer({
  open,
  onClose,
  onNavigate,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
  pathname: string;
}) {
  const { pick } = useLocale();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.timing(slide, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(slide, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [open, mounted, slide]);

  if (!mounted) return null;

  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [-320, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        className="flex-1"
        style={{ opacity: slide, backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <Pressable className="flex-1" onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: 300,
          paddingTop: insets.top,
          transform: [{ translateX }],
          backgroundColor: colors.card,
        }}
        className="border-r border-border"
      >
        {/* Brand header */}
        <View
          className="flex-row items-center gap-2.5 border-b border-border py-4"
          style={{ paddingHorizontal: PAGE_HORIZONTAL_PADDING }}
        >
          <VedicPatroMark size={40} />
          <View className="min-w-0">
            <Text className="text-base font-bold">
              <Text className="text-secondary">{pick("वैदिक", "Vedic")}</Text>
              <Text className="text-foreground"> {pick("पात्रो", "Patro")}</Text>
            </Text>
            <Text className="text-xs text-muted-foreground">
              {pick("नेपाली पात्रो र पञ्चाङ्ग", "Nepali calendar and Panchanga")}
            </Text>
          </View>
        </View>

        {/* Nav */}
        <ScrollView className="flex-1" contentContainerClassName="p-3 gap-1">
          {NAV.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Pressable
                key={item.href}
                onPress={() => onNavigate(item.href)}
                className={cn(
                  "flex-row items-center gap-3 rounded-lg px-3 py-2.5",
                  active ? "bg-secondary/10" : "active:bg-muted",
                )}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={active ? colors.secondary : colors.mutedForeground}
                />
                <Text
                  className={cn(
                    "text-sm",
                    active ? "font-semibold text-secondary" : "text-foreground",
                  )}
                >
                  {pick(item.ne, item.en)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
