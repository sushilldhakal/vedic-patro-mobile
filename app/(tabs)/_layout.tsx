import { Tabs } from "expo-router";
import { View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { FloatingNavBar } from "@/components/FloatingNavBar";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export default function TabsLayout() {
  const { resolvedTheme } = useTheme();

  return (
    <View
      className={cn("flex-1 bg-background", resolvedTheme === "dark" && "dark")}
      style={{ flex: 1 }}
    >
      <Tabs
        tabBar={() => <FloatingNavBar />}
        screenLayout={({ children }) => (
          <View style={{ flex: 1 }}>
            <AppHeader />
            <View style={{ flex: 1 }}>{children}</View>
          </View>
        )}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
        }}
      />
    </View>
  );
}
