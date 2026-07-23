import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { floatingNavBottomPadding, KUNDALI_SIDEBAR_SPLIT, PAGE_HORIZONTAL_PADDING } from "@/lib/mobile-nav";
import { useBreakpoint } from "@/lib/responsive";
import { useThemeColors } from "@/lib/theme-context";
import { PanchangaSidebarNav } from "./PanchangaSidebarNav";

type Props = {
  children: ReactNode;
};

const SIDEBAR_WIDTH = 224;

/** Left sidebar + main content — sidebar hidden on portrait phone; sticky split on landscape/tablet+. */
export function PanchangaShellLayout({ children }: Props) {
  const colors = useThemeColors();
  const { width, isTablet, isLandscape } = useBreakpoint();
  const showSidebar = width >= KUNDALI_SIDEBAR_SPLIT || isLandscape;

  const mainScrollProps = {
    className: "flex-1 bg-background" as const,
    contentContainerClassName: "mx-auto w-full max-w-[1600px] pt-4",
    contentContainerStyle: {
      paddingBottom: floatingNavBottomPadding(isTablet),
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    },
    showsVerticalScrollIndicator: false as const,
  };

  if (!showSidebar) {
    return (
      <ScrollView {...mainScrollProps}>
        <View className="gap-4">{children}</View>
      </ScrollView>
    );
  }

  /** RN sticky sidebar: fixed left rail; only main column scrolls. */
  return (
    <View className="flex-1 flex-row bg-background">
      <View
        style={{
          width: SIDEBAR_WIDTH,
          paddingTop: 16,
          paddingBottom: 12,
          paddingLeft: PAGE_HORIZONTAL_PADDING,
          paddingRight: 8,
          borderRightWidth: 1,
          borderRightColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          <PanchangaSidebarNav className="w-full border-0" />
        </ScrollView>
      </View>

      <ScrollView {...mainScrollProps}>
        <View className="gap-4">{children}</View>
      </ScrollView>
    </View>
  );
}
