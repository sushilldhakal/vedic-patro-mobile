import { Slot } from "expo-router";
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
      <AppHeader />
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <FloatingNavBar />
    </View>
  );
}
