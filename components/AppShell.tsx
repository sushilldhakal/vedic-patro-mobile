import { ScrollView, Text, View } from "react-native";
import { floatingNavBottomPadding } from "@/lib/mobile-nav";
import { useBreakpoint } from "@/lib/responsive";

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
  const { isTablet } = useBreakpoint();
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="mx-auto w-full max-w-[1400px] px-4 pt-4 md:px-6"
      contentContainerStyle={{ paddingBottom: floatingNavBottomPadding(isTablet) }}
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

export { LangToggle, LanguageSwitcher } from "@/components/LanguageSwitcher";
