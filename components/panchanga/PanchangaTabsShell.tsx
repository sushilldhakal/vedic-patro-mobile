import { createContext, useContext, type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { usePathname } from "expo-router";
import { normalizeMobilePathname, PAGE_HORIZONTAL_PADDING } from "@/lib/mobile-nav";
import {
  routeUsesOwnPanchangaSplitShell,
  shouldShowPanchangaSidebar,
} from "@/lib/panchanga-shell-paths";
import { PanchangaSidebarNav } from "./PanchangaSidebarNav";
import { PANCHANGA_SIDEBAR_RAIL_WIDTH, useShowPanchangaSidebar } from "./PanchangaSplitShell";
import { useThemeColors } from "@/lib/theme-context";

/** Matches web `PanchangaShellLayout` `gap-6` between sidebar and main column. */
const SHELL_SIDEBAR_GAP = 24;

const PanchangaTabsShellContext = createContext(false);

/** True when the active tab route uses the shared panchanga shell inset (web `PageShell` in-shell). */
export function useInPanchangaTabsShell() {
  return useContext(PanchangaTabsShellContext);
}

function isPanchangaShellRoute(pathname: string): boolean {
  return (
    shouldShowPanchangaSidebar(pathname) && !routeUsesOwnPanchangaSplitShell(pathname)
  );
}

/**
 * Wraps tab screens so the panchanga sidebar stays mounted across shell-route
 * navigations (web `PanchangaShellLayout` parity).
 */
export function PanchangaTabsShell({ children }: { children: ReactNode }) {
  const pathname = normalizeMobilePathname(usePathname());
  const colors = useThemeColors();
  const wideEnough = useShowPanchangaSidebar();
  const shellRoute = isPanchangaShellRoute(pathname);
  const showRail = shellRoute && wideEnough;

  if (!shellRoute) {
    return (
      <PanchangaTabsShellContext.Provider value={false}>
        <View className="min-h-0 flex-1">{children}</View>
      </PanchangaTabsShellContext.Provider>
    );
  }

  if (!showRail) {
    return (
      <PanchangaTabsShellContext.Provider value={true}>
        <View
          className="min-h-0 flex-1 bg-background"
          style={{
            paddingHorizontal: PAGE_HORIZONTAL_PADDING,
            paddingTop: 12,
          }}
        >
          {children}
        </View>
      </PanchangaTabsShellContext.Provider>
    );
  }

  return (
    <PanchangaTabsShellContext.Provider value={true}>
      <View
        className="min-h-0 flex-1 bg-background"
        style={{
          paddingHorizontal: PAGE_HORIZONTAL_PADDING,
          paddingTop: 16,
        }}
      >
        <View className="min-h-0 flex-1 flex-row" style={{ gap: SHELL_SIDEBAR_GAP }}>
          <View
            style={{
              width: PANCHANGA_SIDEBAR_RAIL_WIDTH,
              paddingBottom: 12,
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
      </View>
    </PanchangaTabsShellContext.Provider>
  );
}
