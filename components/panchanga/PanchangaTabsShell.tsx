import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { usePathname } from "expo-router";
import { normalizeMobilePathname } from "@/lib/mobile-nav";
import {
  routeUsesOwnPanchangaSplitShell,
  shouldShowPanchangaSidebar,
} from "@/lib/panchanga-shell-paths";
import { PanchangaSidebarNav } from "./PanchangaSidebarNav";
import { PANCHANGA_SIDEBAR_RAIL_WIDTH, useShowPanchangaSidebar } from "./PanchangaSplitShell";
import { PAGE_HORIZONTAL_PADDING } from "@/lib/mobile-nav";
import { useThemeColors } from "@/lib/theme-context";

/**
 * Wraps tab screens so the panchanga sidebar stays mounted across shell-route
 * navigations (web `PanchangaShellLayout` parity).
 */
export function PanchangaTabsShell({ children }: { children: ReactNode }) {
  const pathname = normalizeMobilePathname(usePathname());
  const colors = useThemeColors();
  const wideEnough = useShowPanchangaSidebar();
  const inShell =
    wideEnough &&
    shouldShowPanchangaSidebar(pathname) &&
    !routeUsesOwnPanchangaSplitShell(pathname);

  if (!inShell) {
    return <View className="min-h-0 flex-1">{children}</View>;
  }

  return (
    <View className="min-h-0 flex-1 flex-row bg-background">
      <View
        style={{
          width: PANCHANGA_SIDEBAR_RAIL_WIDTH,
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
      <View className="min-h-0 min-w-0 flex-1">{children}</View>
    </View>
  );
}
