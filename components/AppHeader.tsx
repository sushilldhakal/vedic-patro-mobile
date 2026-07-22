import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VedicPatroMark } from "@/components/branding/VedicPatroMark";
import { LangToggle } from "@/components/AppShell";
import { useLocale } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/responsive";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", ne: "पात्रो", en: "Calendar", icon: "calendar-outline" as const },
  { href: "/panchanga", ne: "पञ्चाङ्ग", en: "Panchanga", icon: "sunny-outline" as const },
  { href: "/holidays", ne: "बिदा", en: "Holidays", icon: "flag-outline" as const },
  { href: "/converter", ne: "रूपान्तर", en: "Convert", icon: "swap-horizontal-outline" as const },
  { href: "/more", ne: "थप", en: "More", icon: "ellipsis-horizontal-outline" as const },
];

export function AppHeader() {
  const { pick } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isCompact, width } = useBreakpoint();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (href: string) => {
    setMenuOpen(false);
    router.push(href as never);
  };

  return (
    <>
      <View
        style={{ paddingTop: insets.top }}
        className="border-b border-border bg-background/95"
      >
        <View
          style={{ maxWidth: 1400, width: "100%", alignSelf: "center" }}
          className="h-16 flex-row items-center justify-between px-4"
        >
          <Pressable
            onPress={() => go("/")}
            className="flex-row items-center gap-2.5 active:opacity-80"
          >
            <VedicPatroMark size={40} />
            <View className="flex-row items-baseline gap-1">
              <Text className="text-lg font-bold text-secondary">Vedic</Text>
              <Text className="text-lg font-bold text-foreground">Patro</Text>
            </View>
          </Pressable>

          <View className="flex-row items-center gap-2">
            {!isCompact && width >= 1024 ? (
              <View className="mr-2 flex-row items-center gap-1">
                {NAV.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Pressable
                      key={item.href}
                      onPress={() => go(item.href)}
                      className={cn(
                        "rounded-lg px-3 py-2",
                        active ? "bg-secondary/10" : "active:bg-muted",
                      )}
                    >
                      <Text
                        className={cn(
                          "text-sm font-semibold",
                          active ? "text-secondary" : "text-muted-foreground",
                        )}
                      >
                        {pick(item.ne, item.en)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            <LangToggle />
            {isCompact || width < 1024 ? (
              <Pressable
                onPress={() => setMenuOpen(true)}
                className="h-10 w-10 items-center justify-center rounded-lg active:bg-muted"
                accessibilityLabel={pick("मेनु", "Menu")}
              >
                <Ionicons name="menu-outline" size={24} color="#1a1410" />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <Modal visible={menuOpen} animationType="slide" transparent onRequestClose={() => setMenuOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setMenuOpen(false)} />
        <View className="max-h-[75%] rounded-t-2xl border-t border-border bg-card pb-8">
          <View className="flex-row items-center gap-3 border-b border-border px-4 py-4">
            <VedicPatroMark size={44} />
            <View>
              <Text className="text-lg font-bold text-foreground">{pick("वैदिक पात्रो", "Vedic Patro")}</Text>
              <Text className="text-xs text-muted-foreground">
                {pick("नेपाली पञ्चाङ्ग", "Nepali Panchanga")}
              </Text>
            </View>
          </View>
          <ScrollView className="px-2 pt-2">
            {NAV.map((item) => {
              const active =
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Pressable
                  key={item.href}
                  onPress={() => go(item.href)}
                  className={cn(
                    "mb-1 flex-row items-center gap-3 rounded-xl px-4 py-3.5",
                    active ? "bg-primary/10" : "active:bg-muted",
                  )}
                >
                  <Ionicons name={item.icon} size={22} color={active ? "#d97706" : "#5c4a3a"} />
                  <Text
                    className={cn(
                      "text-base",
                      active ? "font-bold text-primary" : "text-foreground",
                    )}
                  >
                    {pick(item.ne, item.en)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
