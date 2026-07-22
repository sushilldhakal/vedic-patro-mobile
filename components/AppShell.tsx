import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLocale } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/responsive";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", icon: "calendar-outline" as const, ne: "पात्रो", en: "Calendar" },
  { href: "/panchanga", icon: "sunny-outline" as const, ne: "पञ्चाङ्ग", en: "Panchanga" },
  { href: "/holidays", icon: "flag-outline" as const, ne: "बिदा", en: "Holidays" },
  { href: "/converter", icon: "swap-horizontal-outline" as const, ne: "रूपान्तर", en: "Convert" },
  { href: "/more", icon: "ellipsis-horizontal-outline" as const, ne: "थप", en: "More" },
];

export function AppShell({
  title,
  subtitle,
  children,
  headerRight,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="mx-auto w-full max-w-[1400px] px-4 pb-28 pt-4 md:px-6"
    >
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-2xl font-bold text-foreground">{title}</Text>
          {subtitle ? (
            <Text className="mt-0.5 text-sm text-muted-foreground">{subtitle}</Text>
          ) : null}
        </View>
        {headerRight}
      </View>
      {children}
    </ScrollView>
  );
}

export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { pick } = useLocale();
  const { isCompact } = useBreakpoint();

  if (!isCompact) return null;

  return (
    <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-card px-1 pb-6 pt-2">
      <View className="flex-row">
        {TABS.map((tab) => {
          const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          return (
            <Pressable
              key={tab.href}
              onPress={() => router.push(tab.href as never)}
              className="flex-1 items-center py-1"
            >
              <Ionicons name={tab.icon} size={22} color={active ? "#d97706" : "#5c4a3a"} />
              <Text
                className={cn(
                  "mt-0.5 text-[10px]",
                  active ? "font-semibold text-primary" : "text-muted-foreground",
                )}
              >
                {pick(tab.ne, tab.en)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function LangToggle() {
  const { lang, setLang } = useLocale();
  return (
    <Pressable
      onPress={() => setLang(lang === "ne" ? "en" : "ne")}
      className="rounded-full border border-border bg-muted px-3 py-1.5"
    >
      <Text className="text-xs font-semibold text-foreground">{lang === "ne" ? "EN" : "ने"}</Text>
    </Pressable>
  );
}
