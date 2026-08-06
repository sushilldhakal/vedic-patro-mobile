import { Tabs } from "expo-router";
import { View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { FloatingNavBar } from "@/components/FloatingNavBar";
import { PanchangaTabsShell } from "@/components/panchanga/PanchangaTabsShell";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export default function TabsLayout() {
  const { resolvedTheme } = useTheme();

  return (
    <View
      className={cn("flex-1 bg-background", resolvedTheme === "dark" && "dark")}
      style={{ flex: 1 }}
    >
      <AppHeader />
      <PanchangaTabsShell>
        <View style={{ flex: 1 }}>
          <Tabs
            tabBar={() => <FloatingNavBar />}
            screenOptions={{
              headerShown: false,
              sceneStyle: { backgroundColor: "transparent", flex: 1 },
            }}
          />
        </View>
      </PanchangaTabsShell>
    </View>
  );
}
