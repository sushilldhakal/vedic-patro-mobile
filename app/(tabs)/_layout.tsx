import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "@/components/AppHeader";
import { FloatingNavBar } from "@/components/FloatingNavBar";
import { PanchangaTabsShell } from "@/components/panchanga/PanchangaTabsShell";
import { floatingNavTabBarHeight } from "@/lib/mobile-nav";
import { useBreakpoint } from "@/lib/responsive";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export default function TabsLayout() {
  const { resolvedTheme } = useTheme();
  const { isTablet } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const tabBarHeight = floatingNavTabBarHeight(isTablet, insets.bottom);

  return (
    <View
      className={cn("flex-1 bg-background", resolvedTheme === "dark" && "dark")}
      style={{ flex: 1 }}
    >
      <AppHeader />
      <View style={{ flex: 1 }}>
        <Tabs
          screenLayout={({ children }) => (
            <PanchangaTabsShell>{children}</PanchangaTabsShell>
          )}
          tabBar={() => <FloatingNavBar />}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: "transparent", flex: 1 },
            tabBarStyle: {
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: tabBarHeight,
              backgroundColor: "transparent",
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
            },
          }}
        />
      </View>
    </View>
  );
}
