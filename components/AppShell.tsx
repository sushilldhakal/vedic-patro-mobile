import { ScrollView, Text, View } from "react-native";
import { floatingNavBottomPadding, PAGE_HORIZONTAL_PADDING } from "@/lib/mobile-nav";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useBreakpoint } from "@/lib/responsive";

export function AppShell({
  title,
  subtitle,
  children,
  headerRight,
  scroll = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  /** false when the screen manages its own scroll (e.g. nested lists). */
  scroll?: boolean;
}) {
  const { isTablet } = useBreakpoint();
  const header = (
    <View className="mb-4 flex-row items-start justify-between gap-3 py-1">
      <View className="min-w-0 flex-1">
        <Text
          className="text-xl font-bold text-foreground"
          style={[nepaliTextStyle(20), { paddingTop: 2, paddingBottom: 2 }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="mt-1 text-sm text-muted-foreground"
            style={[nepaliTextStyle(14), { paddingTop: 1 }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {headerRight}
    </View>
  );

  if (!scroll) {
    return (
      <View
        className="mx-auto w-full max-w-[1400px] flex-1 bg-background pt-4"
        style={{
          paddingBottom: floatingNavBottomPadding(isTablet),
          paddingHorizontal: PAGE_HORIZONTAL_PADDING,
        }}
      >
        {header}
        <View className="min-h-0 flex-1">{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="mx-auto w-full max-w-[1400px] pt-4"
      contentContainerStyle={{
        paddingBottom: floatingNavBottomPadding(isTablet),
        paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {header}
      {children}
    </ScrollView>
  );
}

export { LangToggle, LanguageSwitcher } from "@/components/LanguageSwitcher";
